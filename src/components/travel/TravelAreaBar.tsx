'use client'

import { Plane, Luggage, Map, BarChart3, Sparkles, NotebookText, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, type AreaBarContextNavItem } from '@/lib/design-system/components'

const TABS = [
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
