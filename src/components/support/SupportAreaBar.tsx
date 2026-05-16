'use client'

import { MessageSquare, List, Plus } from 'lucide-react'
import { AreaBar, type AreaBarTab } from '@/lib/design-system/components'

const TABS: AreaBarTab[] = [
  {
    label: 'All tickets',
    path: '/support/tickets',
    icon: List,
    exactPath: true,
  },
  {
    label: 'New Ticket',
    path: '/support',
    icon: Plus,
  },
]

export function SupportAreaBar() {
  return (
    <AreaBar
      area={{ name: 'Support', icon: MessageSquare }}
      areaHeadline="Support"
      tabs={TABS}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
