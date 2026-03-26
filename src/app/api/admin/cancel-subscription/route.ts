/**
 * Admin Cancel Subscription API
 *
 * POST /api/admin/cancel-subscription
 *   Body: { subscriptionId?, userId?, immediate? }
 *
 *   Single cancel:
 *     - subscriptionId: customer_subscriptions.id (UUID) OR stripe_subscription_id (sub_xxx)
 *     - immediate: if true, cancel immediately; otherwise cancel at period end (default)
 *
 *   Cancel ALL for a user:
 *     - userId: cancels every active/trialing subscription for this user
 *     - immediate: same as above (defaults to true for cancel-all)
 *
 *   On immediate cancel, also clears membership_tier_id from user_accounts
 *   and removes subscription-linked storage add-ons.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createAdminNotification, notifyAdminSMS } from '@/lib/admin/notifications'

interface CancelResult {
  subscriptionId: string
  stripeSubscriptionId: string
  tierName: string
  status: string
  error?: string
}

async function cancelSingleSubscription(
  adminDb: ReturnType<typeof createAdminClient>,
  sub: {
    id: string
    user_id: string
    stripe_subscription_id: string
    status: string
    membership_tier_id: string | null
    membership_tiers: { tier_type: string; name: string } | null
  },
  immediate: boolean,
): Promise<CancelResult> {
  const stripeSubId = sub.stripe_subscription_id
  const tierName = sub.membership_tiers?.name || sub.membership_tiers?.tier_type || 'subscription'

  try {
    if (!stripe) throw new Error('Stripe not configured')

    let stripeStatus: string

    if (immediate) {
      const result = await stripe.subscriptions.cancel(stripeSubId)
      stripeStatus = result.status

      await adminDb
        .from('customer_subscriptions')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('id', sub.id)

      // Remove subscription-linked storage add-ons
      await adminDb
        .from('user_storage')
        .delete()
        .eq('subscription_id', sub.id)
    } else {
      const result = await stripe.subscriptions.update(stripeSubId, {
        cancel_at_period_end: true,
      })
      stripeStatus = result.status

      await adminDb
        .from('customer_subscriptions')
        .update({ cancel_at_period_end: true, canceled_at: new Date().toISOString() })
        .eq('id', sub.id)
    }

    return {
      subscriptionId: sub.id,
      stripeSubscriptionId: stripeSubId,
      tierName,
      status: stripeStatus,
    }
  } catch (err: any) {
    console.error(`Failed to cancel subscription ${stripeSubId}:`, err)
    return {
      subscriptionId: sub.id,
      stripeSubscriptionId: stripeSubId,
      tierName,
      status: 'error',
      error: err?.message || 'Unknown error',
    }
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const body = await request.json()
  const { subscriptionId, userId, immediate } = body

  if (!subscriptionId && !userId) {
    return NextResponse.json({ error: 'subscriptionId or userId is required' }, { status: 400 })
  }

  const adminDb = createAdminClient()

  // ── Cancel ALL subscriptions for a user ──────────────────────────────
  if (userId) {
    const cancelImmediate = immediate !== false // default true for cancel-all

    const { data: subs, error: subsError } = await adminDb
      .from('customer_subscriptions')
      .select('id, user_id, stripe_subscription_id, status, membership_tier_id, membership_tiers(tier_type, name)')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due'])

    if (subsError) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json(
        { error: 'No active subscriptions found in database. Use "Sync from Stripe" first if subscriptions exist in Stripe.' },
        { status: 404 },
      )
    }

    const results: CancelResult[] = []
    for (const sub of subs) {
      const result = await cancelSingleSubscription(adminDb, sub as any, cancelImmediate)
      results.push(result)
    }

    const allSucceeded = results.every(r => r.status !== 'error')

    // Clear membership tier from user_accounts on immediate cancel
    if (cancelImmediate && allSucceeded) {
      await adminDb
        .from('user_accounts')
        .update({ membership_tier_id: null })
        .eq('id', userId)
    }

    const { data: account } = await adminDb
      .from('user_accounts')
      .select('email, full_name, first_name')
      .eq('id', userId)
      .single()

    const customerName = account?.full_name || account?.first_name || account?.email || 'Unknown'
    const tierNames = results.map(r => r.tierName).join(', ')
    const cancelType = cancelImmediate ? 'immediately' : 'at period end'

    createAdminNotification({
      type: 'subscription_canceled',
      title: `All Subscriptions Canceled: ${customerName}`,
      body: `${results.length} subscription(s) canceled ${cancelType}: ${tierNames}`,
      metadata: {
        userId,
        canceledCount: subs.length,
        immediate: cancelImmediate,
        results,
      },
      link: '/admin/orders',
    }).catch(err => console.error('Cancel-all admin notification error:', err))

    notifyAdminSMS(
      `All subs canceled: ${customerName} - ${results.length} subscription(s) (${cancelType})`,
    ).catch(err => console.error('Cancel-all SMS notification error:', err))

    return NextResponse.json({
      success: allSucceeded,
      cancelType: cancelImmediate ? 'immediate' : 'at_period_end',
      canceled: results.length,
      results,
      membershipTierCleared: cancelImmediate && allSucceeded,
    })
  }

  // ── Cancel a SINGLE subscription ─────────────────────────────────────
  const cancelImmediate = immediate || false

  const isStripeId = typeof subscriptionId === 'string' && subscriptionId.startsWith('sub_')
  const column = isStripeId ? 'stripe_subscription_id' : 'id'

  const { data: sub } = await adminDb
    .from('customer_subscriptions')
    .select('id, user_id, stripe_subscription_id, status, membership_tier_id, membership_tiers(tier_type, name)')
    .eq(column, subscriptionId)
    .single()

  // If found in DB, use normal flow
  if (sub) {
    if (sub.status === 'canceled') {
      return NextResponse.json({ error: 'Subscription is already canceled' }, { status: 400 })
    }

    const result = await cancelSingleSubscription(adminDb, sub as any, cancelImmediate)

    if (result.status === 'error') {
      return NextResponse.json({ error: result.error || 'Failed to cancel subscription' }, { status: 500 })
    }

    if (cancelImmediate) {
      const { data: remainingSubs } = await adminDb
        .from('customer_subscriptions')
        .select('id')
        .eq('user_id', sub.user_id)
        .in('status', ['active', 'trialing', 'past_due'])
        .neq('id', sub.id)

      if (!remainingSubs || remainingSubs.length === 0) {
        await adminDb
          .from('user_accounts')
          .update({ membership_tier_id: null })
          .eq('id', sub.user_id)
      }
    }

    const { data: account } = await adminDb
      .from('user_accounts')
      .select('email, full_name, first_name')
      .eq('id', sub.user_id)
      .single()

    const customerName = account?.full_name || account?.first_name || account?.email || 'Unknown'
    const cancelType = cancelImmediate ? 'immediately' : 'at period end'

    createAdminNotification({
      type: 'subscription_canceled',
      title: `Subscription Canceled: ${customerName}`,
      body: `${result.tierName} canceled ${cancelType}`,
      metadata: {
        subscriptionId: sub.id,
        userId: sub.user_id,
        stripeSubscriptionId: sub.stripe_subscription_id,
        immediate: cancelImmediate,
      },
      link: '/admin/orders',
    }).catch(err => console.error('Cancel subscription admin notification error:', err))

    notifyAdminSMS(
      `Subscription canceled: ${customerName} - ${result.tierName} (${cancelType})`,
    ).catch(err => console.error('Cancel subscription SMS notification error:', err))

    return NextResponse.json({
      success: true,
      cancelType: cancelImmediate ? 'immediate' : 'at_period_end',
      stripeStatus: result.status,
      membershipTierCleared: cancelImmediate,
    })
  }

  return NextResponse.json(
    { error: 'Subscription not found in database. Use "Sync from Stripe" first if it exists in Stripe.' },
    { status: 404 },
  )
}
