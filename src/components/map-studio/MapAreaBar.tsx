'use client'

import { usePathname } from 'next/navigation'
import { Map, CalendarDays, LayoutGrid, Target } from 'lucide-react'
import { AreaBar } from '@/lib/design-system/components'

const TABS = [
  { label: 'Today', path: '/map', icon: Target },
  { label: 'Week', path: '/map/week', icon: CalendarDays },
  { label: 'Portfolio', path: '/map/portfolio', icon: LayoutGrid },
]

export function MapAreaBar() {
  const pathname = usePathname()

  const isCommitmentDetail = /^\/map\/c\/[^/]+/.test(pathname)
  const isTargetDetail = /^\/map\/t\/[^/]+/.test(pathname)
  const isDetailPage = isCommitmentDetail || isTargetDetail

  return (
    <AreaBar
      area={{ name: 'MAP', icon: Map }}
      tabs={isDetailPage ? undefined : TABS}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
