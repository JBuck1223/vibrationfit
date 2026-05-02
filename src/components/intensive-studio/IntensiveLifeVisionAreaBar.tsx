'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Target, PenLine, Users } from 'lucide-react'
import { AreaBar, type AreaBarVersionSelector } from '@/lib/design-system/components'
import { useLifeVisionStudio } from '@/components/life-vision-studio/LifeVisionStudioContext'

const TABS = [
  { label: 'Create', path: '/intensive/life-vision/new', icon: PenLine, matchPaths: ['/intensive/life-vision/new'] },
]

export function IntensiveLifeVisionAreaBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { visions, activeVisionId, draftId } = useLifeVisionStudio()

  const nonDraftVisions = visions.filter(v => !v.is_draft)
  const draft = visions.find(v => v.is_draft)
  const draftDisplayVersion = nonDraftVisions.length + 1

  let versionSelectors: AreaBarVersionSelector[] | undefined

  const isOnNewFlow = pathname.startsWith('/intensive/life-vision/new')

  if (isOnNewFlow) {
    const draftOption = {
      id: draft?.id ?? '__in-progress__',
      label: `Version ${draftDisplayVersion}`,
      sublabel: draft
        ? new Date(draft.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'In progress',
      badge: 'Draft',
      badgeVariant: 'draft' as const,
      isActive: false,
      icon: draft?.household_id ? Users : undefined,
      iconPosition: (draft?.household_id ? 'right' : undefined) as ('right' | undefined),
    }

    const nonDraftOptions = nonDraftVisions.map(v => ({
      id: v.id,
      label: `Version ${v.version_number}`,
      sublabel: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      badge: v.is_active ? 'Active' : undefined,
      badgeVariant: v.is_active ? ('active' as const) : undefined,
      isActive: v.is_active,
      icon: v.household_id ? Users : undefined,
      iconPosition: (v.household_id ? 'right' : undefined) as ('right' | undefined),
    }))

    versionSelectors = [{
      id: 'vision-version',
      label: 'Vision',
      position: 'contextRow',
      options: [draftOption, ...nonDraftOptions],
      selectedId: draftOption.id,
      onSelect: (id: string) => {
        if (id === draftOption.id) return
        router.push(`/life-vision/${id}`)
      },
    }]
  }

  return (
    <AreaBar
      area={{ name: 'Life Vision', icon: Target }}
      tabs={TABS}
      versionSelectors={versionSelectors}
      keepTabActive
      variant="default"
      appLikePrimaryTabs
    />
  )
}
