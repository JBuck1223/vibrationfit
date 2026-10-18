/**
 * What a member costs to serve over a billing cycle.
 *
 * - Usage: token_usage rows for the member and their household (VIVA via the
 *   gateway, music via Mureka, images via fal/OpenAI, voice via ElevenLabs),
 *   using the reconciled vendor cost when available.
 * - Shared: platform costs with no member on them (AWS, Vercel, Supabase from
 *   provider_costs_daily, plus AI calls with no user or marked non-billable),
 *   divided across active paying members.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { sharedCostPerMemberCents } from './math'

const SHARED_INFRA_PROVIDERS = ['aws', 'vercel_infra', 'supabase']
const PAGE = 1000

export interface CycleCosts {
  usageCents: number
  sharedCents: number
  breakdown: Record<string, number>
}

type CostRow = { provider: string | null; actual_cost_cents: number | string | null; calculated_cost_cents: number | string | null }

function rowCost(r: CostRow): number {
  return Number(r.actual_cost_cents ?? r.calculated_cost_cents ?? 0) || 0
}

async function householdUserIds(db: SupabaseClient, userId: string): Promise<string[]> {
  const { data: account } = await db.from('user_accounts').select('household_id').eq('id', userId).maybeSingle()
  if (!account?.household_id) return [userId]
  const { data: members } = await db.from('household_members').select('user_id').eq('household_id', account.household_id)
  const ids = new Set([userId, ...(members || []).map(m => m.user_id as string)])
  return [...ids]
}

async function sumTokenUsage(
  build: (from: number, to: number) => PromiseLike<{ data: CostRow[] | null; error: unknown }>,
): Promise<Record<string, number>> {
  const byProvider: Record<string, number> = {}
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1)
    if (error) throw new Error(`token_usage query failed: ${String((error as { message?: string }).message || error)}`)
    for (const r of data || []) {
      const key = r.provider || 'other'
      byProvider[key] = (byProvider[key] || 0) + rowCost(r)
    }
    if (!data || data.length < PAGE) break
  }
  return byProvider
}

// Shared costs are identical for every payment in the same window; cache per process.
const sharedCache = new Map<string, Promise<{ totalCents: number; breakdown: Record<string, number>; payingMembers: number }>>()

async function sharedCostsForWindow(db: SupabaseClient, startIso: string, endIso: string) {
  const key = `${startIso.slice(0, 10)}_${endIso.slice(0, 10)}`
  const cached = sharedCache.get(key)
  if (cached) return cached
  const promise = (async () => {
    const breakdown: Record<string, number> = {}

    const { data: infra, error: infraErr } = await db
      .from('provider_costs_daily')
      .select('provider, amount_cents')
      .in('provider', SHARED_INFRA_PROVIDERS)
      .gte('day', startIso.slice(0, 10))
      .lt('day', endIso.slice(0, 10))
    if (infraErr) throw new Error(`provider_costs_daily query failed: ${infraErr.message}`)
    for (const r of infra || []) {
      breakdown[r.provider] = (breakdown[r.provider] || 0) + (Number(r.amount_cents) || 0)
    }

    const unattributed = await sumTokenUsage((from, to) =>
      db
        .from('token_usage')
        .select('provider, actual_cost_cents, calculated_cost_cents')
        .gte('created_at', startIso)
        .lt('created_at', endIso)
        .or('user_id.is.null,billable.eq.false')
        .range(from, to),
    )
    for (const [provider, cents] of Object.entries(unattributed)) {
      breakdown[`unattributed_${provider}`] = cents
    }

    const { count } = await db
      .from('customer_subscriptions')
      .select('id, membership_tiers!inner(plan_category)', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('membership_tiers.plan_category', 'subscription')

    const totalCents = Object.values(breakdown).reduce((a, b) => a + b, 0)
    return { totalCents, breakdown, payingMembers: count || 0 }
  })()
  sharedCache.set(key, promise)
  promise.catch(() => sharedCache.delete(key))
  return promise
}

export async function computeCycleCosts(
  db: SupabaseClient,
  userId: string,
  startIso: string,
  endIso: string,
): Promise<CycleCosts> {
  const userIds = await householdUserIds(db, userId)
  const usage = await sumTokenUsage((from, to) =>
    db
      .from('token_usage')
      .select('provider, actual_cost_cents, calculated_cost_cents')
      .in('user_id', userIds)
      .eq('billable', true)
      .gte('created_at', startIso)
      .lt('created_at', endIso)
      .range(from, to),
  )
  const shared = await sharedCostsForWindow(db, startIso, endIso)
  const perMemberShared = sharedCostPerMemberCents(shared.totalCents, shared.payingMembers)
  const shareRatio = shared.totalCents > 0 ? perMemberShared / shared.totalCents : 0

  const breakdown: Record<string, number> = {}
  for (const [provider, cents] of Object.entries(usage)) breakdown[provider] = Math.round(cents)
  for (const [provider, cents] of Object.entries(shared.breakdown)) {
    breakdown[`shared_${provider}`] = Math.round(cents * shareRatio)
  }

  return {
    usageCents: Math.round(Object.values(usage).reduce((a, b) => a + b, 0)),
    sharedCents: perMemberShared,
    breakdown,
  }
}
