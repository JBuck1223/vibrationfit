'use client'

import { FolderKanban, Kanban, Settings } from 'lucide-react'
import { AreaBar, type AreaBarTab } from '@/lib/design-system/components'

const TABS: AreaBarTab[] = [
  { label: 'All', path: '/admin/projects', icon: FolderKanban, exactPath: true },
  { label: 'Board', path: '/admin/projects/board', icon: Kanban },
  { label: 'Settings', path: '/admin/projects/settings', icon: Settings },
]

export function ProjectsAreaBar({ contextText }: { contextText?: string }) {
  return (
    <AreaBar
      area={{ name: 'Projects', icon: FolderKanban }}
      areaHeadline="Projects"
      tabs={TABS}
      contextText={contextText}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
