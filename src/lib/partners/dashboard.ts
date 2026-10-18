/**
 * Member Partners dashboard: a read-only view of the ledger for one
 * referral_participants row. Callers pass a service-role client and must
 * scope `participant` to the signed-in member themselves.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type PartnerReferralStatus =
  | 'clicked'
  | 'signed_up'
  | 'payment_pending'
  | 'active'
  | 'failed_payment'
  | 'paused'
  | 'refunded'
  | 'cancelled'
  | 'chargeback'
  | 'fraud'

export type CommissionBucket = 'pending' | 'held' | 'approved' | 'paid'

export interface PartnerReferral {
  id: string
  referredEmail: string
  status: PartnerReferralStatus
  createdAt: string
  activatedAt: string | null
  /** For active referrals: 'credit' fills one of the first credit slots, 'cash' earns commission. */
  slot: 'credit' | 'cash' | null
  /** Cash commission on this referral, excluding void and reversed entries. */
  earnedCents: number
}

export interface PartnerPayout {
  id: string
  amountCents: number
  status: string
  method: string
  periodEnd: string
  paidAt: string | null
  createdAt: string
}

export interface PartnerDashboard {
  isMember: boolean
  isInternal: boolean
  isSuspended: boolean
  creditsLive: boolean
  creditSlots: number
  creditPerReferralCents: number
  referralRate: number
  refundHoldDays: number
  minimumPayoutCents: number
  activeReferrals: number
  billCents: number
  /** What the next bill credit would be. Only applied when creditsLive is true. */
  creditCents: number
  balance: Record<CommissionBucket, number>
  referrals: PartnerReferral[]
  payouts: PartnerPayout[]
}

export interface PartnerParticipant {
  id: string
  user_id: string | null
  is_internal?: boolean | null
  is_suspended?: boolean | null
}

const DEFAULT_BILL_CENTS = 9900
const BUCKETS: CommissionBucket[] = ['pending', 'held', 'approved', 'paid']
const CASH_ENTRY_TYPES = ['referral_commission', 'adjustment', 'reversal']

interface SettingsRow {
  credits_live: boolean
  credit_slots: number
  credit_per_referral_cents: number
  referral_rate: number
  refund_hold_days: number
  minimum_payout_cents: number
}

interface ReferralRow {
  id: string
  referred_email: string
  status: PartnerReferralStatus
  created_at: string
  activated_at: string | null
}

interface LedgerRow {
  referral_id: string | null
  cash_payable_cents: number
  status: string
}

interface PayoutRow {
  id: string
  amount_cents: number
  status: string
  method: string
  period_end: string
  paid_at: string | null
  created_at: string
}

export async function loadPartnerDashboard(
  db: SupabaseClient,
  participant: PartnerParticipant,
): Promise<PartnerDashboard> {
  const [settingsRes, referralsRes, ledgerRes, payoutsRes, membershipRes] = await Promise.all([
    db
      .from('partner_program_settings')
      .select('credits_live, credit_slots, credit_per_referral_cents, referral_rate, refund_hold_days, minimum_payout_cents')
      .eq('id', 1)
      .maybeSingle(),
    db
      .from('referrals')
      .select('id, referred_email, status, created_at, activated_at')
      .eq('referrer_id', participant.id)
      .order('created_at', { ascending: false })
      .limit(200),
    db
      .from('commission_ledger')
      .select('referral_id, cash_payable_cents, status')
      .eq('participant_id', participant.id)
      .in('entry_type', CASH_ENTRY_TYPES),
    db
      .from('partner_payouts')
      .select('id, amount_cents, status, method, period_end, paid_at, created_at')
      .eq('participant_id', participant.id)
      .order('created_at', { ascending: false })
      .limit(50),
    participant.user_id
      ? db
          .from('customer_subscriptions')
          .select('amount_cents, membership_tiers!inner(plan_category)')
          .eq('user_id', participant.user_id)
          .eq('status', 'active')
          .eq('membership_tiers.plan_category', 'subscription')
          .limit(1)
      : Promise.resolve({ data: [] as { amount_cents: number | null }[] }),
  ])

  const s = settingsRes.data as SettingsRow | null
  const creditSlots = Number(s?.credit_slots ?? 3)
  const creditPerReferralCents = Number(s?.credit_per_referral_cents ?? 3300)

  const referralRows = (referralsRes.data as ReferralRow[] | null) || []
  const ledgerRows = (ledgerRes.data as LedgerRow[] | null) || []
  const payoutRows = (payoutsRes.data as PayoutRow[] | null) || []
  const membership = ((membershipRes.data as { amount_cents: number | null }[] | null) || [])[0]

  const isMember = Boolean(membership)
  const billCents = membership?.amount_cents ?? DEFAULT_BILL_CENTS

  // Credit slots go to the earliest active referrals by activated_at (same rule as the ledger).
  const slotById = new Map<string, 'credit' | 'cash'>()
  referralRows
    .filter(r => r.status === 'active')
    .sort((a, b) => (a.activated_at || a.created_at).localeCompare(b.activated_at || b.created_at))
    .forEach((r, rank) => slotById.set(r.id, rank < creditSlots ? 'credit' : 'cash'))
  const activeReferrals = slotById.size

  const balance: Record<CommissionBucket, number> = { pending: 0, held: 0, approved: 0, paid: 0 }
  const earnedByReferral = new Map<string, number>()
  for (const row of ledgerRows) {
    const cents = Number(row.cash_payable_cents) || 0
    if ((BUCKETS as string[]).includes(row.status)) {
      balance[row.status as CommissionBucket] += cents
      if (row.referral_id) {
        earnedByReferral.set(row.referral_id, (earnedByReferral.get(row.referral_id) || 0) + cents)
      }
    }
  }

  const earnsNothing = Boolean(participant.is_internal) || Boolean(participant.is_suspended)
  const creditCents = earnsNothing
    ? 0
    : Math.min(Math.min(activeReferrals, creditSlots) * creditPerReferralCents, Math.max(billCents, 0))

  return {
    isMember,
    isInternal: Boolean(participant.is_internal),
    isSuspended: Boolean(participant.is_suspended),
    creditsLive: Boolean(s?.credits_live),
    creditSlots,
    creditPerReferralCents,
    referralRate: Number(s?.referral_rate ?? 0.2),
    refundHoldDays: Number(s?.refund_hold_days ?? 30),
    minimumPayoutCents: Number(s?.minimum_payout_cents ?? 2500),
    activeReferrals,
    billCents,
    creditCents,
    balance,
    referrals: referralRows.map(r => ({
      id: r.id,
      referredEmail: r.referred_email,
      status: r.status,
      createdAt: r.created_at,
      activatedAt: r.activated_at,
      slot: slotById.get(r.id) ?? null,
      earnedCents: earnedByReferral.get(r.id) || 0,
    })),
    payouts: payoutRows.map(p => ({
      id: p.id,
      amountCents: p.amount_cents,
      status: p.status,
      method: p.method,
      periodEnd: p.period_end,
      paidAt: p.paid_at,
      createdAt: p.created_at,
    })),
  }
}
