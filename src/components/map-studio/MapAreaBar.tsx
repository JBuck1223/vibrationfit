'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Map, Target, PenLine, Calendar, CalendarDays, LayoutGrid } from 'lucide-react'
import { AreaBar, type AreaBarContextNavItem } from '@/lib/design-system/components'
import type { MapViewMode } from '@/lib/map/map-date-utils'

const TABS = [
  { label: 'MAP', path: '/map', icon: Target },
  { label: 'Update', path: '/map/update', icon: PenLine },
]

const UPDATE_AREA_ROUTES = ['/map/update', '/map/update/system', '/map/update/custom']

export function MapAreaBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isMapTab = pathname === '/map' || pathname === '/map/'
  const isUpdateArea = UPDATE_AREA_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isUpdateSystem = pathname === '/map/update/system'
  const isUpdateCustom = pathname === '/map/update/custom'
  const isUpdateLanding = pathname === '/map/update' || pathname === '/map/update/'

  let contextNav: AreaBarContextNavItem[] | undefined
  let contextText: string | undefined

  if (isMapTab) {
    const viewParam = searchParams.get('view')
    const currentView: MapViewMode =
      viewParam === 'week' || viewParam === 'month' ? viewParam : 'day'
    const dateQs = searchParams.get('date') ? `&date=${searchParams.get('date')}` : ''
    const dateOnlyQs = searchParams.get('date') ? `?date=${searchParams.get('date')}` : ''
    contextNav = [
      {
        label: 'Day',
        path: '/map' + dateOnlyQs,
        icon: Calendar,
        isActive: currentView === 'day',
      },
      {
        label: 'Week',
        path: `/map?view=week${dateQs}`,
        icon: CalendarDays,
        isActive: currentView === 'week',
      },
      {
        label: 'Month',
        path: `/map?view=month${dateQs}`,
        icon: LayoutGrid,
        isActive: currentView === 'month',
      },
    ]
    contextText = 'Run the reps. Future you will thank you.'
  } else if (isUpdateArea) {
    contextNav = [
      {
        label: 'Overview',
        path: '/map/update',
        icon: Map,
        isActive: isUpdateLanding,
      },
      {
        label: 'System',
        path: '/map/update/system',
        icon: Target,
        isActive: isUpdateSystem,
      },
      {
        label: 'Custom',
        path: '/map/update/custom',
        icon: PenLine,
        isActive: isUpdateCustom,
      },
    ]
    if (isUpdateSystem) {
      contextText = 'Choose your alignment tools for each pillar.'
    } else if (isUpdateCustom) {
      contextText = 'Add personal commitments tagged to your life categories.'
    } else {
      contextText = 'Update your System MAP and Custom actions.'
    }
  }

  const isOnUpdateSubPage = isUpdateSystem || isUpdateCustom

  return (
    <AreaBar
      area={{ name: 'MAP', icon: Map }}
      tabs={TABS}
      contextNav={contextNav}
      contextText={contextText}
      variant="default"
      appLikePrimaryTabs
      keepTabActive={isMapTab || isUpdateArea}
      activeParentPath={isOnUpdateSubPage ? '/map/update' : undefined}
    />
  )
}
