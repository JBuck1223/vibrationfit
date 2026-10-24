'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, LayoutGrid, CreditCard, Shield, Home, Palette } from 'lucide-react'
import { AreaBar, type AreaBarTab } from '@/lib/design-system/components'
import { useInShell } from '@/lib/app-shell/shell-context'
import { useIsNativeShell } from '@/hooks/useNativeShell'
import { isNativeExternalPath } from '@/lib/mobile/native-shell'
import { cn } from '@/lib/utils'
import { PILL_BASE, PILL_OFF, PILL_ON } from '@/lib/app-shell/glass'

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
  const inShell = useInShell()
  const isNativeShell = useIsNativeShell()
  // Billing never renders inside the native shell (App Review 3.1.1).
  const tabs = isNativeShell ? TABS.filter((tab) => !isNativeExternalPath(tab.path)) : TABS
  const pathname = (usePathname() ?? '/account').replace(/\/$/, '') || '/account'

  if (inShell) {
    // The app shell: one row of pills for the account pages, scrolling
    // sideways on phones.
    return (
      <nav aria-label="Account pages" className="-mx-4 mb-5 overflow-x-auto px-4 scrollbar-hide md:mx-0 md:px-0">
        <div className="flex w-max gap-2 md:mx-auto md:w-auto md:flex-wrap md:justify-center">
          {tabs.map((tab) => {
            const active = tab.path === '/account' ? pathname === '/account' : pathname === tab.path || pathname.startsWith(tab.path + '/')
            const Icon = tab.icon
            return (
              <Link
                key={tab.path}
                href={tab.path}
                aria-current={active ? 'page' : undefined}
                className={cn(PILL_BASE, 'inline-flex h-9 items-center gap-1.5 px-3.5 py-0', active ? PILL_ON : PILL_OFF)}
              >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>
    )
  }

  return (
    <AreaBar
      area={{ name: 'Account', icon: User }}
      areaHeadline="Account Settings"
      tabs={tabs}
      variant="default"
      appLikePrimaryTabs
      fluidAppLikeTabs
    />
  )
}
