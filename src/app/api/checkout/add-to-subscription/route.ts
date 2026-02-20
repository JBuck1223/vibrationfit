import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import { getAddonPriceId } from '@/lib/checkout/products'
import type Stripe from 'stripe'

const MAX_QUANTITY = 10

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

    const { addonType, quantity } = (await request.json()) as {
      addonType: 'tokens' | 'storage'
      quantity: number
    }

    if (!addonType || !['tokens', 'storage'].includes(addonType)) {
      return NextResponse.json({ error: 'Invalid addon type' }, { status: 400 })
    }

    const requestedQuantity = Number.isInteger(quantity) ? quantity : 1
    if (requestedQuantity < 1 || requestedQuantity > MAX_QUANTITY) {
      return NextResponse.json({ error: `Quantity must be between 1 and ${MAX_QUANTITY}` }, { status: 400 })
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

    // Map Stripe interval to our interval key
    let intervalKey: '28day' | 'annual'
    if (interval === 'year') {
      intervalKey = 'annual'
    } else {
      intervalKey = '28day'
    }

    const addonPriceId = getAddonPriceId(addonType, intervalKey)
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
