/**
 * Partners commission ledger.
 *
 * Called wherever money moves: processPaymentEvent after every successful
 * charge, reversePayment on refunds and chargebacks, referralCreditFor before
 * a renewal charge. Amounts in commission_ledger are never edited; corrections
 * are new rows that point at the entry they correct.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  commissionCents,
  contributionProfitCents,
  decideCommissionStatus,
  earnsCash,
  estimatedProcessingFeeCents,
  netCollectedCents,
  referralCreditCents,
  referralOldEnough,
  reversalDeltaCents,
  splitSponsored,
  type PartnerSettings,
} from './math'
import { loadPartnerSettings } from './settings'
import { computeCycleCosts } from './costs'
import {
  activateReferral,
  activeReferralRank,
  attributeByCode,
  countActiveReferrals,
  findReferral,
  setReferralStatus,
  type ReferralRow,
} from './attribution'

const DAY_MS = 24 * 60 * 60 * 1000
const PAID_SOURCES = ['paid_influencer_audience', 'broad_paid_influencer_creative']

interface PaymentRow {
  id: string
  user_id: string
  subscription_id: string | null
  amount: number
  status: string
  paid_at: string | null
  created_at: string
  tax_cents: number
  discount_cents: number
  processing_fee_cents: number | null
  refunded_cents: number
  chargeback_cents: number
  membership_tier_id: string | null
  cycle_start: string | null
  cycle_end: string | null
  metadata: Record<string, unknown> | null
}

const PAYMENT_COLUMNS =
  'id, user_id, subscription_id, amount, status, paid_at, created_at, tax_cents, discount_cents, processing_fee_cents, refunded_cents, chargeback_cents, membership_tier_id, cycle_start, cycle_end, metadata'

interface Participant {
  id: string
  user_id: string | null
  is_internal: boolean
  is_suspended: boolean
}

async function loadPayment(db: SupabaseClient, paymentId: string): Promise<PaymentRow | null> {
  const { data } = await db.from('payment_history').select(PAYMENT_COLUMNS).eq('id', paymentId).maybeSingle()
  return (data as PaymentRow | null) || null
}

async function loadParticipant(db: SupabaseClient, id: string): Promise<Participant | null> {
  const { data } = await db
    .from('referral_participants')
    .select('id, user_id, is_internal, is_suspended')
    .eq('id', id)
    .maybeSingle()
  return (data as Participant | null) || null
}

/** Has an active, paying membership right now (trials and add-ons don't count). */
export async function isActivePayingMember(db: SupabaseClient, userId: string | null): Promise<boolean> {
  if (!userId) return false
  const { count } = await db
    .from('customer_subscriptions')
    .select('id, membership_tiers!inner(plan_category)', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('membership_tiers.plan_category', 'subscription')
  return (count || 0) > 0
}

function cycleWindow(p: PaymentRow, intervalDays: number) {
  const paidAt = p.paid_at || p.created_at
  const start = p.cycle_start || paidAt
  const end = p.cycle_end || new Date(new Date(start).getTime() + intervalDays * DAY_MS).toISOString()
  return { paidAt, start, end }
}

// ---------------------------------------------------------------------------
// Profit snapshots
// ---------------------------------------------------------------------------

/**
 * Write (or rewrite) the profit snapshot for a payment. While the cycle is
 * running, usage is projected from the previous cycle; after it ends, the
 * daily cron rewrites it with the real numbers (`final`).
 */
export async function writeProfitSnapshot(
  db: SupabaseClient,
  payment: PaymentRow,
  s: PartnerSettings,
  opts: { intervalDays: number; final: boolean },
): Promise<{ contributionCents: number; belowFloor: boolean }> {
  const { start, end } = cycleWindow(payment, opts.intervalDays)
  const costWindow = opts.final
    ? { from: start, to: end }
    : { from: new Date(new Date(start).getTime() - opts.intervalDays * DAY_MS).toISOString(), to: start }
  const costs = await computeCycleCosts(db, payment.user_id, costWindow.from, costWindow.to)

  const { data: entries } = await db
    .from('commission_ledger')
    .select('entry_type, amount_cents, ad_recovery_cents, status')
    .eq('source_payment_id', payment.id)
    .in('entry_type', ['referral_commission'])
    .not('status', 'in', '(void,reversed)')
  const referralCommission = (entries || []).reduce((sum, e) => sum + (e.amount_cents || 0), 0)
  const adRecovery = (entries || []).reduce((sum, e) => sum + (e.ad_recovery_cents || 0), 0)

  const net = netCollectedCents(payment.amount, payment.tax_cents)
  const processing = payment.processing_fee_cents ?? estimatedProcessingFeeCents(payment.amount, s)
  const contribution = contributionProfitCents({
    netCollectedCents: net,
    refundedCents: payment.refunded_cents,
    chargebackCents: payment.chargeback_cents,
    // Ad recovery is part of the commission, not an extra cost
    referralCommissionCents: referralCommission - adRecovery,
    processingCents: processing,
    usageCostCents: costs.usageCents,
    sharedCostCents: costs.sharedCents,
    supportCents: s.support_cost_cents,
    adRecoveryCents: adRecovery,
  })
  const belowFloor = contribution < s.minimum_profit_floor_cents

  const { error } = await db.from('profit_snapshots').upsert(
    {
      payment_id: payment.id,
      user_id: payment.user_id,
      subscription_id: payment.subscription_id,
      membership_tier_id: payment.membership_tier_id,
      cycle_start: start,
      cycle_end: end,
      gross_cents: payment.amount,
      discount_cents: payment.discount_cents,
      tax_cents: payment.tax_cents,
      refunded_cents: payment.refunded_cents,
      chargeback_cents: payment.chargeback_cents,
      net_collected_cents: net,
      referral_commission_cents: referralCommission,
      processing_cents: processing,
      usage_cost_cents: costs.usageCents,
      shared_cost_cents: costs.sharedCents,
      support_cents: s.support_cost_cents,
      ad_recovery_cents: adRecovery,
      cost_breakdown: costs.breakdown,
      costs_final: opts.final,
      contribution_profit_cents: contribution,
      below_floor: belowFloor,
      computed_at: new Date().toISOString(),
    },
    { onConflict: 'payment_id' },
  )
  if (error) throw new Error(`profit snapshot upsert failed: ${error.message}`)
  return { contributionCents: contribution, belowFloor }
}

// ---------------------------------------------------------------------------
// Successful payments
// ---------------------------------------------------------------------------

export interface ProcessResult {
  skipped?: string
  referralId?: string
  commission?: { entryId: string; amountCents: number; status: string; reason?: string | null }
  contributionCents?: number
}

/**
 * Run the Partners workflow for one successful payment. Safe to call more
 * than once for the same payment: accruals are unique per payment.
 */
export async function processPaymentEvent(db: SupabaseClient, paymentId: string): Promise<ProcessResult> {
  const payment = await loadPayment(db, paymentId)
  if (!payment) return { skipped: 'payment_not_found' }
  if (payment.status !== 'succeeded') return { skipped: 'not_succeeded' }
  if (!payment.amount || payment.amount <= 0) return { skipped: 'free_cycle' }

  const s = await loadPartnerSettings(db)

  let intervalDays = 28
  let referralSource: string | null = null
  if (payment.subscription_id) {
    const { data: sub } = await db
      .from('customer_subscriptions')
      .select('billing_interval_days, referral_source, membership_tier_id, membership_tiers(plan_category)')
      .eq('id', payment.subscription_id)
      .maybeSingle()
    const planCategory = (sub?.membership_tiers as { plan_category?: string } | null)?.plan_category
    if (planCategory === 'intensive') return { skipped: 'intensive_installment' }
    intervalDays = sub?.billing_interval_days || 28
    referralSource = sub?.referral_source || null
    if (!payment.membership_tier_id && sub?.membership_tier_id) payment.membership_tier_id = sub.membership_tier_id
  }
  const { paidAt } = cycleWindow(payment, intervalDays)

  // Attribution: an existing referral wins; otherwise fall back to the subscription's code
  let referral: ReferralRow | null = await findReferral(db, { userId: payment.user_id })
  if (!referral && referralSource) {
    const { data: account } = await db.from('user_accounts').select('email').eq('id', payment.user_id).maybeSingle()
    if (account?.email) {
      referral = await attributeByCode(db, {
        code: referralSource,
        referredEmail: account.email,
        referredUserId: payment.user_id,
        status: 'active',
      })
    }
  }
  if (referral) referral = await activateReferral(db, referral, paidAt)

  const result: ProcessResult = { referralId: referral?.id }

  if (referral && referral.status === 'active') {
    const referrer = await loadParticipant(db, referral.referrer_id)
    if (referrer && !referrer.is_internal) {
      const rank = await activeReferralRank(db, referral)
      if (earnsCash(rank, s)) {
        const entry = await accrueReferralCommission(db, { payment, referral, referrer, s, paidAt, intervalDays })
        if (entry) result.commission = entry
      }
    }
  }

  const snapshot = await writeProfitSnapshot(db, payment, s, { intervalDays, final: false })
  result.contributionCents = snapshot.contributionCents
  return result
}

async function accrueReferralCommission(
  db: SupabaseClient,
  ctx: { payment: PaymentRow; referral: ReferralRow; referrer: Participant; s: PartnerSettings; paidAt: string; intervalDays: number },
): Promise<ProcessResult['commission'] | null> {
  const { payment, referral, referrer, s, paidAt } = ctx

  const { data: existing } = await db
    .from('commission_ledger')
    .select('id, amount_cents, status, hold_reason')
    .eq('source_payment_id', payment.id)
    .eq('entry_type', 'referral_commission')
    .eq('participant_id', referrer.id)
    .maybeSingle()
  if (existing) {
    return { entryId: existing.id, amountCents: existing.amount_cents, status: existing.status, reason: existing.hold_reason }
  }

  const net = netCollectedCents(payment.amount, payment.tax_cents)
  const amount = commissionCents(net, s.referral_rate)
  const { start, end } = cycleWindow(payment, ctx.intervalDays)

  // Void (never paid) when the referrer can't earn; recorded so it stays visible
  let voidReason: string | null = null
  if (referrer.is_suspended) voidReason = 'referrer_suspended'
  else if (!(await isActivePayingMember(db, referrer.user_id))) voidReason = 'referrer_not_member'
  else if (!referralOldEnough(referral.activated_at ? new Date(referral.activated_at) : null, new Date(paidAt), s)) {
    voidReason = 'referral_too_new'
  }

  let cash = amount
  let recovery = 0
  let campaignId: string | null = null
  if (!voidReason && referral.campaign_id && PAID_SOURCES.includes(referral.source)) {
    campaignId = referral.campaign_id
    const { data: bal } = await db
      .from('sponsored_campaign_balances')
      .select('recovery_balance_cents')
      .eq('campaign_id', referral.campaign_id)
      .maybeSingle()
    const split = splitSponsored(amount, Number(bal?.recovery_balance_cents || 0), s)
    cash = split.cash
    recovery = split.recovery
  }

  let status: string
  let holdReason: string | null
  let holdUntil: string | null
  if (voidReason) {
    status = 'void'
    holdReason = voidReason
    holdUntil = null
  } else {
    // Project contribution with this commission included, using last cycle's costs
    const costs = await computeCycleCosts(
      db,
      payment.user_id,
      new Date(new Date(start).getTime() - ctx.intervalDays * DAY_MS).toISOString(),
      start,
    )
    const contribution = contributionProfitCents({
      netCollectedCents: net,
      refundedCents: payment.refunded_cents,
      chargebackCents: payment.chargeback_cents,
      referralCommissionCents: cash,
      processingCents: payment.processing_fee_cents ?? estimatedProcessingFeeCents(payment.amount, s),
      usageCostCents: costs.usageCents,
      sharedCostCents: costs.sharedCents,
      supportCents: s.support_cost_cents,
      adRecoveryCents: recovery,
    })
    const decision = decideCommissionStatus({
      paidAt: new Date(paidAt),
      netCents: net,
      totalCommissionCents: amount,
      contributionCents: contribution,
      s,
    })
    status = decision.status
    holdReason = decision.status === 'held' ? decision.reason : null
    holdUntil = decision.holdUntil.toISOString()
  }

  const { data: entry, error } = await db
    .from('commission_ledger')
    .insert({
      entry_type: 'referral_commission',
      participant_id: referrer.id,
      source_payment_id: payment.id,
      referral_id: referral.id,
      campaign_id: campaignId,
      referred_user_id: payment.user_id,
      cycle_start: start,
      cycle_end: end,
      net_collected_cents: net,
      rate: s.referral_rate,
      amount_cents: amount,
      cash_payable_cents: cash,
      ad_recovery_cents: recovery,
      status,
      hold_reason: holdReason,
      hold_until: holdUntil,
    })
    .select('id')
    .single()
  if (error) {
    if (error.code === '23505') return null
    throw new Error(`commission insert failed: ${error.message}`)
  }

  if (recovery > 0 && campaignId) {
    await db.from('ad_recovery_ledger').insert({
      campaign_id: campaignId,
      entry_type: 'recovery',
      amount_cents: -recovery,
      commission_entry_id: entry.id,
    })
  }

  return { entryId: entry.id, amountCents: amount, status, reason: holdReason }
}

// ---------------------------------------------------------------------------
// Referral credit (before a renewal charge)
// ---------------------------------------------------------------------------

export interface CreditQuote {
  participantId: string
  activeReferrals: number
  creditCents: number
  /** false in shadow mode: record the credit, charge the full bill */
  live: boolean
}

/** What this member's active referrals take off their bill this cycle. */
export async function referralCreditFor(
  db: SupabaseClient,
  sub: { user_id: string },
  billCents: number,
): Promise<CreditQuote | null> {
  const { data: participant } = await db
    .from('referral_participants')
    .select('id, is_internal, is_suspended')
    .eq('user_id', sub.user_id)
    .maybeSingle()
  if (!participant || participant.is_internal || participant.is_suspended) return null
  const s = await loadPartnerSettings(db)
  const activeReferrals = await countActiveReferrals(db, participant.id)
  const creditCents = referralCreditCents(activeReferrals, billCents, s)
  if (creditCents <= 0) return null
  return { participantId: participant.id, activeReferrals, creditCents, live: s.credits_live }
}

/** Record a credit quote. Live credits are 'paid' (taken off the bill); shadow ones are 'void'. */
export async function recordReferralCredit(
  db: SupabaseClient,
  params: {
    quote: CreditQuote
    paymentId: string | null
    userId: string
    cycleStart: string
    cycleEnd: string
  },
): Promise<void> {
  const { quote } = params
  const { error } = await db.from('commission_ledger').insert({
    entry_type: 'referral_credit',
    participant_id: quote.participantId,
    source_payment_id: params.paymentId,
    referred_user_id: params.userId,
    cycle_start: params.cycleStart,
    cycle_end: params.cycleEnd,
    amount_cents: quote.creditCents,
    cash_payable_cents: 0,
    status: quote.live ? 'paid' : 'void',
    hold_reason: quote.live ? null : 'shadow_mode',
    notes: `${quote.activeReferrals} active referral${quote.activeReferrals === 1 ? '' : 's'}`,
  })
  if (error && error.code !== '23505') throw new Error(`credit insert failed: ${error.message}`)
}

// ---------------------------------------------------------------------------
// Refunds and chargebacks
// ---------------------------------------------------------------------------

/**
 * Apply a refund or chargeback to a payment and reverse its commissions in
 * proportion. Pass `totalCents` for a cumulative amount (Stripe's
 * amount_refunded) or `addCents` + `eventId` for one event (a PayPal refund).
 */
export async function reversePayment(
  db: SupabaseClient,
  paymentId: string,
  params: { kind: 'refund' | 'chargeback'; totalCents?: number; addCents?: number; eventId?: string },
): Promise<{ reversedCents: number } | null> {
  const payment = await loadPayment(db, paymentId)
  if (!payment) return null

  const metadata = { ...(payment.metadata || {}) } as Record<string, unknown>
  const seen = new Set((metadata.reversal_events as string[] | undefined) || [])
  if (params.eventId && seen.has(params.eventId)) return { reversedCents: 0 }

  const column = params.kind === 'refund' ? 'refunded_cents' : 'chargeback_cents'
  const current = payment[column]
  const next = params.totalCents !== undefined ? Math.max(current, params.totalCents) : current + (params.addCents || 0)
  if (params.eventId) metadata.reversal_events = [...seen, params.eventId]

  const now = new Date().toISOString()
  await db
    .from('payment_history')
    .update({
      [column]: next,
      ...(params.kind === 'refund' ? { refunded_at: now } : { disputed_at: now }),
      metadata,
    })
    .eq('id', payment.id)
  payment[column] = next

  const totalReversed = Math.min(payment.refunded_cents + payment.chargeback_cents, payment.amount)

  const { data: entries } = await db
    .from('commission_ledger')
    .select('id, participant_id, referral_id, campaign_id, referred_user_id, cycle_start, cycle_end, amount_cents, cash_payable_cents, ad_recovery_cents, status, hold_until')
    .eq('source_payment_id', payment.id)
    .eq('entry_type', 'referral_commission')
    .not('status', 'in', '(void,reversed)')

  let reversedCents = 0
  for (const entry of entries || []) {
    const { data: prior } = await db
      .from('commission_ledger')
      .select('amount_cents')
      .eq('corrects_entry_id', entry.id)
      .eq('entry_type', 'reversal')
    const alreadyReversed = (prior || []).reduce((sum, r) => sum - (r.amount_cents || 0), 0)
    const delta = reversalDeltaCents({
      entryAmountCents: entry.amount_cents,
      paymentAmountCents: payment.amount,
      totalReversedOnPaymentCents: totalReversed,
      alreadyReversedOnEntryCents: alreadyReversed,
    })
    if (delta <= 0) continue

    // Split the reversal between cash and ad recovery in the original proportions
    const recoveryPart = entry.amount_cents > 0 ? Math.round((delta * entry.ad_recovery_cents) / entry.amount_cents) : 0
    const cashPart = delta - recoveryPart
    const fullyReversed = alreadyReversed + delta >= entry.amount_cents
    const wasPaid = entry.status === 'paid'
    // Unpaid and fully reversed: both rows close out. Otherwise the reversal
    // follows the original so balances net correctly (or comes off the next payout).
    const reversalStatus = wasPaid ? 'approved' : fullyReversed ? 'reversed' : entry.status

    const { data: rev, error } = await db
      .from('commission_ledger')
      .insert({
        entry_type: 'reversal',
        participant_id: entry.participant_id,
        source_payment_id: payment.id,
        referral_id: entry.referral_id,
        campaign_id: entry.campaign_id,
        referred_user_id: entry.referred_user_id,
        cycle_start: entry.cycle_start,
        cycle_end: entry.cycle_end,
        amount_cents: -delta,
        cash_payable_cents: -cashPart,
        ad_recovery_cents: -recoveryPart,
        status: reversalStatus,
        hold_until: wasPaid ? null : entry.hold_until,
        corrects_entry_id: entry.id,
        notes: params.kind,
      })
      .select('id')
      .single()
    if (error) throw new Error(`reversal insert failed: ${error.message}`)

    if (!wasPaid && fullyReversed) {
      await db.from('commission_ledger').update({ status: 'reversed', decided_at: now }).eq('id', entry.id)
    }
    if (recoveryPart > 0 && entry.campaign_id) {
      await db.from('ad_recovery_ledger').insert({
        campaign_id: entry.campaign_id,
        entry_type: 'adjustment',
        amount_cents: recoveryPart,
        commission_entry_id: rev.id,
        notes: `${params.kind} reversed recovered ad spend`,
      })
    }
    reversedCents += delta
  }

  // The referred member's own payment was fully reversed: their referral stops counting
  if (totalReversed >= payment.amount) {
    await setReferralStatus(db, payment.user_id, params.kind === 'refund' ? 'refunded' : 'chargeback')
  }

  const s = await loadPartnerSettings(db)
  await writeProfitSnapshot(db, payment, s, { intervalDays: 28, final: false }).catch(err =>
    console.error('[partners] snapshot after reversal failed', err),
  )
  return { reversedCents }
}

/** Find the payment_history row for a provider charge id. */
export async function findPaymentByCharge(
  db: SupabaseClient,
  by: { paypalCaptureId?: string | null; stripePaymentIntentId?: string | null },
): Promise<string | null> {
  if (by.paypalCaptureId) {
    const { data } = await db.from('payment_history').select('id').eq('paypal_capture_id', by.paypalCaptureId).maybeSingle()
    if (data) return data.id
  }
  if (by.stripePaymentIntentId) {
    const { data } = await db
      .from('payment_history')
      .select('id')
      .eq('stripe_payment_intent_id', by.stripePaymentIntentId)
      .maybeSingle()
    if (data) return data.id
  }
  return null
}

/** PayPal's fee for a capture, from the order response. */
export function paypalFeeCents(rawOrder: unknown): number | null {
  const value = (rawOrder as {
    purchase_units?: { payments?: { captures?: { seller_receivable_breakdown?: { paypal_fee?: { value?: string } } }[] } }[]
  })?.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.paypal_fee?.value
  if (!value) return null
  const cents = Math.round(parseFloat(value) * 100)
  return Number.isFinite(cents) ? cents : null
}
