/**
 * Admin Cancel Subscription API
 *
 * POST /api/admin/cancel-subscription
 *   Body: { subscriptionId, immediate? }
 *   - subscriptionId: customer_subscriptions.id (UUID) OR stripe_subscription_id (sub_xxx)
 *   - immediate: if true, cancel immediately; otherwise cancel at period end (default)
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createAdminNotification, notifyAdminSMS } from '@/lib/admin/notifications'

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const { subscriptionId, immediate = false } = await request.json()

  if (!subscriptionId) {
    return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 })
  }

  const adminDb = createAdminClient()

  // Resolve to a customer_subscriptions row (accept either our UUID or a Stripe sub ID)
  const isStripeId = typeof subscriptionId === 'string' && subscriptionId.startsWith('sub_')
  const column = isStripeId ? 'stripe_subscription_id' : 'id'

  const { data: sub, error: subError } = await adminDb
    .from('customer_subscriptions')
    .select('id, user_id, stripe_subscription_id, status, membership_tier_id, membership_tiers(tier_type, name)')
    .eq(column, subscriptionId)
    .single()

  if (subError || !sub) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  if (sub.status === 'canceled') {
    return NextResponse.json({ error: 'Subscription is already canceled' }, { status: 400 })
  }

  const stripeSubId = sub.stripe_subscription_id

  try {
    let stripeResult

    if (immediate) {
      stripeResult = await stripe.subscriptions.cancel(stripeSubId)

      await adminDb
        .from('customer_subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('id', sub.id)
    } else {
      stripeResult = await stripe.subscriptions.update(stripeSubId, {
        cancel_at_period_end: true,
      })

      await adminDb
        .from('customer_subscriptions')
        .update({
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString(),
        })
        .eq('id', sub.id)
    }

    // Look up customer info for notifications
    const { data: account } = await adminDb
      .from('user_accounts')
      .select('email, full_name, first_name')
      .eq('id', sub.user_id)
      .single()

    const customerName = account?.full_name || account?.first_name || account?.email || 'Unknown'
    const tierName = (sub as any).membership_tiers?.name || (sub as any).membership_tiers?.tier_type || 'subscription'
    const cancelType = immediate ? 'immediately' : 'at period end'

    createAdminNotification({
      type: 'subscription_canceled',
      title: `Subscription Canceled: ${customerName}`,
      body: `${tierName} canceled ${cancelType}`,
      metadata: {
        subscriptionId: sub.id,
        userId: sub.user_id,
        stripeSubscriptionId: stripeSubId,
        immediate,
      },
      link: '/admin/orders',
    }).catch(err => console.error('Cancel subscription admin notification error:', err))

    notifyAdminSMS(
      `Subscription canceled: ${customerName} - ${tierName} (${cancelType})`,
    ).catch(err => console.error('Cancel subscription SMS notification error:', err))

    return NextResponse.json({
      success: true,
      cancelType: immediate ? 'immediate' : 'at_period_end',
      stripeStatus: stripeResult.status,
    })
  } catch (err: any) {
    console.error('Stripe cancel subscription error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to cancel subscription' },
      { status: 500 },
    )
  }
}
