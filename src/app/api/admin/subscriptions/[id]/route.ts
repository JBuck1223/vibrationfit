// Admin controls for DB-driven (PayPal) subscriptions: edit the billing
// schedule and amount, pause/resume, charge immediately, and view payment
// history. Everything operates on customer_subscriptions directly — there is
// no gateway object to keep in sync.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { chargeRenewalNow } from '@/lib/paypal/vault-billing'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** GET: subscription detail with add-ons and payment history. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const admin = getServiceClient()

  const { data: subscription, error } = await admin
    .from('customer_subscriptions')
    .select(`
      id, user_id, provider, status, amount_cents, billing_interval_days,
      next_billing_at, current_period_start, current_period_end, failure_count,
      cancel_at_period_end, canceled_at, created_at, payment_method_id,
      membership_tiers ( id, name, tier_type, plan_category ),
      payment_methods ( id, brand, last4, status )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error || !subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const [{ data: addons }, { data: history }] = await Promise.all([
    admin
      .from('subscription_addons')
      .select('id, addon_type, quantity, unit_amount_cents, grant_amount, grant_unit, status, created_at')
      .eq('subscription_id', id)
      .order('created_at', { ascending: false }),
    admin
      .from('payment_history')
      .select('id, amount, currency, status, description, provider, paid_at, created_at')
      .eq('subscription_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return NextResponse.json({ subscription, addons: addons || [], history: history || [] })
}

/**
 * PATCH: subscription actions.
 * - { action: 'update', nextBillingAt?, amountCents? } — comp time / custom pricing
 * - { action: 'pause' } — stop billing (keeps access; no renewal until resumed)
 * - { action: 'resume', nextBillingAt? } — restart billing (defaults to now → next cron run)
 * - { action: 'charge_now' } — run a renewal charge immediately
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await request.json()
  const { action } = body as { action?: string }

  const admin = getServiceClient()

  const { data: subscription } = await admin
    .from('customer_subscriptions')
    .select('id, user_id, provider, status, amount_cents, next_billing_at, stripe_subscription_id')
    .eq('id', id)
    .maybeSingle()

  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }
  if (subscription.provider !== 'paypal' && subscription.stripe_subscription_id) {
    return NextResponse.json({
      error: 'This is a Stripe subscription — manage it in the Stripe dashboard or via the existing cancel controls.',
    }, { status: 400 })
  }

  try {
    switch (action) {
      case 'update': {
        const { nextBillingAt, amountCents } = body as { nextBillingAt?: string | null; amountCents?: number }
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

        if (nextBillingAt !== undefined) {
          if (nextBillingAt !== null && isNaN(new Date(nextBillingAt).getTime())) {
            return NextResponse.json({ error: 'Invalid next billing date' }, { status: 400 })
          }
          updates.next_billing_at = nextBillingAt
        }
        if (amountCents !== undefined) {
          if (typeof amountCents !== 'number' || amountCents < 0 || !Number.isInteger(amountCents)) {
            return NextResponse.json({ error: 'Amount must be a non-negative integer (cents)' }, { status: 400 })
          }
          updates.amount_cents = amountCents
        }
        if (Object.keys(updates).length === 1) {
          return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
        }

        const { error } = await admin.from('customer_subscriptions').update(updates).eq('id', id)
        if (error) throw new Error(error.message)
        return NextResponse.json({ success: true })
      }

      case 'pause': {
        const { error } = await admin
          .from('customer_subscriptions')
          .update({ next_billing_at: null, updated_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw new Error(error.message)
        return NextResponse.json({ success: true, message: 'Billing paused — no renewals until resumed' })
      }

      case 'resume': {
        const { nextBillingAt } = body as { nextBillingAt?: string }
        const resumeAt = nextBillingAt ? new Date(nextBillingAt) : new Date()
        if (isNaN(resumeAt.getTime())) {
          return NextResponse.json({ error: 'Invalid resume date' }, { status: 400 })
        }
        const { error } = await admin
          .from('customer_subscriptions')
          .update({
            next_billing_at: resumeAt.toISOString(),
            status: subscription.status === 'past_due' ? 'active' : subscription.status,
            failure_count: 0,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
        if (error) throw new Error(error.message)
        return NextResponse.json({ success: true, message: 'Billing resumed' })
      }

      case 'charge_now': {
        const result = await chargeRenewalNow(admin, id)
        return NextResponse.json({
          success: true,
          chargedCents: result.chargedCents,
          nextBillingAt: result.nextBillingAt,
          message: `Charged $${(result.chargedCents / 100).toFixed(2)} — next renewal ${new Date(result.nextBillingAt).toLocaleDateString()}`,
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (err: any) {
    console.error('Admin subscription action failed:', err)
    return NextResponse.json({ error: err?.message || 'Action failed' }, { status: 500 })
  }
}
