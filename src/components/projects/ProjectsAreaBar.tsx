'use client'

import { usePathname } from 'next/navigation'
import { FolderKanban, Sparkles } from 'lucide-react'
import { AreaBar, type AreaBarTab } from '@/lib/design-system/components'

const ROUTE_SUBTEXT: Record<string, string> = {
  projects: 'Your active projects, organized by life category.',
  organize: 'Dump everything on your mind and let VIVA help you organize it all.',
}

export function ProjectsAreaBar() {
  const pathname = usePathname()

  const isProjectsPage = pathname === '/projects' || pathname === '/projects/'
  const isOrganizePage = pathname === '/projects/organize' || pathname === '/projects/organize/'
  const detailMatch = pathname.match(/^\/projects\/([^/]+)$/)
  const isDetailPage = !!detailMatch?.[1] && detailMatch[1] !== 'organize'

  const tabs: AreaBarTab[] = [
    {
      label: 'Projects',
      path: '/projects',
      icon: FolderKanban,
      exactPath: true,
      ...(isProjectsPage ? { isActive: true } : {}),
    },
    {
      label: 'Organize',
      path: '/projects/organize',
      icon: Sparkles,
      exactPath: true,
      ...(isOrganizePage ? { isActive: true } : {}),
    },
  ]

  const contextKey = isOrganizePage ? 'organize' : 'projects'

  return (
    <AreaBar
      area={{ name: 'Projects', icon: FolderKanban }}
      tabs={tabs}
      contextText={!isDetailPage ? ROUTE_SUBTEXT[contextKey] : undefined}
      keepTabActive
      activeParentPath={isDetailPage ? '/projects' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
