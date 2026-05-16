'use client'

import { Zap, History } from 'lucide-react'
import { AreaBar, type AreaBarTab } from '@/lib/design-system/components'

const TABS: AreaBarTab[] = [
  { label: 'Overview', path: '/tokens', icon: Zap, exactPath: true },
  { label: 'History', path: '/tokens/history', icon: History },
]

export function TokensAreaBar() {
  return (
    <AreaBar
      area={{ name: 'Tokens', icon: Zap }}
      areaHeadline="Tokens"
      tabs={TABS}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
