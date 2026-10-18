/**
 * Referral attribution: one referrer per customer, first verified referral wins.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveReferralCode } from '@/lib/referral/helpers'

export type ReferralStatus =
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

export type ReferralSource = 'organic_referral' | 'paid_influencer_audience' | 'broad_paid_influencer_creative' | 'admin_approved'

export interface ReferralRow {
  id: string
  referrer_id: string
  referred_user_id: string | null
  referred_email: string
  source: ReferralSource
  campaign_id: string | null
  status: ReferralStatus
  first_paid_at: string | null
  activated_at: string | null
}

const REFERRAL_COLUMNS = 'id, referrer_id, referred_user_id, referred_email, source, campaign_id, status, first_paid_at, activated_at'

/** Statuses an admin or the payment system has locked; billing events never move them. */
const LOCKED_STATUSES: ReferralStatus[] = ['fraud', 'chargeback']

export async function findReferral(
  db: SupabaseClient,
  by: { userId?: string | null; email?: string | null },
): Promise<ReferralRow | null> {
  if (by.userId) {
    const { data } = await db.from('referrals').select(REFERRAL_COLUMNS).eq('referred_user_id', by.userId).maybeSingle()
    if (data) return data as ReferralRow
  }
  if (by.email) {
    const { data } = await db.from('referrals').select(REFERRAL_COLUMNS).ilike('referred_email', by.email.trim()).maybeSingle()
    if (data) return data as ReferralRow
  }
  return null
}

async function sameCardOnFile(db: SupabaseClient, userA: string, userB: string): Promise<boolean> {
  const { data } = await db
    .from('payment_methods')
    .select('user_id, brand, last4, expiry')
    .in('user_id', [userA, userB])
    .not('last4', 'is', null)
  const cards = data || []
  const key = (c: { brand: string | null; last4: string | null; expiry: string | null }) => `${c.brand}|${c.last4}|${c.expiry}`
  const a = new Set(cards.filter(c => c.user_id === userA).map(key))
  return cards.some(c => c.user_id === userB && a.has(key(c)))
}

/**
 * Record that `referrerId` referred this customer, unless someone already did.
 * Returns the customer's referral (existing or new), or null for self-referrals.
 */
export async function ensureReferral(
  db: SupabaseClient,
  params: {
    referrerId: string
    referredEmail: string
    referredUserId?: string | null
    status: ReferralStatus
    source?: ReferralSource
    campaignId?: string | null
    attributionEventId?: string | null
  },
): Promise<ReferralRow | null> {
  const email = params.referredEmail.trim().toLowerCase()
  const existing = await findReferral(db, { userId: params.referredUserId, email })
  if (existing) {
    if (!existing.referred_user_id && params.referredUserId) {
      await db.from('referrals').update({ referred_user_id: params.referredUserId, updated_at: new Date().toISOString() }).eq('id', existing.id)
      existing.referred_user_id = params.referredUserId
    }
    return existing
  }

  const { data: referrer } = await db
    .from('referral_participants')
    .select('id, user_id, email')
    .eq('id', params.referrerId)
    .maybeSingle()
  if (!referrer) return null
  const isSelf =
    (params.referredUserId && referrer.user_id === params.referredUserId) ||
    referrer.email?.trim().toLowerCase() === email
  if (isSelf) return null

  let status = params.status
  let fraudReason: string | null = null
  if (params.referredUserId && referrer.user_id && (await sameCardOnFile(db, referrer.user_id, params.referredUserId))) {
    status = 'fraud'
    fraudReason = 'Same card on file as the referrer'
  }

  const now = new Date().toISOString()
  const { data, error } = await db
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referred_user_id: params.referredUserId || null,
      referred_email: email,
      source: params.source || 'organic_referral',
      campaign_id: params.campaignId || null,
      attribution_event_id: params.attributionEventId || null,
      status,
      fraud_reason: fraudReason,
      first_paid_at: status === 'active' ? now : null,
      activated_at: status === 'active' ? now : null,
      status_changed_at: now,
    })
    .select(REFERRAL_COLUMNS)
    .single()

  if (error) {
    // A concurrent request recorded the referral first: that one wins.
    if (error.code === '23505') return findReferral(db, { userId: params.referredUserId, email })
    throw new Error(`referral insert failed: ${error.message}`)
  }
  return data as ReferralRow
}

/** Resolve a referral code (current or historical) and attribute the customer to it. */
export async function attributeByCode(
  db: SupabaseClient,
  params: {
    code: string
    referredEmail: string
    referredUserId?: string | null
    status: ReferralStatus
    attributionEventId?: string | null
  },
): Promise<ReferralRow | null> {
  const code = params.code.trim().toLowerCase()
  if (!code) return null
  const referrer = await resolveReferralCode(db, code)
  if (!referrer) return null
  return ensureReferral(db, { ...params, referrerId: referrer.id })
}

/** Move a customer's referral to a new status. Fraud and chargebacks stay put. */
export async function setReferralStatus(
  db: SupabaseClient,
  referredUserId: string,
  status: ReferralStatus,
): Promise<void> {
  const now = new Date().toISOString()
  const patch: Record<string, unknown> = { status, status_changed_at: now, updated_at: now }
  await db
    .from('referrals')
    .update(patch)
    .eq('referred_user_id', referredUserId)
    .neq('status', status)
    .not('status', 'in', `(${LOCKED_STATUSES.join(',')})`)
}

/** A successful payment makes the referral active; the first one stamps the activation date. */
export async function activateReferral(db: SupabaseClient, referral: ReferralRow, paidAt: string): Promise<ReferralRow> {
  if (LOCKED_STATUSES.includes(referral.status)) return referral
  const patch = {
    status: 'active' as const,
    first_paid_at: referral.first_paid_at || paidAt,
    activated_at: referral.activated_at || paidAt,
    status_changed_at: referral.status === 'active' ? undefined : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (referral.status !== 'active' || !referral.first_paid_at || !referral.activated_at) {
    await db.from('referrals').update(patch).eq('id', referral.id)
  }
  return { ...referral, ...patch, status: 'active' }
}

/** 0-based position of this referral among the referrer's active referrals, oldest first. */
export async function activeReferralRank(db: SupabaseClient, referral: ReferralRow): Promise<number> {
  const { data } = await db
    .from('referrals')
    .select('id, activated_at')
    .eq('referrer_id', referral.referrer_id)
    .eq('status', 'active')
    .order('activated_at', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })
  const index = (data || []).findIndex(r => r.id === referral.id)
  return index === -1 ? (data || []).length : index
}

export async function countActiveReferrals(db: SupabaseClient, referrerId: string): Promise<number> {
  const { count } = await db
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', referrerId)
    .eq('status', 'active')
  return count || 0
}
