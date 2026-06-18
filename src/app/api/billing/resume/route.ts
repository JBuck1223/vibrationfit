import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'

/**
 * Resume a membership that was scheduled to cancel at period end. Mirror of the
 * cancel route: reflects immediately in the DB (admin write) and supports
 * manual grants that have no Stripe subscription.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('id, stripe_subscription_id, cancel_at_period_end')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('current_period_end', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    if (!subscription.cancel_at_period_end) {
      return NextResponse.json({ error: 'Subscription is not scheduled for cancellation' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Real Stripe subscription: clear the scheduled cancellation in Stripe first.
    if (subscription.stripe_subscription_id) {
      if (!stripe) {
        return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
      }
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: false,
      })
    }

    const { error: updateError } = await admin
      .from('customer_subscriptions')
      .update({ cancel_at_period_end: false, canceled_at: null })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Resume DB sync error:', updateError)
      return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resume subscription error:', error)
    return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 })
  }
}
