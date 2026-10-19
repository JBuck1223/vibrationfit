'use client'

import { Handshake, Share2, Users, Wallet, Receipt } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar } from '@/lib/design-system/components'

const TABS = [
  { label: 'Share', path: '/referral', icon: Share2 },
  { label: 'Referrals', path: '/referral/referrals', icon: Users },
  { label: 'Earnings', path: '/referral/earnings', icon: Wallet },
  { label: 'Payouts', path: '/referral/payouts', icon: Receipt },
]

const CONTEXT_TEXT: Record<string, string> = {
  '/referral': 'Your link, your message, and warm intros for the people you care about.',
  '/referral/referrals': 'Everyone who came in through your link and where they are now.',
  '/referral/earnings': 'Your bill credit, your commission, and how both are earned.',
  '/referral/payouts': 'Commission paid out to you.',
}

export function ReferralPartnersAreaBar() {
  const pathname = usePathname()
  const path = pathname.replace(/\/$/, '') || '/referral'

  return (
    <AreaBar
      area={{ name: 'Referral Partners', icon: Handshake }}
      tabs={TABS}
      contextText={CONTEXT_TEXT[path]}
      keepTabActive
      variant="default"
      appLikePrimaryTabs
      fluidAppLikeTabs
    />
  )
}
