'use client'

import { HardDrive, History } from 'lucide-react'
import { AreaBar, type AreaBarTab } from '@/lib/design-system/components'

const TABS: AreaBarTab[] = [
  { label: 'Overview', path: '/storage', icon: HardDrive },
  { label: 'History', path: '/storage-history', icon: History },
]

export function StorageAreaBar() {
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
