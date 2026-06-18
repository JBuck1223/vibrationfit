import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'
import { getSubscriptionPeriod } from '@/lib/stripe/subscription-period'

/**
 * Cancel the current membership.
 *
 * Hardened so a single click reflects everywhere immediately:
 *  - For real Stripe subscriptions, we set cancel_at_period_end in Stripe AND
 *    write the authoritative state back to our DB from the Stripe response
 *    (we don't wait for the webhook, which can be missed/delayed).
 *  - For manual grants (no Stripe subscription), we cancel directly in the DB.
 *
 * Uses the admin client for the write so the update isn't silently dropped by
 * RLS, keeping Stripe and the database in sync.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the member's current subscription. Include past_due (still cancelable)
    // and manual grants (stripe_subscription_id is null).
    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('id, stripe_subscription_id, status, current_period_end')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('current_period_end', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    if (!subscription) {
      return NextResponse.json({ error: 'No active membership found' }, { status: 400 })
    }

    const admin = createAdminClient()

    // ── Manual grant (no Stripe subscription): cancel directly in the DB ──────
    if (!subscription.stripe_subscription_id) {
      const periodEnd = subscription.current_period_end
      const periodInFuture = periodEnd ? new Date(periodEnd).getTime() > Date.now() : false

      const { error: updateError } = await admin
        .from('customer_subscriptions')
        .update({
          // Retain access until the grant's period end if it's still in the
          // future; otherwise end it now.
          cancel_at_period_end: periodInFuture,
          status: periodInFuture ? subscription.status : 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)

      if (updateError) {
        console.error('Cancel (manual grant) DB update error:', updateError)
        return NextResponse.json({ error: 'Failed to cancel membership' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        cancelAtPeriodEnd: periodInFuture,
        endsAt: periodEnd,
      })
    }

    // ── Real Stripe subscription ──────────────────────────────────────────────
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const updatedSub = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // Mirror the authoritative Stripe state into our DB right away.
    const period = getSubscriptionPeriod(updatedSub)
    const canceledAt = (updatedSub as unknown as { canceled_at?: number }).canceled_at

    const { error: updateError } = await admin
      .from('customer_subscriptions')
      .update({
        status: updatedSub.status,
        cancel_at_period_end: updatedSub.cancel_at_period_end,
        current_period_end: period.currentPeriodEnd ?? subscription.current_period_end,
        canceled_at: canceledAt ? new Date(canceledAt * 1000).toISOString() : null,
      })
      .eq('id', subscription.id)

    if (updateError) {
      // Stripe is the source of truth and the change succeeded there; the
      // webhook will reconcile the DB. Log but don't fail the user's action.
      console.error('Cancel DB sync error (Stripe already updated):', updateError)
    }

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: updatedSub.cancel_at_period_end,
      endsAt: period.currentPeriodEnd ?? subscription.current_period_end,
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
