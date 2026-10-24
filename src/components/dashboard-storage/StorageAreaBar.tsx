'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HardDrive, History } from 'lucide-react'
import { AreaBar, type AreaBarTab } from '@/lib/design-system/components'
import { useInShell } from '@/lib/app-shell/shell-context'
import { cn } from '@/lib/utils'
import { PILL_BASE, PILL_OFF, PILL_ON } from '@/lib/app-shell/glass'

const TABS: AreaBarTab[] = [
  { label: 'Overview', path: '/storage', icon: HardDrive },
  { label: 'History', path: '/storage-history', icon: History },
]

export function StorageAreaBar() {
  const inShell = useInShell()
  const pathname = (usePathname() ?? '/storage').replace(/\/$/, '') || '/storage'

  if (inShell) {
    // The app shell: one row of pills for the storage pages, like Account.
    return (
      <nav aria-label="Storage pages" className="-mx-4 mb-5 overflow-x-auto px-4 scrollbar-hide md:mx-0 md:px-0">
        <div className="flex w-max gap-2 md:mx-auto md:w-auto md:flex-wrap md:justify-center">
          {TABS.map((tab) => {
            const active = pathname === tab.path || pathname.startsWith(tab.path + '/')
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
      area={{ name: 'Storage', icon: HardDrive }}
      areaHeadline="Storage"
      tabs={TABS}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
