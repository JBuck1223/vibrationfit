import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe } from '@/lib/stripe/config'
import { toTitleCase } from '@/lib/utils'

const TIER_TYPE_TO_ENV_KEY: Record<string, string> = {
  vision_pro_annual: 'STRIPE_PRICE_ANNUAL',
  vision_pro_28day: 'STRIPE_PRICE_28DAY',
  vision_pro_household_annual: 'STRIPE_PRICE_HOUSEHOLD_ANNUAL',
  vision_pro_household_28day: 'STRIPE_PRICE_HOUSEHOLD_28DAY',
}

function resolveStripePriceId(tier: { stripe_price_id: string | null; tier_type: string }): string | null {
  if (tier.stripe_price_id) return tier.stripe_price_id
  const baseKey = TIER_TYPE_TO_ENV_KEY[tier.tier_type]
  if (!baseKey) return null
  const isSandbox = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
  if (isSandbox) {
    const sandboxVal = process.env[`SANDBOX_${baseKey}`]
    if (sandboxVal) return sandboxVal.trim()
  }
  return process.env[baseKey]?.trim()
    || process.env[`NEXT_PUBLIC_${baseKey}`]?.trim()
    || null
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetTierId, partnerFirstName, partnerLastName, partnerEmail, includeIntensive, intensiveAmount, promoCode } = (await request.json()) as {
      targetTierId: string
      partnerFirstName?: string
      partnerLastName?: string
      partnerEmail?: string
      includeIntensive?: boolean
      intensiveAmount?: number
      promoCode?: string
    }

    if (!targetTierId) {
      return NextResponse.json({ error: 'Missing target tier' }, { status: 400 })
    }

    const { data: targetTier } = await supabase
      .from('membership_tiers')
      .select('id, name, stripe_price_id, tier_type, billing_interval, plan_category, is_household_plan')
      .eq('id', targetTierId)
      .eq('is_active', true)
      .maybeSingle()

    if (!targetTier) {
      return NextResponse.json({ error: 'Target plan not found' }, { status: 404 })
    }

    const stripePriceId = resolveStripePriceId(targetTier)
    if (!stripePriceId) {
      return NextResponse.json({ error: 'Stripe price not configured for this plan' }, { status: 400 })
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('id, stripe_subscription_id, membership_tier_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .not('stripe_subscription_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    if (subscription.membership_tier_id === targetTierId) {
      return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })
    }

    // Fetch current tier to detect direction of change
    const { data: currentTier } = await supabase
      .from('membership_tiers')
      .select('id, tier_type, is_household_plan')
      .eq('id', subscription.membership_tier_id)
      .maybeSingle()

    const isHouseholdToSolo = currentTier?.is_household_plan && !targetTier.is_household_plan

    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    const mainItem = stripeSub.items.data.find(item => {
      const meta = item.price.metadata || {}
      return !meta.addon_type
    })

    if (!mainItem) {
      return NextResponse.json({ error: 'Unable to find main subscription item' }, { status: 500 })
    }

    // If downgrading from household to solo, remove seat add-on items first
    const itemsToUpdate: any[] = []
    if (isHouseholdToSolo) {
      for (const item of stripeSub.items.data) {
        if (item.id !== mainItem.id) {
          itemsToUpdate.push({ id: item.id, deleted: true })
        }
      }
    }

    let updatedSub: Awaited<ReturnType<typeof stripe.subscriptions.update>>

    try {
      updatedSub = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        items: [
          { id: mainItem.id, price: stripePriceId },
          ...itemsToUpdate,
        ],
        proration_behavior: 'create_prorations',
        cancel_at_period_end: false,
      })
    } catch {
      updatedSub = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        items: [
          { id: mainItem.id, deleted: true },
          { price: stripePriceId },
          ...itemsToUpdate,
        ],
        proration_behavior: 'create_prorations',
        cancel_at_period_end: false,
      })
    }

    await supabase
      .from('customer_subscriptions')
      .update({
        membership_tier_id: targetTierId,
        stripe_price_id: stripePriceId,
        cancel_at_period_end: false,
        canceled_at: null,
      })
      .eq('id', subscription.id)

    // Handle household dissolution when downgrading to solo
    let householdDissolved = false
    let removedMembers: string[] = []
    if (isHouseholdToSolo) {
      try {
        const serviceClient = createServiceClient()
        const { data: membership } = await serviceClient
          .from('household_members')
          .select('household_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        if (membership) {
          const { dissolveHousehold } = await import('@/lib/supabase/household')
          const result = await dissolveHousehold(membership.household_id, user.id)
          householdDissolved = result.success
          removedMembers = result.removedMemberIds
        }
      } catch (err) {
        console.error('Household dissolution error (non-blocking):', err)
      }
    }

    let householdCreated = false
    let partnerInvited = false
    let partnerId: string | undefined

    if (targetTier.is_household_plan) {
      try {
        householdCreated = await createHouseholdForUser(user.id, user.email || '')
      } catch (householdErr) {
        console.error('Household creation error (non-blocking):', householdErr)
      }

      if (partnerFirstName && partnerLastName && partnerEmail) {
        try {
          const serviceClient = createServiceClient()
          const { data: household } = await serviceClient
            .from('household_members')
            .select('household_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

          if (household) {
            const { data: hData } = await serviceClient
              .from('households')
              .select('id, name')
              .eq('id', household.household_id)
              .single()

            if (hData) {
              const { data: adminAccount } = await serviceClient
                .from('user_accounts')
                .select('first_name, last_name')
                .eq('id', user.id)
                .maybeSingle()

              const adminName = adminAccount?.first_name
                ? `${adminAccount.first_name} ${adminAccount.last_name || ''}`.trim()
                : user.email?.split('@')[0] || ''

              const { invitePartnerToHousehold } = await import('@/lib/supabase/household')
              const inviteResult = await invitePartnerToHousehold({
                supabaseAdmin: serviceClient,
                householdId: hData.id,
                adminUserId: user.id,
                adminName,
                adminEmail: user.email || '',
                householdName: hData.name,
                partnerFirstName,
                partnerLastName,
                partnerEmail,
              })
              partnerInvited = inviteResult.success
              partnerId = inviteResult.partnerId
            }
          }
        } catch (inviteErr) {
          console.error('Partner invitation error (non-blocking):', inviteErr)
        }
      }
    }

    // Create intensive checklist for partner (same pattern as normal checkout)
    let intensiveGranted = false
    if (includeIntensive && partnerId) {
      try {
        const serviceClient = createServiceClient()

        // Handle Stripe charge if amount > 0
        let finalAmount = intensiveAmount ?? 20000
        if (promoCode) {
          const { validateCouponCode, calculateDiscount } = await import('@/lib/billing/coupons')
          const couponResult = await validateCouponCode(promoCode, {
            userId: user.id,
            productKey: 'intensive',
            purchaseAmount: finalAmount,
          })
          if (couponResult.valid && couponResult.coupon) {
            finalAmount = Math.max(0, finalAmount - calculateDiscount(couponResult.coupon, finalAmount))
          }
        }

        if (finalAmount > 0 && stripe) {
          const { data: sub } = await serviceClient
            .from('customer_subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .in('status', ['active', 'trialing'])
            .not('stripe_customer_id', 'is', null)
            .limit(1)
            .maybeSingle()

          if (sub?.stripe_customer_id) {
            await stripe.invoiceItems.create({
              customer: sub.stripe_customer_id,
              amount: finalAmount,
              currency: 'usd',
              description: 'Activation Intensive',
            })
            const invoice = await stripe.invoices.create({
              customer: sub.stripe_customer_id,
              auto_advance: true,
              collection_method: 'charge_automatically',
            })
            await stripe.invoices.pay(invoice.id)
          }
        }

        // Look up the intensive product
        const { data: dbProd } = await serviceClient
          .from('products')
          .select('id')
          .eq('key', 'intensive')
          .maybeSingle()

        if (dbProd) {
          const { data: order, error: orderErr } = await serviceClient
            .from('orders')
            .insert({
              user_id: user.id,
              total_amount: finalAmount,
              currency: 'usd',
              status: 'paid',
              paid_at: new Date().toISOString(),
              promo_code: promoCode || null,
              metadata: { source: 'billing_upgrade', granted_to: partnerId },
            })
            .select('id')
            .single()

          if (orderErr || !order) {
            console.error('change-plan: order insert failed', JSON.stringify(orderErr))
          } else {
            const { data: orderItem, error: oiErr } = await serviceClient
              .from('order_items')
              .insert({
                order_id: order.id,
                product_id: dbProd.id,
                quantity: 1,
                amount: finalAmount,
                currency: 'usd',
                payment_plan: 'full',
                is_subscription: false,
              })
              .select('id')
              .single()

            if (oiErr || !orderItem) {
              console.error('change-plan: order_item insert failed', JSON.stringify(oiErr))
            } else {
              const { error: clErr } = await serviceClient.from('intensive_checklist').insert({
                intensive_id: orderItem.id,
                user_id: partnerId,
              })
              if (clErr) {
                console.error('change-plan: checklist insert failed', JSON.stringify(clErr))
              } else {
                intensiveGranted = true
                console.log('change-plan: intensive checklist created for partner', partnerId)
              }
            }
          }
        } else {
          console.error('change-plan: intensive product not found')
        }
      } catch (intensiveErr) {
        console.error('Intensive grant error (non-blocking):', intensiveErr)
      }
    }

    return NextResponse.json({
      success: true,
      newTier: targetTier.name,
      newTierType: targetTier.tier_type,
      subscriptionId: updatedSub.id,
      householdCreated,
      partnerInvited,
      partnerId,
      intensiveGranted,
      householdDissolved,
      removedMembers: removedMembers.length,
    })
  } catch (error) {
    console.error('Change plan error:', error)
    return NextResponse.json({ error: 'Failed to change plan' }, { status: 500 })
  }
}

async function createHouseholdForUser(userId: string, email: string): Promise<boolean> {
  const serviceClient = createServiceClient()

  const { data: existingMember } = await serviceClient
    .from('household_members')
    .select('id, household_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (existingMember) {
    // User already has an active membership -- check if it's a solo household
    // that needs to be re-upgraded (e.g. after a previous downgrade)
    const { data: existingHousehold } = await serviceClient
      .from('households')
      .select('id, plan_type')
      .eq('id', existingMember.household_id)
      .single()

    if (existingHousehold?.plan_type === 'solo') {
      await serviceClient
        .from('households')
        .update({ plan_type: 'household' })
        .eq('id', existingHousehold.id)
      console.log('Re-upgraded solo household to household plan:', existingHousehold.id)
      return true
    }

    // Already a household plan -- nothing to do
    return false
  }

  const { data: adminAccount } = await serviceClient
    .from('user_accounts')
    .select('first_name')
    .eq('id', userId)
    .maybeSingle()

  const nameBase = adminAccount?.first_name || email.split('@')[0] || 'My'
  const householdName = `${toTitleCase(nameBase)}'s Household`

  const { data: household, error: householdError } = await serviceClient
    .from('households')
    .insert({
      admin_user_id: userId,
      name: householdName,
      shared_tokens_enabled: true,
    })
    .select()
    .single()

  if (householdError || !household) {
    console.error('Failed to create household:', householdError)
    return false
  }

  await serviceClient.from('household_members').insert({
    household_id: household.id,
    user_id: userId,
    role: 'admin',
    status: 'active',
    joined_at: new Date().toISOString(),
  })

  await serviceClient
    .from('user_accounts')
    .update({
      household_id: household.id,
      is_household_admin: true,
    })
    .eq('id', userId)

  console.log('Household created via plan change:', household.id)
  return true
}

/**
 * GET: Preview proration cost for a plan change.
 */
export async function GET(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetTierId = request.nextUrl.searchParams.get('targetTierId')
    if (!targetTierId) {
      return NextResponse.json({ error: 'Missing target tier' }, { status: 400 })
    }

    const { data: targetTier } = await supabase
      .from('membership_tiers')
      .select('stripe_price_id, tier_type')
      .eq('id', targetTierId)
      .eq('is_active', true)
      .maybeSingle()

    if (!targetTier) {
      return NextResponse.json({ error: 'Target plan not found' }, { status: 404 })
    }

    const resolvedPriceId = resolveStripePriceId(targetTier)
    if (!resolvedPriceId) {
      return NextResponse.json({ error: 'Stripe price not configured for this plan' }, { status: 400 })
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .not('stripe_subscription_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id || !subscription.stripe_customer_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    const mainItem = stripeSub.items.data.find(item => {
      const meta = item.price.metadata || {}
      return !meta.addon_type
    })

    if (!mainItem) {
      return NextResponse.json({ error: 'Unable to preview' }, { status: 500 })
    }

    let invoice: Awaited<ReturnType<typeof stripe.invoices.createPreview>>

    try {
      invoice = await stripe.invoices.createPreview({
        customer: subscription.stripe_customer_id,
        subscription: subscription.stripe_subscription_id,
        subscription_details: {
          items: [{
            id: mainItem.id,
            price: resolvedPriceId,
          }],
          proration_behavior: 'create_prorations',
        },
      })
    } catch (firstErr: any) {
      console.log('Proration preview attempt 1 failed, trying cross-product fallback:', firstErr?.message)
      try {
        invoice = await stripe.invoices.createPreview({
          customer: subscription.stripe_customer_id,
          subscription: subscription.stripe_subscription_id,
          subscription_details: {
            items: [
              { id: mainItem.id, deleted: true },
              { price: resolvedPriceId },
            ],
            proration_behavior: 'create_prorations',
          },
        })
      } catch (secondErr: any) {
        console.error('Proration preview both attempts failed:', {
          attempt1: firstErr?.message,
          attempt2: secondErr?.message,
          customer: subscription.stripe_customer_id,
          subscription: subscription.stripe_subscription_id,
          targetPrice: resolvedPriceId,
          mainItemId: mainItem.id,
          currentPrice: mainItem.price.id,
        })
        const msg = secondErr?.message || firstErr?.message || 'Failed to preview proration'
        return NextResponse.json({ error: msg }, { status: 500 })
      }
    }

    const isProration = (line: typeof invoice.lines.data[number]) =>
      line.parent?.invoice_item_details?.proration ||
      line.parent?.subscription_item_details?.proration
    let relevantLines = invoice.lines.data.filter(isProration)
    if (relevantLines.length === 0) {
      relevantLines = invoice.lines.data
    }
    const totalAmount = relevantLines.reduce((sum, line) => sum + line.amount, 0)

    return NextResponse.json({
      prorationAmount: totalAmount,
      currency: invoice.currency,
      immediateAmount: Math.max(0, totalAmount),
      lines: relevantLines.map(line => ({
        description: line.description,
        amount: line.amount,
      })),
    })
  } catch (error: any) {
    console.error('Proration preview error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Failed to preview proration' }, { status: 500 })
  }
}
