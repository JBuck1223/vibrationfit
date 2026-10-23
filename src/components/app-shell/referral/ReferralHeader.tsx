'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useInShell } from '@/lib/app-shell/shell-context'
import { StudioToggle } from '../StudioToggle'
import { ShellWalkthroughButton } from '../ShellWalkthroughButton'

const BASE = '/referral'
const TABS = [
  { label: 'Share', href: BASE },
  { label: 'Referrals', href: `${BASE}/referrals` },
  { label: 'Earnings', href: `${BASE}/earnings` },
  { label: 'Payouts', href: `${BASE}/payouts` },
]

/**
 * Referral Partners' header in the app shell, in place of the studio's top
 * bar: a centered Share | Referrals | Earnings | Payouts toggle.
 */
export function ReferralHeader() {
  const inShell = useInShell()
  const path = (usePathname() ?? BASE).replace(/\/$/, '') || BASE
  if (!inShell) return null
  return (
    <div className="mb-5 flex justify-center">
      <h1 className="sr-only">Referral Partners</h1>
      <StudioToggle
        label="Referral Partners"
        className="w-full md:w-[460px]"
        options={TABS.map((t) => ({ label: t.label, href: t.href, active: path === t.href }))}
      />
      <ShellWalkthroughButton />
    </div>
  )
}
