import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import { getActivePackByKey } from '@/lib/billing/packs'

const MAX_QUANTITY = 10

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      packKey,
      quantity,
    } = body as {
      packKey: string
      quantity?: number
    }

    if (!packKey) {
      return NextResponse.json(
        { error: 'Missing pack key' },
        { status: 400 }
      )
    }

    const requestedQuantity = Number.isInteger(quantity) ? quantity : 1
    if (requestedQuantity < 1 || requestedQuantity > MAX_QUANTITY) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      )
    }

    const pack = await getActivePackByKey('storage', packKey, supabase)
    if (!pack || pack.grantUnit !== 'storage_gb') {
      return NextResponse.json(
        { error: 'Invalid storage pack' },
        { status: 400 }
      )
    }

    if (!pack.stripePriceId) {
      return NextResponse.json(
        { error: 'Storage pack is missing Stripe price ID' },
        { status: 400 }
      )
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('stripe_subscription_id, status, membership_tier_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .not('membership_tier_id', 'is', null)
      .order('current_period_end', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active membership subscription found' },
        { status: 400 }
      )
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    )

    const existingItem = stripeSubscription.items.data.find(
      (item) => item.price.id === pack.stripePriceId
    )

    const items: Array<any> = []
    if (existingItem) {
      items.push({
        id: existingItem.id,
        quantity: requestedQuantity,
      })
    } else {
      items.push({
        price: pack.stripePriceId,
        quantity: requestedQuantity,
      })
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        items,
        proration_behavior: 'create_prorations',
      }
    )

    return NextResponse.json({
      subscriptionId: updatedSubscription.id,
      storageGb: pack.grantAmount * requestedQuantity,
    })
  } catch (error) {
    console.error('Storage add-on error:', error)
    return NextResponse.json(
      { error: 'Failed to add storage add-on' },
      { status: 500 }
    )
  }
}
