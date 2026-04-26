'use client'

import { useRouter } from 'next/navigation'
import { User, PenLine, Eye, Edit } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, type AreaBarContextNavItem, type AreaBarVersionSelector } from '@/lib/design-system/components'
import { useProfileStudio } from './ProfileStudioContext'

const TABS = [
  { label: 'My Profile', path: '/profile', icon: Eye },
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

  const isProfileDetail = !isProfileDashboard
    && !isCreateArea
    && !isActive
    && /^\/profile\/[^/]+/.test(pathname)

  let versionSelectors: AreaBarVersionSelector[] | undefined
  let contextNav: AreaBarContextNavItem[] | undefined

  const isOnCreateSubPage = isCreateArea && pathname !== '/profile/create'

  if (isProfileDetail) {
    const segments = pathname.split('/')
    const profileId = segments[2] || ''
    if (/^[a-f0-9-]{36}$/.test(profileId)) {
      const nonDrafts = versions.filter(v => !v.is_draft)

      versionSelectors = [{
        id: 'profile-version',
        label: 'Profile',
        position: 'topRight',
        options: versions.map(v => {
          const label = v.is_draft
            ? 'Draft'
            : v.version_number
              ? `Version ${v.version_number}`
              : `Version ${nonDrafts.length - nonDrafts.indexOf(v)}`
          return {
            id: v.id,
            label,
            sublabel: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            badge: v.is_active ? 'Active' : v.is_draft ? 'Draft' : undefined,
            isActive: v.is_active,
          }
        }),
        selectedId: profileId,
        onSelect: (id: string) => router.push(`/profile/${id}`),
      }]

      const editPath = `/profile/${profileId}/edit`
      contextNav = [{
        label: 'Edit Profile',
        path: editPath,
        icon: Edit,
        isActive: pathname === editPath || pathname.startsWith(editPath + '/'),
      }]
    }
  }

  return (
    <AreaBar
      area={{ name: 'My Profile', icon: User }}
      tabs={TABS}
      contextNav={contextNav}
      versionSelectors={versionSelectors}
      keepTabActive={!isProfileDetail && !isOnCreateSubPage}
      activeParentPath={isOnCreateSubPage ? '/profile/create' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
