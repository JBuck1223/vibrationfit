import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe } from '@/lib/stripe/config'
import { resolveStripePriceId, getAddonPrice } from '@/lib/billing/products'
import {
  getActiveMembershipSubscription,
  isPayPalSubscription,
  getVaultMethod,
  remainingCycleFraction,
  chargeMemberVault,
  recomputeSubscriptionAmount,
} from '@/lib/paypal/vault-billing'
import type Stripe from 'stripe'

const MAX_QUANTITY = 10

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { addonType, quantity } = (await request.json()) as {
      addonType: 'tokens' | 'storage' | 'seats'
      quantity: number
    }

    if (!addonType || !['tokens', 'storage', 'seats'].includes(addonType)) {
      return NextResponse.json({ error: 'Invalid addon type' }, { status: 400 })
    }

    const requestedQuantity = Number.isInteger(quantity) ? quantity : 1
    if (requestedQuantity < 1 || requestedQuantity > MAX_QUANTITY) {
      return NextResponse.json({ error: `Quantity must be between 1 and ${MAX_QUANTITY}` }, { status: 400 })
    }

    // ── PayPal / DB-driven: add-on becomes a subscription_addons row the
    //    billing cron sums into each renewal and grants every cycle. ──
    const serviceClient = createServiceClient()
    const dbSub = await getActiveMembershipSubscription(serviceClient, user.id)
    if (dbSub && isPayPalSubscription(dbSub)) {
      if (addonType === 'seats') {
        return NextResponse.json({
          error: 'Seats are added through the household "Add Family Member" flow.',
        }, { status: 400 })
      }

      const intervalKey = dbSub.membership_tiers?.billing_interval === 'year' ? 'annual' : '28day'
      const addonPrice = await getAddonPrice(addonType, intervalKey)
      if (!addonPrice) {
        return NextResponse.json(
          { error: `Add-on price not configured for ${addonType} (${intervalKey})` },
          { status: 500 },
        )
      }

      const { data: existingAddon } = await serviceClient
        .from('subscription_addons')
        .select('id, quantity')
        .eq('subscription_id', dbSub.id)
        .eq('addon_type', addonType)
        .eq('status', 'active')
        .maybeSingle()

      const currentQuantity = existingAddon?.quantity || 0
      const addedQuantity = requestedQuantity - currentQuantity

      // Prorated charge for newly added units in the current cycle
      if (addedQuantity > 0) {
        const fraction = remainingCycleFraction(dbSub)
        const prorationCents = Math.round(addedQuantity * addonPrice.unitAmount * fraction)
        if (prorationCents > 0) {
          const vault = await getVaultMethod(serviceClient, user.id, dbSub.payment_method_id)
          if (!vault) {
            return NextResponse.json({ error: 'No payment method on file. Please update your card first.' }, { status: 402 })
          }
          try {
            await chargeMemberVault({
              serviceClient,
              userId: user.id,
              subscriptionId: dbSub.id,
              vault,
              amountCents: prorationCents,
              description: `${addonType === 'tokens' ? 'Token' : 'Storage'} add-on — prorated for current cycle`,
              requestId: `addon-${dbSub.id}-${addonType}-${requestedQuantity}-${dbSub.next_billing_at || 'trial'}`,
              metadata: { addon_type: addonType, quantity_added: addedQuantity },
            })
          } catch (err: any) {
            return NextResponse.json({ error: err?.message || 'Card declined' }, { status: 402 })
          }
        }
      }

      let addonRowId: string
      if (existingAddon) {
        await serviceClient
          .from('subscription_addons')
          .update({
            quantity: requestedQuantity,
            unit_amount_cents: addonPrice.unitAmount,
            grant_amount: addonPrice.grantAmount,
            grant_unit: addonPrice.grantUnit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingAddon.id)
        addonRowId = existingAddon.id
      } else {
        const { data: newAddon } = await serviceClient
          .from('subscription_addons')
          .insert({
            subscription_id: dbSub.id,
            addon_type: addonType,
            quantity: requestedQuantity,
            unit_amount_cents: addonPrice.unitAmount,
            grant_amount: addonPrice.grantAmount,
            grant_unit: addonPrice.grantUnit,
            status: 'active',
            metadata: { price_id: addonPrice.priceId, source: 'add_to_subscription' },
          })
          .select('id')
          .single()
        addonRowId = newAddon?.id
      }

      await recomputeSubscriptionAmount(serviceClient, dbSub.id)

      // Immediate grants for this cycle
      if (addonType === 'tokens' && addedQuantity > 0 && addonPrice.grantAmount > 0) {
        const { recordTokenPackPurchase } = await import('@/lib/tokens/transactions')
        await recordTokenPackPurchase(
          user.id,
          'token_addon',
          addonPrice.grantAmount * addedQuantity,
          addonPrice.unitAmount * addedQuantity,
          '',
          '',
          { source: 'subscription_addon', provider: 'paypal', quantity: addedQuantity },
          serviceClient,
        )
      } else if (addonType === 'storage' && addonRowId && addonPrice.grantAmount > 0) {
        // One persistent quota row per addon, sized to the current quantity
        const quota = addonPrice.grantAmount * requestedQuantity
        const { data: existingStorage } = await serviceClient
          .from('user_storage')
          .select('id')
          .eq('subscription_id', dbSub.id)
          .eq('metadata->>subscription_addon_id', addonRowId)
          .maybeSingle()
        if (existingStorage) {
          await serviceClient.from('user_storage').update({ quota_gb: quota }).eq('id', existingStorage.id)
        } else {
          await serviceClient.from('user_storage').insert({
            user_id: user.id,
            quota_gb: quota,
            subscription_id: dbSub.id,
            metadata: {
              storage_addon: true,
              provider: 'paypal',
              subscription_addon_id: addonRowId,
              quantity: requestedQuantity,
            },
          })
        }
      }

      return NextResponse.json({
        success: true,
        provider: 'paypal',
        subscriptionId: dbSub.id,
        newQuantity: requestedQuantity,
        addonType,
        interval: intervalKey,
      })
    }

    // ── Stripe (legacy subscriptions) ──
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    // Find user's active subscription
    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('stripe_subscription_id, stripe_customer_id, stripe_price_id, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .not('stripe_subscription_id', 'is', null)
      .order('current_period_end', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    // Retrieve subscription to determine billing interval
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    const mainItem = stripeSubscription.items.data[0]
    if (!mainItem?.price?.recurring) {
      return NextResponse.json({ error: 'Unable to determine billing interval' }, { status: 500 })
    }

    const interval = mainItem.price.recurring.interval
    const intervalCount = mainItem.price.recurring.interval_count

    // Map Stripe interval to our interval key. Add-on prices must match the
    // base subscription's interval: legacy subs bill day/28, new subs month/1.
    let intervalKey: '28day' | 'month' | 'annual'
    if (interval === 'year') {
      intervalKey = 'annual'
    } else if (interval === 'day') {
      intervalKey = '28day'
    } else {
      intervalKey = 'month'
    }

    const addonPriceId = await resolveStripePriceId(addonType, intervalKey)
    if (!addonPriceId) {
      return NextResponse.json(
        { error: `Add-on price not configured for ${addonType} (${intervalKey})` },
        { status: 500 }
      )
    }

    // Check if add-on line item already exists
    const existingItem = stripeSubscription.items.data.find(
      item => item.price.id === addonPriceId
    )

    const items: Stripe.SubscriptionUpdateParams.Item[] = []
    if (existingItem) {
      items.push({ id: existingItem.id, quantity: requestedQuantity })
    } else {
      items.push({ price: addonPriceId, quantity: requestedQuantity })
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { items, proration_behavior: 'create_prorations' }
    )

    return NextResponse.json({
      success: true,
      subscriptionId: updatedSubscription.id,
      newQuantity: requestedQuantity,
      addonType,
      interval: intervalKey,
    })
  } catch (error) {
    console.error('Add-to-subscription error:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}
