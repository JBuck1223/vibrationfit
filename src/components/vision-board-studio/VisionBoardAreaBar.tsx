'use client'

import { Image, PenLine, Plus, Sparkles, Clock } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, AreaBarSecondaryTabStrip } from '@/lib/design-system/components'

const TABS = [
  { label: 'My Board', path: '/vision-board', icon: Image },
  { label: 'Create', path: '/vision-board/create', icon: PenLine },
]

const CREATE_AREA_ROUTES = ['/vision-board/create', '/vision-board/new', '/vision-board/ideas', '/vision-board/queue']

const SECONDARY_TABS = [
  { label: 'Add New', path: '/vision-board/new', icon: Plus },
  { label: 'VIVA Ideas', path: '/vision-board/ideas', icon: Sparkles },
  { label: 'Queue', path: '/vision-board/queue', icon: Clock },
]

function CreateSecondaryNav() {
  const pathname = usePathname()
  const items = SECONDARY_TABS.map((tab) => {
    const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/')
    return {
      key: tab.path,
      href: tab.path,
      label: tab.label,
      icon: tab.icon,
      isActive,
    }
  })
  return <AreaBarSecondaryTabStrip aria-label="Vision Board create tools" items={items} />
}

export function VisionBoardAreaBar() {
  const pathname = usePathname()

  const isCreateArea = CREATE_AREA_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isOnSecondaryPage = SECONDARY_TABS.some(t => pathname === t.path || pathname.startsWith(t.path + '/'))

  let contextBar: React.ReactNode = undefined
  if (isCreateArea) {
    contextBar = <CreateSecondaryNav />
  }

  return (
    <AreaBar
      area={{ name: 'Vision Board', icon: Image }}
      tabs={TABS}
      contextBar={contextBar}
      keepTabActive={!isOnSecondaryPage}
      activeParentPath={isOnSecondaryPage ? '/vision-board/create' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
