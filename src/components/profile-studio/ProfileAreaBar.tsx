'use client'

import { useRouter } from 'next/navigation'
import { User, PenLine, Eye, HelpCircle, Sparkles, CheckCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, type AreaBarContextNavItem, type AreaBarVersionSelector } from '@/lib/design-system/components'
import { useProfileStudio } from './ProfileStudioContext'

const TABS = [
  { label: 'View', path: '/profile', icon: Eye },
  { label: 'Create', path: '/profile/create', icon: PenLine },
]

const CREATE_AREA_ROUTES = ['/profile/create', '/profile/new', '/profile/compare']

export function ProfileAreaBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { versions, draftId } = useProfileStudio()

  const isProfileDashboard = pathname === '/profile' || pathname === '/profile/'
  const isCreateArea = CREATE_AREA_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isHowItWorks = pathname === '/profile/new' || pathname === '/profile/new/'

  const isEditSubRoute = /^\/profile\/[^/]+\/edit/.test(pathname)
  const isDraftSubRoute = /^\/profile\/[^/]+\/draft/.test(pathname)

  const isProfileDetail = !isProfileDashboard && !isCreateArea && !isHowItWorks
    && !isEditSubRoute && !isDraftSubRoute && /^\/profile\/[^/]+/.test(pathname)

  const detailProfileId = (isProfileDetail || isEditSubRoute || isDraftSubRoute)
    ? pathname.split('/')[2]
    : undefined

  const isViewingDraft = isProfileDetail && detailProfileId
    && versions.some(v => v.id === detailProfileId && v.is_draft)

  let versionSelectors: AreaBarVersionSelector[] | undefined
  let contextNav: AreaBarContextNavItem[] | undefined
  let contextText: string | undefined

  const buildVersionSelectors = (
    selectedOverrideId?: string,
    opts?: { includeDrafts?: boolean; onSelectOverride?: (id: string) => void }
  ): AreaBarVersionSelector[] | undefined => {
    const includeDrafts = opts?.includeDrafts ?? false
    const filtered = includeDrafts ? versions : versions.filter(v => !v.is_draft)
    if (filtered.length === 0) return undefined

    const nonDraftVersions = versions.filter(v => !v.is_draft)
    const selectedId = selectedOverrideId || nonDraftVersions.find(v => v.is_active)?.id || filtered[0]?.id

    return [{
      id: 'profile-version',
      label: 'Profile',
      position: 'contextRow' as const,
      options: filtered.map(v => {
        if (v.is_draft) {
          return {
            id: v.id,
            label: 'Draft',
            sublabel: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            badge: 'Draft',
            badgeVariant: 'draft' as const,
          }
        }
        return {
          id: v.id,
          label: v.version_number
            ? `Version ${v.version_number}`
            : `Version ${nonDraftVersions.length - nonDraftVersions.indexOf(v)}`,
          sublabel: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          badge: v.is_active ? 'Active' : undefined,
          isActive: v.is_active,
        }
      }),
      selectedId: selectedId || filtered[0].id,
      onSelect: opts?.onSelectOverride ?? ((id: string) => router.push(`/profile/${id}`)),
    }]
  }

  if (isHowItWorks) {
    contextNav = [
      { label: 'My Profile', path: '/profile', icon: User, isActive: false },
      { label: 'How It Works', path: '/profile/new', icon: HelpCircle, isActive: true },
    ]
    contextText = 'Learn how the Profile process works.'
  } else if (isProfileDetail && !isViewingDraft) {
    versionSelectors = buildVersionSelectors(detailProfileId, { includeDrafts: true })
  } else if (isViewingDraft && detailProfileId) {
    const handleRefineNav = () => {
      router.push(`/profile/${detailProfileId}/edit`)
    }
    const handleCommitNav = () => {
      router.push(`/profile/${detailProfileId}`)
    }

    contextNav = [
      { label: 'Refine and Edit', icon: Sparkles, isActive: false, onClick: handleRefineNav },
      { label: 'Review and Commit', icon: CheckCircle, isActive: true, onClick: handleCommitNav },
    ]
    contextText = 'Review your draft changes and commit when ready.'
    versionSelectors = buildVersionSelectors(detailProfileId, { includeDrafts: true })
  } else if (isEditSubRoute && detailProfileId) {
    const handleRefineNav = () => {
      router.push(`/profile/${detailProfileId}/edit`)
    }
    const handleCommitNav = () => {
      router.push(`/profile/${detailProfileId}`)
    }

    contextNav = [
      { label: 'Refine and Edit', icon: Sparkles, isActive: true, onClick: handleRefineNav },
      { label: 'Review and Commit', icon: CheckCircle, isActive: false, onClick: handleCommitNav },
    ]
    contextText = 'Edit your draft profile, then review your changes.'
  } else if (isDraftSubRoute && detailProfileId) {
    const handleRefineNav = () => {
      router.push(`/profile/${detailProfileId}/edit`)
    }
    const handleCommitNav = () => {
      router.push(`/profile/${detailProfileId}/draft`)
    }

    contextNav = [
      { label: 'Refine and Edit', icon: Sparkles, isActive: false, onClick: handleRefineNav },
      { label: 'Review and Commit', icon: CheckCircle, isActive: true, onClick: handleCommitNav },
    ]
    contextText = 'Review your draft changes and commit when ready.'
  } else if (isCreateArea) {
    // Create landing: no context nav
  }

  const isOnCreateSubPage = (isCreateArea && pathname !== '/profile/create')
    || isEditSubRoute || isDraftSubRoute || isViewingDraft

  return (
    <AreaBar
      area={{ name: 'My Profile', icon: User }}
      tabs={TABS}
      contextNav={contextNav}
      contextText={contextText}
      versionSelectors={versionSelectors}
      keepTabActive={!isOnCreateSubPage}
      activeParentPath={isOnCreateSubPage ? '/profile/create' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
