'use client'

import { Clock, PenLine, Plus, Sparkles, Wand2 } from 'lucide-react'
import { usePathname, useRouter, useSelectedLayoutSegment } from 'next/navigation'
import { AreaBar, type AreaBarContextNavItem, type AreaBarVersionSelector } from '@/lib/design-system/components'
import { useManifestationsStudio } from './ManifestationsStudioContext'

const TABS = [
  { label: 'My Board', path: '/manifestations', icon: Wand2 },
  { label: 'Create', path: '/manifestations/create', icon: PenLine },
]

const CREATE_AREA_ROUTES = ['/manifestations/create', '/manifestations/new', '/manifestations/ideas', '/manifestations/queue']

const SECONDARY_TABS = [
  { label: 'Add New', path: '/manifestations/new', icon: Plus },
  { label: 'VIVA Ideas', path: '/manifestations/ideas', icon: Sparkles },
  { label: 'Queue', path: '/manifestations/queue', icon: Clock },
]

const CREATE_TOOL_SUBTEXT: Record<string, string> = {
  '/manifestations/new': 'Add a manifestation with image, why you want it, status, and life category tags.',
  '/manifestations/ideas': 'VIVA extracts manifestation ideas from your Life Vision to populate your board.',
  '/manifestations/queue': 'Track in-progress VIVA generation jobs and completed outputs.',
}

const NON_DETAIL_SEGMENTS = new Set(['new', 'create', 'ideas', 'queue', 'export', 'resources', 'about', 'gallery'])

export function ManifestationsAreaBar() {
  const pathname = usePathname()
  const router = useRouter()
  const segment = useSelectedLayoutSegment()
  const { manifestations } = useManifestationsStudio()

  const isCreateArea = CREATE_AREA_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isOnSecondaryPage = SECONDARY_TABS.some(t => pathname === t.path || pathname.startsWith(t.path + '/'))
  const isDetail = Boolean(segment && !NON_DETAIL_SEGMENTS.has(segment))

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

  let versionSelectors: AreaBarVersionSelector[] | undefined
  if (isDetail && segment) {
    versionSelectors = [{
      id: 'manifestation',
      label: 'Manifestation',
      icon: Wand2,
      position: 'contextRow',
      searchable: true,
      options: manifestations.map(m => ({
        id: m.id,
        label: m.name,
        sublabel: m.status === 'actualized' ? 'Actualized' : 'Active',
        icon: Wand2,
      })),
      selectedId: segment,
      onSelect: (id: string) => {
        if (id !== segment) router.push(`/manifestations/${id}`)
      },
    }]
  }

  return (
    <AreaBar
      area={{ name: 'Manifestations', icon: Wand2 }}
      tabs={TABS}
      contextNav={contextNav}
      contextText={contextText}
      versionSelectors={versionSelectors}
      keepTabActive={!isOnSecondaryPage}
      activeParentPath={isOnSecondaryPage ? '/manifestations/create' : isDetail ? '/manifestations' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
