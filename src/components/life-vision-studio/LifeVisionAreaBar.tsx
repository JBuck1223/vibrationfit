'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Target, PenLine, Eye, Download, Users, Headphones, Sparkles, CheckCircle, Info, Copy } from 'lucide-react'
import { AreaBar, type AreaBarContextNavItem, type AreaBarVersionSelector } from '@/lib/design-system/components'
import { useLifeVisionStudio } from './LifeVisionStudioContext'

const VOICE_DISPLAY_NAMES: Record<string, string> = {
  alloy: 'Alloy', shimmer: 'Shimmer', ash: 'Ash', coral: 'Coral',
  echo: 'Echo', fable: 'Fable', onyx: 'Onyx', nova: 'Nova', sage: 'Sage',
}

const TABS = [
  { label: 'View', path: '/life-vision', icon: Eye },
  { label: 'About', path: '/life-vision/about', icon: Info },
  { label: 'Update', path: '/life-vision/new/fun', icon: PenLine },
]

const CREATE_AREA_ROUTES = [
  '/life-vision/create',
  '/life-vision/new',
  '/life-vision/refine',
]

export function LifeVisionAreaBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { visions, activeVisionId, draftId, audioSets, selectedAudioSetId, setSelectedAudioSetId, studioAreaChrome, hasHousehold, refreshVisions } = useLifeVisionStudio()

  const isVisionList = pathname === '/life-vision' || pathname === '/life-vision/'
  const isAboutPage = pathname === '/life-vision/about' || pathname === '/life-vision/about/'
  const isPrintPage = /^\/life-vision\/[^/]+\/print/.test(pathname)
  const isHousehold = pathname.startsWith('/life-vision/household')
  const isCreateArea = CREATE_AREA_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
    || /^\/life-vision\/[^/]+\/refine/.test(pathname)
    || /^\/life-vision\/[^/]+\/draft/.test(pathname)

  const isVisionDetail = !isVisionList
    && !isHousehold
    && !isCreateArea
    && !isAboutPage
    && !isPrintPage
    && pathname !== '/life-vision'
    && /^\/life-vision\/[^/]+/.test(pathname)
    && !pathname.startsWith('/life-vision/audio')

  const isViewOverview = isVisionList || isPrintPage || isVisionDetail

  let versionSelectors: AreaBarVersionSelector[] | undefined
  let contextNav: AreaBarContextNavItem[] | undefined
  let subNav: AreaBarContextNavItem[] | undefined
  let contextText: string | undefined

  // Two-document model: the user's personal visions ("Life I Choose"),
  // joint household visions ("Life We Choose"), and personal visions other
  // household members share ("Shared With Me"). Groups only render as
  // headers when more than one group exists.
  const myPersonal = visions.filter(v => v.is_mine && !v.is_household)
  const householdVisions = visions.filter(v => v.is_household)
  const sharedPersonal = visions.filter(v => !v.is_mine && !v.is_household && !v.is_draft)
  const hasVisionGroups = householdVisions.length > 0 || sharedPersonal.length > 0

  const dateSublabel = (v: { created_at: string }) =>
    new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const toVisionOption = (v: (typeof visions)[number], group?: string) => ({
    id: v.id,
    label: v.is_draft ? 'Draft' : `Version ${v.version_number}`,
    sublabel: dateSublabel(v),
    badge: v.is_draft ? 'Draft' : (v.is_active ? 'Active' : undefined),
    badgeVariant: v.is_draft ? ('draft' as const) : undefined,
    isActive: !v.is_draft && v.is_active,
    icon: v.is_household ? Users : undefined,
    iconPosition: v.is_household ? ('right' as const) : undefined,
    group,
  })

  // Show the Household context item for household members even before any
  // household vision exists (that's exactly who needs the convert/merge tools).
  const showHouseholdNav = hasHousehold || householdVisions.length > 0

  // Household "Update with VIVA": open the household draft if one exists,
  // otherwise create one from the given (or active) household vision first —
  // the same draft -> refine -> commit pipeline as the personal document.
  const handleHouseholdUpdateNav = async (sourceVisionId?: string) => {
    const householdDraft = householdVisions.find(v => v.is_draft)
    if (householdDraft) {
      router.push(`/life-vision/${householdDraft.id}/refine`)
      return
    }
    const sourceId = sourceVisionId
      ?? householdVisions.find(v => v.is_active && !v.is_draft)?.id
      ?? householdVisions.find(v => !v.is_draft)?.id
    if (!sourceId) return
    try {
      const res = await fetch('/api/vision/draft/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visionId: sourceId }),
      })
      if (!res.ok) throw new Error('Failed to create household draft')
      const { draft } = await res.json()
      refreshVisions()
      router.push(`/life-vision/${draft.id}/refine`)
    } catch (err) {
      console.error('Error starting household update:', err)
    }
  }

  const householdToolsSubNav = (sourceVisionId?: string): AreaBarContextNavItem[] => [
    ...(householdVisions.some(v => !v.is_draft) || sourceVisionId
      ? [{ label: 'Update with VIVA', icon: PenLine, isActive: false, onClick: () => { void handleHouseholdUpdateNav(sourceVisionId) } }]
      : []),
    { label: 'Convert Personal Vision', icon: Sparkles, isActive: false, onClick: () => router.push('/life-vision/household?tool=convert') },
    { label: 'Merge Two Visions', icon: Copy, isActive: false, onClick: () => router.push('/life-vision/household?tool=merge') },
  ]

  if (isViewOverview) {
    const detailVisionId = isVisionDetail ? pathname.split('/')[2] : undefined
    const printVisionId = isPrintPage ? pathname.split('/')[2] : activeVisionId
    const pdfVisionId = detailVisionId || printVisionId
    const pdfPath = pdfVisionId ? `/life-vision/${pdfVisionId}/print` : undefined

    // When viewing a household ("Life We Choose") vision detail, highlight
    // Household instead of My Visions.
    const viewingHouseholdVision =
      !!(detailVisionId && householdVisions.some(v => v.id === detailVisionId))

    contextNav = [
      { label: 'My Visions', path: '/life-vision', icon: Target, isActive: isVisionList || (isVisionDetail && !viewingHouseholdVision) },
      ...(showHouseholdNav ? [{ label: 'Household', path: '/life-vision/household', icon: Users, isActive: viewingHouseholdVision }] : []),
      ...(pdfPath ? [{ label: 'Download PDF', path: pdfPath, icon: Download, isActive: isPrintPage }] : []),
    ]

    // Household vision detail is where "Household" lands (the hub redirects
    // here), so surface the household tools submenu on it too.
    if (viewingHouseholdVision) {
      subNav = householdToolsSubNav(detailVisionId)
    }

    const draftVisions = visions.filter(v => v.is_draft && (v.is_mine || v.is_household))
    const isViewingDraftDetail =
      !!(isVisionDetail && detailVisionId && draftVisions.some(v => v.id === detailVisionId))

    if (isPrintPage) {
      contextText = 'Preview and download a printable PDF of your Life Vision.'

      const printOptions = [
        ...myPersonal.filter(v => !v.is_draft).map(v => toVisionOption(v, hasVisionGroups ? 'Life I Choose' : undefined)),
        ...householdVisions.filter(v => !v.is_draft).map(v => toVisionOption(v, 'Life We Choose')),
        ...sharedPersonal.map(v => toVisionOption(v, 'Shared With Me')),
      ]

      if (printOptions.length > 0) {
        versionSelectors = [{
          id: 'vision-version',
          label: 'Vision',
          position: 'contextRow',
          options: printOptions,
          selectedId: printVisionId || printOptions[0].id,
          onSelect: (id: string) => router.push(`/life-vision/${id}/print`),
        }]
      }
    } else {
      if (isViewingDraftDetail && detailVisionId) {
        contextNav = [
          { label: 'Update with VIVA', icon: Sparkles, isActive: false, onClick: () => router.push(`/life-vision/${detailVisionId}/refine`) },
          { label: 'Review and Commit', icon: CheckCircle, isActive: true, onClick: () => router.push(`/life-vision/${detailVisionId}`) },
        ]
        contextText = 'Review your draft changes and commit when ready.'
      } else {
        contextText = 'Read or listen to your Life Vision.'
      }

      const myGroup = hasVisionGroups ? 'Life I Choose' : undefined
      const visionOptions = [
        ...myPersonal.filter(v => v.is_draft).map(v => toVisionOption(v, myGroup)),
        ...myPersonal.filter(v => !v.is_draft).map(v => toVisionOption(v, myGroup)),
        ...householdVisions.filter(v => v.is_draft).map(v => toVisionOption(v, 'Life We Choose')),
        ...householdVisions.filter(v => !v.is_draft).map(v => toVisionOption(v, 'Life We Choose')),
        ...sharedPersonal.map(v => toVisionOption(v, 'Shared With Me')),
      ]
      const nonDraftVisions = [...myPersonal, ...householdVisions, ...sharedPersonal].filter(v => !v.is_draft)

      let selectedVisionId = detailVisionId
      if (!selectedVisionId || !visionOptions.some(o => o.id === selectedVisionId)) {
        selectedVisionId = activeVisionId || nonDraftVisions[0]?.id || draftVisions[0]?.id
      }
      if (!selectedVisionId || !visionOptions.some(o => o.id === selectedVisionId)) {
        selectedVisionId = visionOptions[0]?.id
      }

      if (visionOptions.length > 0 && selectedVisionId) {
        const visionSelector: AreaBarVersionSelector = {
          id: 'vision-version',
          label: 'Vision',
          position: 'contextRow',
          options: visionOptions,
          selectedId: selectedVisionId,
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
  } else if (isHousehold) {
    // Same three-item row as the view pages. Download PDF targets the active
    // household vision (else newest, else the user's personal active vision).
    const householdPdfVisionId =
      householdVisions.find(v => v.is_active && !v.is_draft)?.id
      || householdVisions.find(v => !v.is_draft)?.id
      || activeVisionId

    contextNav = [
      { label: 'My Visions', path: '/life-vision', icon: Target, isActive: false },
      { label: 'Household', path: '/life-vision/household', icon: Users, isActive: true },
      ...(householdPdfVisionId ? [{ label: 'Download PDF', path: `/life-vision/${householdPdfVisionId}/print`, icon: Download, isActive: false }] : []),
    ]
    subNav = householdToolsSubNav()
    contextText = 'Create and manage shared "Life We Choose" visions for your household.'

    const householdOptions = [
      ...householdVisions.filter(v => v.is_draft).map(v => toVisionOption(v)),
      ...householdVisions.filter(v => !v.is_draft).map(v => toVisionOption(v)),
    ]

    if (householdOptions.length > 0) {
      const activeOption = householdOptions.find(o => o.isActive)
      versionSelectors = [{
        id: 'vision-version',
        label: 'Vision',
        position: 'contextRow',
        options: householdOptions,
        selectedId: activeOption?.id || householdOptions[0].id,
        onSelect: (id: string) => {
          const selected = householdVisions.find(v => v.id === id)
          if (selected?.is_draft) router.push(`/life-vision/${id}/draft`)
          else router.push(`/life-vision/${id}`)
        },
      }]
    }
  } else if (isCreateArea) {
    const isCreateLanding = pathname === '/life-vision/create' || pathname === '/life-vision/create/'

    const isFreshFlow = pathname === '/life-vision/new' || pathname === '/life-vision/new/'
      || pathname.startsWith('/life-vision/new/')
    const isRefineFlow = /^\/life-vision\/[^/]+\/refine/.test(pathname)
      || pathname.startsWith('/life-vision/refine')
    || /^\/life-vision\/[^/]+\/draft/.test(pathname)

    const isOnRefineSubpage = /^\/life-vision\/[^/]+\/refine/.test(pathname)
      || pathname.startsWith('/life-vision/refine')
    const isOnCommitSubpage = /^\/life-vision\/[^/]+\/draft/.test(pathname)
    const isOnAssemblyPage = pathname === '/life-vision/new/assembly' || pathname.startsWith('/life-vision/new/assembly/')
    const isOnCategoryPage = isFreshFlow && !isOnAssemblyPage

    if (isCreateLanding) {
      // No context nav on the landing — the two cards handle navigation
    } else if (isRefineFlow) {
      // When the route carries a vision id (/life-vision/{id}/draft|refine),
      // operate on that document — it may be a household draft, which the
      // context's personal-only draftId doesn't cover.
      const routeVisionId = /^\/life-vision\/[^/]+\/(draft|refine)/.test(pathname)
        ? pathname.split('/')[2]
        : undefined
      const routeDraft = routeVisionId
        ? visions.find(v => v.id === routeVisionId && v.is_draft)
        : undefined

      const handleRefineNav = () => {
        if (routeDraft) { router.push(`/life-vision/${routeDraft.id}/refine`); return }
        if (draftId) { router.push(`/life-vision/${draftId}/refine`); return }
        if (activeVisionId) { router.push(`/life-vision/${activeVisionId}/refine`); return }
        router.push('/life-vision/create')
      }

      const handleCommitNav = () => {
        if (routeDraft) { router.push(`/life-vision/${routeDraft.id}/draft`); return }
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

      // Version selector — draft (current) at top, then all prior non-draft
      // versions from the same document group. Refining a household draft
      // shows household ("Life We Choose") versions; otherwise personal ones.
      const docGroup = routeDraft?.is_household ? householdVisions : myPersonal
      const draft = routeDraft ?? docGroup.find(v => v.is_draft)
      const nonDraftVisions = docGroup.filter(v => !v.is_draft)
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
      const draft = myPersonal.find(v => v.is_draft)
      const nonDraftVisions = myPersonal.filter(v => !v.is_draft)
      const draftDisplayVersion = nonDraftVisions.length + 1

      contextNav = [
        ...(draft ? [{ label: 'Review Draft', path: `/life-vision/${draft.id}`, icon: Eye }] : []),
      ]

      if (isOnCategoryPage && !draft) {
        contextText = 'Create each category of your new Life Vision with VIVA.'
      }

      const draftOption = draft
        ? {
            id: draft.id,
            label: `Version ${draftDisplayVersion}`,
            sublabel: new Date(draft.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            badge: 'Draft',
            badgeVariant: 'draft' as const,
            isActive: false,
            icon: draft.household_id ? Users : undefined,
            iconPosition: (draft.household_id ? 'right' : undefined) as ('right' | undefined),
          }
        : {
            id: '__in-progress__',
            label: `Version ${draftDisplayVersion}`,
            sublabel: 'In progress',
            badge: 'Draft',
            badgeVariant: 'draft' as const,
            isActive: false,
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
  }

  const isOnCreateSubPage = isCreateArea && pathname !== '/life-vision/new/fun'

  const mergedContextEyebrow = studioAreaChrome?.contextEyebrow
  const mergedContextText = studioAreaChrome?.contextText ?? contextText

  return (
    <AreaBar
      area={{ name: 'Life Vision', icon: Target }}
      tabs={TABS}
      contextNav={contextNav}
      subNav={subNav}
      contextEyebrow={mergedContextEyebrow}
      contextText={mergedContextText}
      versionSelectors={versionSelectors}
      keepTabActive={!isOnCreateSubPage}
      activeParentPath={isOnCreateSubPage ? '/life-vision/new/fun' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
