'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gauge, Target, CalendarDays } from 'lucide-react'
import { AreaBar, type AreaBarTab } from '@/lib/design-system/components'
import { useInShell } from '@/lib/app-shell/shell-context'
import { cn } from '@/lib/utils'
import { PILL_BASE, PILL_OFF, PILL_ON } from '@/lib/app-shell/glass'

const TABS: AreaBarTab[] = [
  { label: 'Hub', path: '/assessment', icon: Gauge },
  { label: 'Take', path: '/assessment/new', icon: Target },
  { label: 'History', path: '/assessment/history', icon: CalendarDays },
]

export function AssessmentAreaBar() {
  const inShell = useInShell()
  const pathname = (usePathname() ?? '/assessment').replace(/\/$/, '') || '/assessment'

  if (inShell) {
    // The app shell: one row of pills for the assessment pages, like Account.
    return (
      <nav aria-label="Assessment pages" className="-mx-4 mb-5 overflow-x-auto px-4 scrollbar-hide md:mx-0 md:px-0">
        <div className="flex w-max gap-2 md:mx-auto md:w-auto md:flex-wrap md:justify-center">
          {TABS.map((tab) => {
            const active = tab.path === '/assessment' ? pathname === '/assessment' : pathname === tab.path || pathname.startsWith(tab.path + '/')
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
      area={{ name: 'Assessment', icon: Gauge }}
      tabs={TABS}
      variant="default"
      appLikePrimaryTabs
      fluidAppLikeTabs
    />
  )
}
