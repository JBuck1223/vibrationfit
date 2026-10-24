'use client'

import Link from 'next/link'
import { Plane, Luggage, Map, BarChart3, Sparkles, NotebookText, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, type AreaBarContextNavItem, type AreaBarTab } from '@/lib/design-system/components'
import { useInShell } from '@/lib/app-shell/shell-context'
import { cn } from '@/lib/utils'
import { PILL_BASE, PILL_OFF, PILL_ON } from '@/lib/app-shell/glass'

const TABS: AreaBarTab[] = [
  { label: 'Trips', path: '/travel-tracker', icon: Luggage },
  { label: 'Map', path: '/travel-tracker/map', icon: Map },
  { label: 'Insights', path: '/travel-tracker/reports', icon: BarChart3 },
  { label: 'Dream List', path: '/travel-tracker/dream', icon: Sparkles },
]

const CONTEXT_TRIPS_OVERVIEW = 'Your travels at a glance.'
const CONTEXT_TRIPS_NEW = 'Capture a trip you have taken or one on the horizon.'
const CONTEXT_MAP = 'The world you have experienced, and the world calling you.'
const CONTEXT_INSIGHTS = 'Countries, miles flown, and trips over time.'
const CONTEXT_DREAM = 'Destinations you are ready to actualize.'

export function TravelAreaBar() {
  const pathname = usePathname()
  const inShell = useInShell()

  const isMap =
    pathname === '/travel-tracker/map' || pathname.startsWith('/travel-tracker/map/')
  const isReports =
    pathname === '/travel-tracker/reports' || pathname.startsWith('/travel-tracker/reports/')
  const isDream =
    pathname === '/travel-tracker/dream' || pathname.startsWith('/travel-tracker/dream/')

  const isTripsSection =
    pathname.startsWith('/travel-tracker') && !isMap && !isReports && !isDream

  const onNewTrip =
    pathname === '/travel-tracker/new' || pathname.startsWith('/travel-tracker/new/')
  const onOverview = isTripsSection && !onNewTrip

  let contextNav: AreaBarContextNavItem[] | undefined
  if (isTripsSection) {
    contextNav = [
      {
        label: 'Overview',
        path: '/travel-tracker',
        icon: NotebookText,
        isActive: onOverview,
      },
      {
        label: 'New Trip',
        path: '/travel-tracker/new',
        icon: Plus,
        isActive: onNewTrip,
      },
    ]
  }

  let contextText: string | undefined
  if (isMap) contextText = CONTEXT_MAP
  else if (isReports) contextText = CONTEXT_INSIGHTS
  else if (isDream) contextText = CONTEXT_DREAM
  else if (onNewTrip) contextText = CONTEXT_TRIPS_NEW
  else contextText = CONTEXT_TRIPS_OVERVIEW

  if (inShell) {
    // The app shell: one row of pills for the travel pages, like Account, and
    // a second row for the Trips context (Overview | New Trip).
    const pill = cn(PILL_BASE, 'inline-flex h-9 items-center gap-1.5 px-3.5 py-0')
    return (
      <div className="mb-5 space-y-3">
        <nav aria-label="Travel Tracker pages" className="-mx-4 overflow-x-auto px-4 scrollbar-hide md:mx-0 md:px-0">
          <div className="flex w-max gap-2 md:mx-auto md:w-auto md:flex-wrap md:justify-center">
            {TABS.map((tab) => {
              const active = tab.path === '/travel-tracker' ? isTripsSection : pathname === tab.path || pathname.startsWith(tab.path + '/')
              const Icon = tab.icon
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  aria-current={active ? 'page' : undefined}
                  className={cn(pill, active ? PILL_ON : PILL_OFF)}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </nav>
        {contextNav ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {contextNav.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.path ?? '/travel-tracker'}
                  aria-current={item.isActive ? 'page' : undefined}
                  className={cn(pill, item.isActive ? PILL_ON : PILL_OFF)}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  {item.label}
                </Link>
              )
            })}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <AreaBar
      area={{ name: 'Travel Tracker', icon: Plane }}
      tabs={TABS}
      contextNav={contextNav}
      contextText={contextText}
      keepTabActive
      variant="default"
      appLikePrimaryTabs
    />
  )
}
