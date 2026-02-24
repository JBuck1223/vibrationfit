import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'

/**
 * DELETE: Remove an add-on line item from the user's subscription.
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscriptionItemId } = (await request.json()) as { subscriptionItemId: string }

    if (!subscriptionItemId) {
      return NextResponse.json({ error: 'Missing subscription item ID' }, { status: 400 })
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .not('stripe_subscription_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    // Verify the item belongs to this subscription
    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    const item = stripeSub.items.data.find(i => i.id === subscriptionItemId)

    if (!item) {
      return NextResponse.json({ error: 'Add-on not found on your subscription' }, { status: 404 })
    }

    // Don't allow removing the main subscription item
    const meta = item.price.metadata || {}
    if (!meta.addon_type) {
      return NextResponse.json({ error: 'Cannot remove the base subscription' }, { status: 400 })
    }

    // Remove the line item
    await stripe.subscriptionItems.del(subscriptionItemId, {
      proration_behavior: 'create_prorations',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove addon error:', error)
    return NextResponse.json({ error: 'Failed to remove add-on' }, { status: 500 })
  }
}
