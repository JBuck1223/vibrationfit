import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'

export async function POST() {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('id, stripe_subscription_id, cancel_at_period_end')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .not('stripe_subscription_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    if (!subscription.cancel_at_period_end) {
      return NextResponse.json({ error: 'Subscription is not scheduled for cancellation' }, { status: 400 })
    }

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    await supabase
      .from('customer_subscriptions')
      .update({ cancel_at_period_end: false, canceled_at: null })
      .eq('id', subscription.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resume subscription error:', error)
    return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 })
  }
}
