/**
 * DB-Driven Billing Cron
 *
 * GET /api/cron/billing — runs daily.
 *
 * The database is the subscription engine: this job finds PayPal subscriptions
 * whose next_billing_at is due and charges their vaulted card via a
 * merchant-initiated PayPal order. Handles two schedule types:
 *
 * 1. Membership renewals (e.g. Vision Pro $99 every 28 days): charge, record
 *    payment, advance the period, drip the cycle's tokens.
 * 2. Intensive 2-pay installments (tier plan_category = 'intensive'): charge
 *    the remaining installment, then close the schedule.
 *
 * Failures retry every 3 days up to 3 attempts, then the subscription is
 * marked past_due and billing stops.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { chargeVaultedCard } from '@/lib/paypal/orders'
import { isPayPalConfigured } from '@/lib/paypal/client'
import { createAdminNotification } from '@/lib/admin/notifications'
import { applySubscriptionAddonGrants, tickRenewalDiscount } from '@/lib/paypal/vault-billing'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const CRON_SECRET = process.env.CRON_SECRET
const MAX_FAILURES = 3
const RETRY_DAYS = 3
const BATCH_LIMIT = 50

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

type DueSubscription = {
  id: string
  user_id: string
  amount_cents: number
  billing_interval_days: number
  next_billing_at: string
  failure_count: number
  status: string
  cancel_at_period_end: boolean | null
  order_item_id: string | null
  renewal_discount_type: 'percent' | 'fixed' | null
  renewal_discount_value: number | null
  renewal_discount_cycles_remaining: number | null
  membership_tiers: {
    id: string
    name: string
    tier_type: string | null
    plan_category: string | null
  } | null
  payment_methods: {
    id: string
    paypal_vault_id: string | null
    status: string
  } | null
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isPayPalConfigured()) {
    return NextResponse.json({ error: 'PayPal not configured' }, { status: 500 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const nowIso = new Date().toISOString()

  const { data: dueSubs, error: queryError } = await supabaseAdmin
    .from('customer_subscriptions')
    .select(`
      id, user_id, amount_cents, billing_interval_days, next_billing_at,
      failure_count, status, cancel_at_period_end, order_item_id,
      renewal_discount_type, renewal_discount_value, renewal_discount_cycles_remaining,
      membership_tiers (id, name, tier_type, plan_category),
      payment_methods (id, paypal_vault_id, status)
    `)
    .eq('provider', 'paypal')
    .in('status', ['trialing', 'active'])
    .lte('next_billing_at', nowIso)
    .not('next_billing_at', 'is', null)
    .order('next_billing_at', { ascending: true })
    .limit(BATCH_LIMIT)

  if (queryError) {
    console.error('[billing cron] query failed:', queryError)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  const results = { charged: 0, failed: 0, skipped: 0, closed: 0 }

  for (const sub of (dueSubs || []) as unknown as DueSubscription[]) {
    try {
      const tier = sub.membership_tiers
      const pm = sub.payment_methods

      // Member canceled: period is over, end access instead of charging
      if (sub.cancel_at_period_end && tier?.plan_category !== 'intensive') {
        await supabaseAdmin
          .from('customer_subscriptions')
          .update({
            status: 'canceled' as any,
            next_billing_at: null,
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id)
        results.closed++
        continue
      }

      if (!sub.amount_cents || sub.amount_cents <= 0) {
        // 100%-off renewal discount: a free cycle. Advance the period and
        // grant tokens without charging; the discount countdown still ticks.
        const isFreeCycle = Boolean(sub.renewal_discount_type) && tier?.plan_category !== 'intensive'
        if (!isFreeCycle) {
          results.skipped++
          continue
        }

        const intervalDays = sub.billing_interval_days || 28
        const periodEnd = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000)
        await supabaseAdmin
          .from('customer_subscriptions')
          .update({
            status: 'active' as any,
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
            next_billing_at: periodEnd.toISOString(),
            failure_count: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id)

        await tickRenewalDiscount(supabaseAdmin as any, sub).catch(err =>
          console.error('[billing cron] renewal discount tick failed for sub', sub.id, err),
        )

        if (tier?.id) {
          const { error: grantError } = await supabaseAdmin.rpc('grant_tokens_for_tier', {
            p_user_id: sub.user_id,
            p_tier_id: tier.id,
            p_subscription_id: sub.id,
          })
          if (grantError) {
            console.error('[billing cron] token grant failed for sub', sub.id, grantError)
          }
        }

        results.charged++
        continue
      }

      // No usable payment method — stop billing and flag for follow-up
      if (!pm?.paypal_vault_id || pm.status !== 'active') {
        await markPastDue(supabaseAdmin, sub, 'No active payment method on file')
        results.failed++
        continue
      }

      const isInstallment = tier?.plan_category === 'intensive'
      const description = isInstallment
        ? `${tier?.name || 'Activation Intensive'} — installment`
        : `${tier?.name || 'Vision Pro Membership'} — renewal`

      let charge
      try {
        charge = await chargeVaultedCard({
          vaultId: pm.paypal_vault_id,
          amountCents: sub.amount_cents,
          description,
          customId: `sub:${sub.id}`,
          // Idempotent per billing period: retries of the same due date dedupe at PayPal
          requestId: `renewal-${sub.id}-${sub.next_billing_at}`,
        })
      } catch (chargeErr) {
        console.error('[billing cron] charge error for sub', sub.id, chargeErr)
        charge = null
      }

      if (!charge || charge.status !== 'COMPLETED') {
        await recordFailure(supabaseAdmin, sub, charge?.raw)
        results.failed++
        continue
      }

      // ----------------------------------------------------------------------
      // Success: record payment
      // ----------------------------------------------------------------------
      await supabaseAdmin.from('payment_history').insert({
        user_id: sub.user_id,
        subscription_id: sub.id,
        provider: 'paypal',
        paypal_order_id: charge.orderId,
        paypal_capture_id: charge.captureId,
        amount: sub.amount_cents,
        currency: charge.currency || 'usd',
        status: 'succeeded',
        description,
        paid_at: new Date().toISOString(),
      })

      if (isInstallment) {
        // 2-pay installment: bump the counter, close the schedule when done
        let done = true
        if (sub.order_item_id) {
          const { data: oi } = await supabaseAdmin
            .from('order_items')
            .select('installments_total, installments_paid')
            .eq('id', sub.order_item_id)
            .maybeSingle()
          const paid = (oi?.installments_paid || 1) + 1
          const total = oi?.installments_total || 2
          await supabaseAdmin
            .from('order_items')
            .update({ installments_paid: paid })
            .eq('id', sub.order_item_id)
          done = paid >= total
        }

        await supabaseAdmin
          .from('customer_subscriptions')
          .update(
            done
              ? { status: 'canceled' as any, next_billing_at: null, failure_count: 0, canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() }
              : { next_billing_at: addDays(sub.next_billing_at, sub.billing_interval_days || 14), failure_count: 0, updated_at: new Date().toISOString() },
          )
          .eq('id', sub.id)
        if (done) results.closed++
      } else {
        // Membership renewal: advance the period and drip the cycle's tokens
        const intervalDays = sub.billing_interval_days || 28
        const periodStart = new Date()
        const periodEnd = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000)

        await supabaseAdmin
          .from('customer_subscriptions')
          .update({
            status: 'active' as any,
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
            next_billing_at: periodEnd.toISOString(),
            failure_count: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id)

        // Cycle-limited renewal discount: count down; restore full price when done
        await tickRenewalDiscount(supabaseAdmin as any, sub).catch(err =>
          console.error('[billing cron] renewal discount tick failed for sub', sub.id, err),
        )

        if (tier?.id) {
          const { error: grantError } = await supabaseAdmin.rpc('grant_tokens_for_tier', {
            p_user_id: sub.user_id,
            p_tier_id: tier.id,
            p_subscription_id: sub.id,
          })
          if (grantError) {
            console.error('[billing cron] token grant failed for sub', sub.id, grantError)
          }
        }

        // Add-on grants for this cycle: token add-ons re-grant every renewal,
        // storage add-ons keep one persistent quota row while active.
        await applySubscriptionAddonGrants(supabaseAdmin, sub, charge.orderId).catch(err =>
          console.error('[billing cron] addon grants failed for sub', sub.id, err),
        )
      }

      results.charged++
    } catch (err) {
      console.error('[billing cron] unexpected error for sub', sub.id, err)
      results.failed++
    }
  }

  console.log('[billing cron] done:', results)
  return NextResponse.json({ ok: true, ...results, due: dueSubs?.length || 0 })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addDays(fromIso: string, days: number): string {
  const base = new Date(fromIso).getTime()
  return new Date(base + days * 24 * 60 * 60 * 1000).toISOString()
}

async function recordFailure(supabaseAdmin: any, sub: DueSubscription, raw?: unknown) {
  const newFailureCount = (sub.failure_count || 0) + 1

  await supabaseAdmin.from('payment_history').insert({
    user_id: sub.user_id,
    subscription_id: sub.id,
    provider: 'paypal',
    amount: sub.amount_cents,
    currency: 'usd',
    status: 'failed',
    description: `Renewal charge failed (attempt ${newFailureCount}/${MAX_FAILURES})`,
    metadata: raw ? { paypal_response: raw } : null,
  })

  if (newFailureCount >= MAX_FAILURES) {
    await markPastDue(supabaseAdmin, sub, `Charge failed ${MAX_FAILURES} times`)
  } else {
    await supabaseAdmin
      .from('customer_subscriptions')
      .update({
        failure_count: newFailureCount,
        next_billing_at: new Date(Date.now() + RETRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id)
  }
}

async function markPastDue(supabaseAdmin: any, sub: DueSubscription, reason: string) {
  await supabaseAdmin
    .from('customer_subscriptions')
    .update({
      status: 'past_due' as any,
      next_billing_at: null,
      failure_count: (sub.failure_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id)

  createAdminNotification({
    type: 'payment_failed',
    title: 'Subscription past due',
    body: `Renewal for subscription ${sub.id} stopped: ${reason}`,
    metadata: { subscription_id: sub.id, user_id: sub.user_id, reason, provider: 'paypal' },
    link: '/admin/orders',
  }).catch(err => console.error('[billing cron] admin notification failed:', err))
}
