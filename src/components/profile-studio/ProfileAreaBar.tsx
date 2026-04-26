'use client'

import { useRouter } from 'next/navigation'
import { User, PenLine, Eye, HelpCircle } from 'lucide-react'
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
  const { versions } = useProfileStudio()

  const isProfileDashboard = pathname === '/profile' || pathname === '/profile/'
  const isCreateArea = CREATE_AREA_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isActive = pathname === '/profile/active' || pathname.startsWith('/profile/active/')
  const isHowItWorks = pathname === '/profile/new' || pathname === '/profile/new/'

  // Edit/draft/refine sub-routes under a profile ID fall into the create area
  const isEditSubRoute = /^\/profile\/[^/]+\/(edit|draft|refine|new)/.test(pathname)
  const isProfileDetail = !isProfileDashboard && !isCreateArea && !isActive && !isHowItWorks
    && !isEditSubRoute && /^\/profile\/[^/]+/.test(pathname)

  let versionSelectors: AreaBarVersionSelector[] | undefined
  let contextNav: AreaBarContextNavItem[] | undefined
  let contextText: string | undefined

  const buildVersionSelectors = (selectedOverrideId?: string): AreaBarVersionSelector[] | undefined => {
    const nonDraftVersions = versions.filter(v => !v.is_draft)
    if (nonDraftVersions.length === 0) return undefined
    const selectedId = selectedOverrideId || nonDraftVersions.find(v => v.is_active)?.id || nonDraftVersions[0]?.id
    return [{
      id: 'profile-version',
      label: 'Profile',
      position: 'contextRow' as const,
      options: nonDraftVersions.map(v => ({
        id: v.id,
        label: v.version_number
          ? `Version ${v.version_number}`
          : `Version ${nonDraftVersions.length - nonDraftVersions.indexOf(v)}`,
        sublabel: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        badge: v.is_active ? 'Active' : undefined,
        isActive: v.is_active,
      })),
      selectedId: selectedId || nonDraftVersions[0].id,
      onSelect: (id: string) => router.push(`/profile/${id}`),
    }]
  }

  if (isHowItWorks) {
    contextNav = [
      { label: 'My Profile', path: '/profile', icon: User, isActive: false },
      { label: 'How It Works', path: '/profile/new', icon: HelpCircle, isActive: true },
    ]
    contextText = 'Learn how the Profile process works.'
  } else if (isProfileDetail) {
    const detailProfileId = pathname.split('/')[2]
    versionSelectors = buildVersionSelectors(detailProfileId)
  } else if (isCreateArea || isEditSubRoute) {
    // Create area: no additional context nav
  }

  const isOnCreateSubPage = (isCreateArea && pathname !== '/profile/create') || isEditSubRoute

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
