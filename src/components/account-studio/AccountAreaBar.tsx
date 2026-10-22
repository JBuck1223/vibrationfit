'use client'

import { User, LayoutGrid, CreditCard, Shield, Home, Palette } from 'lucide-react'
import { AreaBar, type AreaBarTab } from '@/lib/design-system/components'

const TABS: AreaBarTab[] = [
  { label: 'Overview', path: '/account', icon: LayoutGrid },
  {
    label: 'Settings',
    path: '/account/settings',
    icon: User,
    matchPaths: ['/account/settings', '/account/settings/password', '/account/settings/delete'],
  },
  { label: 'Appearance', path: '/account/appearance', icon: Palette },
  { label: 'Household', path: '/account/household', icon: Home },
  { label: 'Billing', path: '/account/billing', icon: CreditCard },
  { label: 'Privacy', path: '/account/privacy', icon: Shield },
]

export function AccountAreaBar() {
  return (
    <AreaBar
      area={{ name: 'Account', icon: User }}
      areaHeadline="Account Settings"
      tabs={TABS}
      variant="default"
      appLikePrimaryTabs
      fluidAppLikeTabs
    />
  )
}
