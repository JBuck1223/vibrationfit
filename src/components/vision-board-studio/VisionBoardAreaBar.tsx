'use client'

import { Image, PenLine, Plus, Sparkles, Clock } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, type AreaBarContextNavItem } from '@/lib/design-system/components'

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

const CREATE_TOOL_SUBTEXT: Record<string, string> = {
  '/vision-board/new': 'Add a new creation with image, status, and life category tags.',
  '/vision-board/ideas': 'VIVA extracts creation ideas from your Life Vision to populate your board.',
  '/vision-board/queue': 'Track in-progress VIVA generation jobs and completed outputs.',
}

export function VisionBoardAreaBar() {
  const pathname = usePathname()

  const isCreateArea = CREATE_AREA_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isOnSecondaryPage = SECONDARY_TABS.some(t => pathname === t.path || pathname.startsWith(t.path + '/'))

  let contextNav: AreaBarContextNavItem[] | undefined
  let contextText: string | undefined
  if (isCreateArea) {
    contextNav = SECONDARY_TABS.map(tab => ({
      label: tab.label,
      path: tab.path,
      icon: tab.icon,
      isActive: pathname === tab.path || pathname.startsWith(tab.path + '/'),
    }))

    const activeCreateTool = SECONDARY_TABS.find(
      t => pathname === t.path || pathname.startsWith(t.path + '/')
    )
    if (activeCreateTool) {
      contextText = CREATE_TOOL_SUBTEXT[activeCreateTool.path]
    }
  }

  return (
    <AreaBar
      area={{ name: 'Vision Board', icon: Image }}
      tabs={TABS}
      contextNav={contextNav}
      contextText={contextText}
      keepTabActive={!isOnSecondaryPage}
      activeParentPath={isOnSecondaryPage ? '/vision-board/create' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
