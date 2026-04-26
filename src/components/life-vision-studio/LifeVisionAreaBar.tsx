'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Target, PenLine, Eye, Download, HelpCircle, Users, Headphones, Plus, Edit3, Sparkles } from 'lucide-react'
import { AreaBar, type AreaBarContextNavItem, type AreaBarVersionSelector } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
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
    && pathname !== '/life-vision/active'
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
    const isStartNew = CREATE_AREA_ROUTES.some(r =>
      (r === '/life-vision/new/assembly' || r === '/life-vision/new/category')
      && (pathname === r || pathname.startsWith(r + '/'))
    )
    const isRefine = /^\/life-vision\/[^/]+\/refine/.test(pathname)
      || pathname.startsWith('/life-vision/refine')
      || pathname.startsWith('/life-vision/refinements')
    const isEdit = /^\/life-vision\/[^/]+\/draft/.test(pathname)
      || pathname.startsWith('/life-vision/manual')
    const isCreateLanding = pathname === '/life-vision/create' || pathname === '/life-vision/create/'

    const handleRefine = () => {
      if (draftId) { router.push(`/life-vision/${draftId}/refine`); return }
      if (activeVisionId) { router.push(`/life-vision/${activeVisionId}/refine`); return }
      router.push('/life-vision/refine/new')
    }

    const handleEdit = async () => {
      if (draftId) { router.push(`/life-vision/${draftId}/draft`); return }
      if (activeVisionId) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: existingDraft } = await supabase
          .from('vision_versions')
          .select('id')
          .eq('parent_id', activeVisionId)
          .eq('is_draft', true)
          .eq('user_id', user.id)
          .maybeSingle()
        if (existingDraft) { router.push(`/life-vision/${existingDraft.id}/draft`); return }
        router.push(`/life-vision/${activeVisionId}/refine`)
        return
      }
      router.push('/life-vision/manual')
    }

    contextNav = [
      { label: 'Start New', path: '/life-vision/new', icon: Plus, isActive: isStartNew },
      { label: 'Refine', icon: Sparkles, isActive: isRefine || isCreateLanding, onClick: handleRefine },
      { label: 'Edit', icon: Edit3, isActive: isEdit, onClick: handleEdit },
    ]

    if (isStartNew) {
      contextText = 'Build a new Life Vision from scratch with VIVA guiding you through each category.'
    } else if (isRefine || isCreateLanding) {
      contextText = 'Have a conversation with VIVA to elevate your vision through guided refinement.'
    } else if (isEdit) {
      contextText = 'Make direct edits to your vision categories in the draft editor.'
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
