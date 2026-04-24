'use client'

import { useRouter } from 'next/navigation'
import { Target, PenLine, Eye, Volume2, FileText, Download, Gem, Home } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, AreaBarSecondaryTabStrip, type ContextOption } from '@/lib/design-system/components'
import { useLifeVisionStudio } from './LifeVisionStudioContext'

const TABS = [
  { label: 'My Visions', path: '/life-vision', icon: Eye },
  { label: 'Create', path: '/life-vision/create', icon: PenLine },
]

const CREATE_AREA_ROUTES = [
  '/life-vision/create',
  '/life-vision/new',
  '/life-vision/manual',
  '/life-vision/refine',
  '/life-vision/refinements',
]

const ACTIVE_VISION_ACTIONS = [
  { label: 'Audio Tracks', path: 'audio', icon: Volume2 },
  { label: 'Stories', path: '/story', icon: FileText, absolute: true },
  { label: 'Download PDF', path: 'print', icon: Download },
  { label: 'Refine', path: 'refine', icon: Gem },
]

const DRAFT_VISION_ACTIONS = [
  { label: 'View Active', path: '/life-vision/active', icon: Eye, absolute: true },
  { label: 'Continue Refining', path: 'refine', icon: Gem },
]

function VisionDetailSecondaryNav({ visionId, isDraft }: { visionId: string; isDraft: boolean }) {
  const pathname = usePathname()
  const actions = isDraft ? DRAFT_VISION_ACTIONS : ACTIVE_VISION_ACTIONS

  const items = actions.map((action) => {
    const href = action.absolute ? action.path : `/life-vision/${visionId}/${action.path}`
    const isActive = pathname === href || pathname.startsWith(href + '/')
    return {
      key: action.label,
      href,
      label: action.label,
      icon: action.icon,
      isActive,
    }
  })

  return (
    <AreaBarSecondaryTabStrip
      aria-label="Vision quick actions"
      items={items}
    />
  )
}

export function LifeVisionAreaBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { visions } = useLifeVisionStudio()

  const isVisionList = pathname === '/life-vision' || pathname === '/life-vision/'
  const isHousehold = pathname.startsWith('/life-vision/household')
  const isCreateArea = CREATE_AREA_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))

  const isVisionDetail = !isVisionList
    && !isHousehold
    && !isCreateArea
    && pathname !== '/life-vision/active'
    && /^\/life-vision\/[^/]+/.test(pathname)
    && !pathname.startsWith('/life-vision/audio')

  let contextSelector: { label: string; options: ContextOption[]; selectedId: string; onSelect: (id: string) => void } | undefined
  let contextBar: React.ReactNode = undefined

  if (isVisionDetail) {
    const segments = pathname.split('/')
    const visionId = segments[2] || ''
    if (/^[a-f0-9-]{36}$/.test(visionId)) {
      const nonDraftVisions = visions.filter(v => !v.is_draft)
      const currentVision = visions.find(v => v.id === visionId)
      const isDraft = currentVision?.is_draft ?? false

      contextSelector = {
        label: 'Vision',
        options: nonDraftVisions.map(v => ({
          id: v.id,
          label: `Version ${v.version_number}${v.household_id ? ' (Household)' : ''}`,
          sublabel: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          badge: v.is_active ? 'Active' : undefined,
          isActive: v.is_active,
        })),
        selectedId: visionId,
        onSelect: (id: string) => router.push(`/life-vision/${id}`),
      }

      contextBar = <VisionDetailSecondaryNav visionId={visionId} isDraft={isDraft} />
    }
  }

  const isOnCreateSubPage = isCreateArea && pathname !== '/life-vision/create'

  return (
    <AreaBar
      area={{ name: 'Life Vision', icon: Target }}
      tabs={TABS}
      contextSelector={contextSelector}
      contextBar={contextBar}
      keepTabActive={!isOnCreateSubPage && !isVisionDetail}
      activeParentPath={isOnCreateSubPage ? '/life-vision/create' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
