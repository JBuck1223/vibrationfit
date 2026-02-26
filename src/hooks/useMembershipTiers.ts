'use client'

import { useState, useEffect } from 'react'

export const TIER_TYPES = {
  ANNUAL: 'vision_pro_annual',
  MONTHLY_28DAY: 'vision_pro_28day',
  HOUSEHOLD_ANNUAL: 'vision_pro_household_annual',
  HOUSEHOLD_28DAY: 'vision_pro_household_28day',
  INTENSIVE: 'intensive',
  INTENSIVE_HOUSEHOLD: 'intensive_household',
} as const

export type MembershipTier = {
  id: string
  name: string
  description: string | null
  tier_type: string
  is_active: boolean
  price_monthly: number
  price_yearly: number | null
  billing_interval: string
  monthly_token_grant: number
  annual_token_grant: number
  storage_quota_gb: number
  included_seats: number
  max_household_members: number | null
  rollover_max_cycles: number | null
  plan_category: string
  is_household_plan: boolean
  features: string[]
  is_popular: boolean
  display_order: number
}

export type TierLookup = {
  tiers: MembershipTier[]
  loading: boolean
  byType: (tierType: string) => MembershipTier | undefined
  tokenGrant: (tierType: string) => number
  storageQuota: (tierType: string) => number
  price: (tierType: string) => number
}

let cachedTiers: MembershipTier[] | null = null
let fetchPromise: Promise<MembershipTier[]> | null = null

async function fetchTiers(): Promise<MembershipTier[]> {
  if (cachedTiers) return cachedTiers
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch('/api/billing/tiers')
    .then(res => res.json())
    .then(data => {
      cachedTiers = data.tiers || []
      fetchPromise = null
      return cachedTiers!
    })
    .catch(() => {
      fetchPromise = null
      return [] as MembershipTier[]
    })

  return fetchPromise
}

export function useMembershipTiers(): TierLookup {
  const [tiers, setTiers] = useState<MembershipTier[]>(cachedTiers || [])
  const [loading, setLoading] = useState(!cachedTiers)

  useEffect(() => {
    if (cachedTiers) {
      setTiers(cachedTiers)
      setLoading(false)
      return
    }

    fetchTiers().then(data => {
      setTiers(data)
      setLoading(false)
    })
  }, [])

  const byType = (tierType: string) => tiers.find(t => t.tier_type === tierType)

  const tokenGrant = (tierType: string) => {
    const tier = byType(tierType)
    if (!tier) return 0
    return tier.billing_interval === 'year' ? tier.annual_token_grant : tier.monthly_token_grant
  }

  const storageQuota = (tierType: string) => {
    const tier = byType(tierType)
    return tier?.storage_quota_gb ?? 0
  }

  const price = (tierType: string) => {
    const tier = byType(tierType)
    if (!tier) return 0
    return tier.billing_interval === 'year' ? (tier.price_yearly ?? tier.price_monthly) : tier.price_monthly
  }

  return { tiers, loading, byType, tokenGrant, storageQuota, price }
}

export function invalidateTiersCache() {
  cachedTiers = null
  fetchPromise = null
}
