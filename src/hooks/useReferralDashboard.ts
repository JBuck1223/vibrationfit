'use client'

import { useQuery } from '@tanstack/react-query'
import { keys } from '@/lib/query/keys'
import type { PartnerDashboard } from '@/lib/partners/dashboard'

export interface ReferralParticipant {
  id: string
  email: string
  referral_code: string
  display_name: string | null
  custom_message: string | null
  total_clicks: number
  email_signups: number
  paid_conversions: number
  second_degree_signups: number
}

export interface ReferralInvite {
  id: string
  referred_email: string
  referred_name: string | null
  personalization: string | null
  status: string
  sent_at: string
}

export interface ReferralDashboardData {
  participant: ReferralParticipant
  referralLink: string
  stats: { totalClicks: number; emailSignups: number; paidConversions: number; secondDegreeSignups: number }
  invites: ReferralInvite[]
  paidReferrals: { id: string; referred_email: string | null; created_at: string }[]
  /** Ledger view; null for an email-only (signed-out) lookup. */
  partners: PartnerDashboard | null
}

/**
 * The member's referral link, code, and Partners ledger summary.
 * Signed-in members are auto-enrolled; `email` looks up a signed-out participant.
 */
export function useReferralDashboard(email?: string | null) {
  return useQuery({
    queryKey: email ? keys.referralDashboardByEmail(email) : keys.referralDashboard,
    queryFn: async (): Promise<ReferralDashboardData | null> => {
      const url = email ? `/api/referral/dashboard?${new URLSearchParams({ email })}` : '/api/referral/dashboard'
      let res = await fetch(url)
      if (res.status === 404 && !email) {
        // Members are auto-enrolled; this covers anyone created before that trigger.
        const joinRes = await fetch('/api/referral/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        if (joinRes.ok) res = await fetch(url)
      }
      if (!res.ok) return null
      const data = (await res.json()) as ReferralDashboardData
      return { ...data, invites: data.invites ?? [], paidReferrals: data.paidReferrals ?? [], partners: data.partners ?? null }
    },
  })
}

export function formatCents(cents: number): string {
  const dollars = cents / 100
  return dollars.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
  })
}
