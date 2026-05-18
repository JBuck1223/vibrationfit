'use client'

import { usePathname } from 'next/navigation'
import { Map, Target, History } from 'lucide-react'
import { AreaBar } from '@/lib/design-system/components'

const TABS = [
  { label: 'MAP', path: '/map', icon: Target },
  { label: 'History', path: '/map/history', icon: History },
]

export function MapAreaBar() {
  const pathname = usePathname()

  const isCommitmentDetail = /^\/map\/c\/[^/]+/.test(pathname)
  const isTargetDetail = /^\/map\/t\/[^/]+/.test(pathname)
  const isNewPage = pathname === '/map/new'
  const isDetailPage = isCommitmentDetail || isTargetDetail || isNewPage

  return (
    <AreaBar
      area={{ name: 'MAP', icon: Map }}
      tabs={isDetailPage ? [] : TABS}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
