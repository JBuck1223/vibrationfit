'use client'

import { usePathname } from 'next/navigation'
import { Map, Eye, PenLine, Calendar, CalendarDays, LayoutGrid } from 'lucide-react'
import { AreaBar, type AreaBarContextNavItem } from '@/lib/design-system/components'
import { useMapStudio } from './MapStudioContext'

const TABS = [
  { label: 'View', path: '/map', icon: Eye },
  { label: 'Update', path: '/map/update', icon: PenLine },
]

export function MapAreaBar() {
  const pathname = usePathname()
  const { viewMode, setViewMode } = useMapStudio()
  const isMapTab = pathname === '/map' || pathname === '/map/'
  const isUpdateArea = pathname.startsWith('/map/update')

  let contextNav: AreaBarContextNavItem[] | undefined
  let contextText: string | undefined

  if (isMapTab) {
    contextNav = [
      {
        label: 'Day',
        onClick: () => setViewMode('day'),
        icon: Calendar,
        isActive: viewMode === 'day',
      },
      {
        label: 'Week',
        onClick: () => setViewMode('week'),
        icon: CalendarDays,
        isActive: viewMode === 'week',
      },
      {
        label: 'Month',
        onClick: () => setViewMode('month'),
        icon: LayoutGrid,
        isActive: viewMode === 'month',
      },
    ]
    contextText = 'Running your Conscious Creation System. Run the reps. Future you will thank you.'
  } else if (isUpdateArea) {
    contextText = 'Choose your rituals and personal commitments.'
  }

  return (
    <AreaBar
      area={{ name: 'MAP', icon: Map }}
      areaHeadline="My Alignment Plan"
      tabs={TABS}
      contextNav={contextNav}
      contextText={contextText}
      variant="default"
      appLikePrimaryTabs
      keepTabActive={isMapTab || isUpdateArea}
    />
  )
}
