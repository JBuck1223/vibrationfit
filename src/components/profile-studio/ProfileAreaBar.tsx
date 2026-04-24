'use client'

import { useRouter } from 'next/navigation'
import { User, PenLine, Eye, Edit } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, AreaBarSecondaryTabStrip, type ContextOption } from '@/lib/design-system/components'
import { useProfileStudio } from './ProfileStudioContext'

const TABS = [
  { label: 'My Profile', path: '/profile', icon: Eye },
  { label: 'Create', path: '/profile/create', icon: PenLine },
]

const CREATE_AREA_ROUTES = ['/profile/create', '/profile/new', '/profile/compare']

function ProfileDetailSecondaryNav({ profileId }: { profileId: string }) {
  const pathname = usePathname()
  const path = `/profile/${profileId}/edit`
  const isActive = pathname === path || pathname.startsWith(path + '/')
  return (
    <AreaBarSecondaryTabStrip
      aria-label="Profile actions"
      items={[
        { key: 'edit', href: path, label: 'Edit Profile', icon: Edit, isActive },
      ]}
    />
  )
}

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

  let contextSelector: { label: string; options: ContextOption[]; selectedId: string; onSelect: (id: string) => void } | undefined
  let contextBar: React.ReactNode = undefined

  const isOnCreateSubPage = isCreateArea && pathname !== '/profile/create'

  if (isProfileDetail) {
    const segments = pathname.split('/')
    const profileId = segments[2] || ''
    if (/^[a-f0-9-]{36}$/.test(profileId)) {
      const nonDrafts = versions.filter(v => !v.is_draft)

      contextSelector = {
        label: 'Profile',
        options: versions.map((v, i) => {
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
      }

      contextBar = <ProfileDetailSecondaryNav profileId={profileId} />
    }
  }

  return (
    <AreaBar
      area={{ name: 'My Profile', icon: User }}
      tabs={TABS}
      contextSelector={contextSelector}
      contextBar={contextBar}
      keepTabActive={!isProfileDetail && !isOnCreateSubPage}
      activeParentPath={isOnCreateSubPage ? '/profile/create' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
