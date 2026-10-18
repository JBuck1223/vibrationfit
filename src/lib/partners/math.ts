/**
 * Partners money math. Pure functions only: no database, no clock.
 * Every amount is integer cents.
 */

export interface PartnerSettings {
  referral_rate: number
  credit_slots: number
  credit_per_referral_cents: number
  credits_live: boolean
  minimum_profit_floor_cents: number
  maximum_commission_percentage: number
  minimum_referral_age_days: number
  refund_hold_days: number
  minimum_payout_cents: number
  sponsored_cash_share: number
  processing_fee_rate: number
  processing_fee_fixed_cents: number
  support_cost_cents: number
}

export const DEFAULT_PARTNER_SETTINGS: PartnerSettings = {
  referral_rate: 0.2,
  credit_slots: 3,
  credit_per_referral_cents: 3300,
  credits_live: false,
  minimum_profit_floor_cents: 4000,
  maximum_commission_percentage: 0.45,
  minimum_referral_age_days: 0,
  refund_hold_days: 30,
  minimum_payout_cents: 2500,
  sponsored_cash_share: 0.5,
  processing_fee_rate: 0.0349,
  processing_fee_fixed_cents: 49,
  support_cost_cents: 0,
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Charge minus tax. Refunds and chargebacks are handled later as reversals. */
export function netCollectedCents(amountCents: number, taxCents = 0): number {
  return Math.max(0, amountCents - taxCents)
}

/** Bill credit for a referrer with `activeReferrals` active referrals, capped at the bill. */
export function referralCreditCents(activeReferrals: number, billCents: number, s: PartnerSettings): number {
  const slots = Math.min(Math.max(activeReferrals, 0), s.credit_slots)
  return Math.min(slots * s.credit_per_referral_cents, Math.max(billCents, 0))
}

/**
 * Among a referrer's currently active referrals (ordered by activated_at),
 * the first `credit_slots` earn bill credit and the rest earn cash.
 * `rank` is this referral's 0-based position in that order.
 */
export function earnsCash(rank: number, s: PartnerSettings): boolean {
  return rank >= s.credit_slots
}

export function commissionCents(netCents: number, rate: number): number {
  return Math.round(netCents * rate)
}

/**
 * Split a sponsored commission: the cash share is paid, the rest recovers
 * outstanding ad spend. Once the balance is zero, everything is cash.
 */
export function splitSponsored(
  commission: number,
  recoveryBalanceCents: number,
  s: PartnerSettings,
): { cash: number; recovery: number } {
  if (commission <= 0 || recoveryBalanceCents <= 0) return { cash: commission, recovery: 0 }
  const recovery = Math.min(Math.round(commission * (1 - s.sponsored_cash_share)), recoveryBalanceCents)
  return { cash: commission - recovery, recovery }
}

export function estimatedProcessingFeeCents(amountCents: number, s: PartnerSettings): number {
  if (amountCents <= 0) return 0
  return Math.round(amountCents * s.processing_fee_rate) + s.processing_fee_fixed_cents
}

export interface ContributionInputs {
  netCollectedCents: number
  refundedCents: number
  chargebackCents: number
  referralCommissionCents: number
  processingCents: number
  usageCostCents: number
  sharedCostCents: number
  supportCents: number
  adRecoveryCents: number
}

export function contributionProfitCents(i: ContributionInputs): number {
  return (
    i.netCollectedCents -
    i.refundedCents -
    i.chargebackCents -
    i.referralCommissionCents -
    i.processingCents -
    i.usageCostCents -
    i.sharedCostCents -
    i.supportCents -
    i.adRecoveryCents
  )
}

export type HoldDecision =
  | { status: 'pending'; holdUntil: Date }
  | { status: 'held'; reason: 'below_profit_floor' | 'over_max_commission'; holdUntil: Date }

/** Pending until the refund window passes, or held for an admin when the economics break. */
export function decideCommissionStatus(params: {
  paidAt: Date
  netCents: number
  totalCommissionCents: number
  contributionCents: number
  s: PartnerSettings
}): HoldDecision {
  const holdUntil = new Date(params.paidAt.getTime() + params.s.refund_hold_days * DAY_MS)
  if (params.netCents > 0 && params.totalCommissionCents / params.netCents > params.s.maximum_commission_percentage) {
    return { status: 'held', reason: 'over_max_commission', holdUntil }
  }
  if (params.contributionCents < params.s.minimum_profit_floor_cents) {
    return { status: 'held', reason: 'below_profit_floor', holdUntil }
  }
  return { status: 'pending', holdUntil }
}

export function referralOldEnough(activatedAt: Date | null, paidAt: Date, s: PartnerSettings): boolean {
  if (s.minimum_referral_age_days <= 0) return true
  if (!activatedAt) return false
  return paidAt.getTime() - activatedAt.getTime() >= s.minimum_referral_age_days * DAY_MS
}

/**
 * How much more to reverse on an entry after a refund or chargeback.
 * Idempotent: pass everything already reversed and the new totals.
 */
export function reversalDeltaCents(params: {
  entryAmountCents: number
  paymentAmountCents: number
  totalReversedOnPaymentCents: number
  alreadyReversedOnEntryCents: number
}): number {
  if (params.paymentAmountCents <= 0 || params.entryAmountCents <= 0) return 0
  const share = Math.min(params.totalReversedOnPaymentCents, params.paymentAmountCents) / params.paymentAmountCents
  const target = Math.round(params.entryAmountCents * share)
  return Math.max(0, target - params.alreadyReversedOnEntryCents)
}

/** Shared platform cost per paying member for a window. */
export function sharedCostPerMemberCents(totalSharedCents: number, payingMembers: number): number {
  if (totalSharedCents <= 0) return 0
  return Math.round(totalSharedCents / Math.max(payingMembers, 1))
}
