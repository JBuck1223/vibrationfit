'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Target, PenLine, Eye, Download, HelpCircle, Users, Headphones, CheckCircle, Layers, Wand2 } from 'lucide-react'
import { AreaBar, type AreaBarContextNavItem, type AreaBarVersionSelector } from '@/lib/design-system/components'
import { useLifeVisionStudio } from './LifeVisionStudioContext'

const VOICE_DISPLAY_NAMES: Record<string, string> = {
  alloy: 'Alloy', shimmer: 'Shimmer', ash: 'Ash', coral: 'Coral',
  echo: 'Echo', fable: 'Fable', onyx: 'Onyx', nova: 'Nova', sage: 'Sage',
}

const TABS = [
  { label: 'View', path: '/life-vision', icon: Eye },
  { label: 'Create', path: '/life-vision/create', icon: PenLine },
]

const CREATE_AREA_ROUTES = [
  '/life-vision/create',
  '/life-vision/new/assembly',
  '/life-vision/new/category',
  '/life-vision/manual',
  '/life-vision/refine',
  '/life-vision/refinements',
]

export function LifeVisionAreaBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { visions, activeVisionId, draftId, audioSets, selectedAudioSetId, setSelectedAudioSetId } = useLifeVisionStudio()

  const isVisionList = pathname === '/life-vision' || pathname === '/life-vision/'
  const isHowItWorks = pathname === '/life-vision/new' || pathname === '/life-vision/new/'
  const isPrintPage = /^\/life-vision\/[^/]+\/print/.test(pathname)
  const isHousehold = pathname.startsWith('/life-vision/household')
  const isCreateArea = CREATE_AREA_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
    || /^\/life-vision\/[^/]+\/refine/.test(pathname)
    || /^\/life-vision\/[^/]+\/draft/.test(pathname)

  const isVisionDetail = !isVisionList
    && !isHousehold
    && !isCreateArea
    && !isHowItWorks
    && !isPrintPage
    && pathname !== '/life-vision'
    && /^\/life-vision\/[^/]+/.test(pathname)
    && !pathname.startsWith('/life-vision/audio')

  const isViewOverview = isVisionList || isHowItWorks || isPrintPage || isVisionDetail

  let versionSelectors: AreaBarVersionSelector[] | undefined
  let contextNav: AreaBarContextNavItem[] | undefined
  let contextText: string | undefined

  if (isViewOverview) {
    const detailVisionId = isVisionDetail ? pathname.split('/')[2] : undefined
    const printVisionId = isPrintPage ? pathname.split('/')[2] : activeVisionId
    const pdfVisionId = detailVisionId || printVisionId
    const pdfPath = pdfVisionId ? `/life-vision/${pdfVisionId}/print` : undefined

    contextNav = [
      { label: 'My Visions', path: '/life-vision', icon: Target, isActive: isVisionList || isVisionDetail },
      { label: 'How It Works', path: '/life-vision/new', icon: HelpCircle, isActive: isHowItWorks },
      ...(pdfPath ? [{ label: 'Download PDF', path: pdfPath, icon: Download, isActive: isPrintPage }] : []),
    ]

    if (isPrintPage) {
      contextText = 'Preview and download a printable PDF of your Life Vision.'

      const nonDraftVisions = visions.filter(v => !v.is_draft)
      if (nonDraftVisions.length > 0) {
        versionSelectors = [{
          id: 'vision-version',
          label: 'Vision',
          position: 'contextRow',
          options: nonDraftVisions.map(v => ({
            id: v.id,
            label: `Version ${v.version_number}`,
            sublabel: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            badge: v.is_active ? 'Active' : undefined,
            isActive: v.is_active,
            icon: v.household_id ? Users : undefined,
            iconPosition: v.household_id ? 'right' as const : undefined,
          })),
          selectedId: printVisionId || nonDraftVisions[0].id,
          onSelect: (id: string) => router.push(`/life-vision/${id}/print`),
        }]
      }
    } else if (isHowItWorks) {
      contextText = 'Learn how the Life Vision process works.'
    } else {
      contextText = 'Read or listen to your Life Vision.'

      const nonDraftVisions = visions.filter(v => !v.is_draft)
      const selectedVisionId = detailVisionId || activeVisionId || nonDraftVisions[0]?.id
      if (nonDraftVisions.length > 0) {
        const visionSelector: AreaBarVersionSelector = {
          id: 'vision-version',
          label: 'Vision',
          position: 'contextRow',
          options: nonDraftVisions.map(v => ({
            id: v.id,
            label: `Version ${v.version_number}`,
            sublabel: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            badge: v.is_active ? 'Active' : undefined,
            isActive: v.is_active,
            icon: v.household_id ? Users : undefined,
            iconPosition: v.household_id ? 'right' as const : undefined,
          })),
          selectedId: selectedVisionId || nonDraftVisions[0].id,
          onSelect: (id: string) => router.push(`/life-vision/${id}`),
        }

        if (isVisionDetail && audioSets.length > 0) {
          const audioSelector: AreaBarVersionSelector = {
            id: 'audio-set',
            label: 'Audio',
            icon: Headphones,
            position: 'contextRow',
            options: [
              { id: '__newest__', label: 'Newest Per Section' },
              ...audioSets.map(s => ({
                id: s.id,
                label: s.name,
                sublabel: `${s.track_count} tracks · ${s.variant === 'personal' ? 'Personal' : VOICE_DISPLAY_NAMES[s.voice_id] || s.voice_id}`,
              })),
              { id: '__none__', label: 'No Audio' },
            ],
            selectedId: selectedAudioSetId === null ? '__newest__' : (selectedAudioSetId || '__newest__'),
            onSelect: (id: string) => {
              if (id === '__newest__') setSelectedAudioSetId(null)
              else if (id === '__none__') setSelectedAudioSetId('none')
              else setSelectedAudioSetId(id)
            },
          }
          versionSelectors = [visionSelector, audioSelector]
        } else {
          versionSelectors = [visionSelector]
        }
      }
    }
  } else if (isCreateArea) {
    const isCreateLanding = pathname === '/life-vision/create' || pathname === '/life-vision/create/'

    const isFreshFlow = CREATE_AREA_ROUTES.some(r =>
      (r === '/life-vision/new/assembly' || r === '/life-vision/new/category')
      && (pathname === r || pathname.startsWith(r + '/'))
    )
    const isRefineFlow = /^\/life-vision\/[^/]+\/refine/.test(pathname)
      || pathname.startsWith('/life-vision/refine')
      || pathname.startsWith('/life-vision/refinements')
      || /^\/life-vision\/[^/]+\/draft/.test(pathname)
      || pathname.startsWith('/life-vision/manual')

    const isOnRefineSubpage = /^\/life-vision\/[^/]+\/refine/.test(pathname)
      || pathname.startsWith('/life-vision/refine')
      || pathname.startsWith('/life-vision/refinements')
    const isOnCommitSubpage = /^\/life-vision\/[^/]+\/draft/.test(pathname)
      || pathname.startsWith('/life-vision/manual')
    const isOnCategoryPage = pathname.startsWith('/life-vision/new/category')
    const isOnAssemblyPage = pathname === '/life-vision/new/assembly' || pathname.startsWith('/life-vision/new/assembly/')

    if (isCreateLanding) {
      // No context nav on the landing — the two cards handle navigation
    } else if (isRefineFlow) {
      const handleRefineNav = () => {
        if (draftId) { router.push(`/life-vision/${draftId}/refine`); return }
        if (activeVisionId) { router.push(`/life-vision/${activeVisionId}/refine`); return }
        router.push('/life-vision/refine/new')
      }

      const handleCommitNav = () => {
        if (draftId) { router.push(`/life-vision/${draftId}/draft`); return }
        if (activeVisionId) { router.push(`/life-vision/${activeVisionId}/draft`); return }
      }

      contextNav = [
        { label: 'Update with VIVA', icon: Target, isActive: isOnRefineSubpage, onClick: handleRefineNav },
        { label: 'Review and Commit', icon: CheckCircle, isActive: isOnCommitSubpage, onClick: handleCommitNav },
      ]

      if (isOnRefineSubpage) {
        contextText = 'Update your vision with VIVA, then review your changes.'
      } else if (isOnCommitSubpage) {
        contextText = 'Review your draft changes and commit when ready.'
      }

      // Version selector — draft (current) at top, then all prior non-draft versions
      const draft = visions.find(v => v.is_draft)
      const nonDraftVisions = visions.filter(v => !v.is_draft)
      if ((isOnRefineSubpage || isOnCommitSubpage) && (draft || nonDraftVisions.length > 0)) {
        // Draft version_number in context is 0 as a marker; the draft will become
        // nonDraftVisions.length + 1 when committed, so show that as its label.
        const draftDisplayVersion = nonDraftVisions.length + 1
        const draftOption = draft
          ? [{
              id: draft.id,
              label: `Version ${draftDisplayVersion}`,
              sublabel: new Date(draft.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              badge: 'Draft',
              badgeVariant: 'draft' as const,
              isActive: false,
              icon: draft.household_id ? Users : undefined,
              iconPosition: (draft.household_id ? 'right' : undefined) as ('right' | undefined),
            }]
          : []

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
          options: [...draftOption, ...nonDraftOptions],
          selectedId: draft ? draft.id : (activeVisionId ?? nonDraftVisions[0]?.id ?? ''),
          onSelect: (id: string) => {
            if (draft && id === draft.id) {
              if (isOnCommitSubpage) router.push(`/life-vision/${id}/draft`)
              else router.push(`/life-vision/${id}/refine`)
              return
            }
            router.push(`/life-vision/${id}`)
          },
        }]
      }
    } else if (isFreshFlow) {
      contextNav = [
        { label: 'Generate', path: '/life-vision/new', icon: Wand2, isActive: isOnCategoryPage },
        { label: 'Assemble', path: '/life-vision/new/assembly', icon: Layers, isActive: isOnAssemblyPage },
      ]

      if (isOnCategoryPage) {
        contextText = 'Build each category of your new Life Vision with VIVA.'
      } else if (isOnAssemblyPage) {
        contextText = 'VIVA will weave your categories into a complete Life Vision document.'
      }
    }
  }

  const isOnCreateSubPage = isCreateArea && pathname !== '/life-vision/create'

  return (
    <AreaBar
      area={{ name: 'Life Vision', icon: Target }}
      tabs={TABS}
      contextNav={contextNav}
      contextText={contextText}
      versionSelectors={versionSelectors}
      keepTabActive={!isOnCreateSubPage}
      activeParentPath={isOnCreateSubPage ? '/life-vision/create' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
