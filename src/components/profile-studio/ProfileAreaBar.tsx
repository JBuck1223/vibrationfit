'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, PenLine, Eye, Edit, GitCompare } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, type ContextOption } from '@/components/area-studio'
import { useProfileStudio } from './ProfileStudioContext'

const TABS = [
  { label: 'My Profile', path: '/profile', icon: Eye },
  { label: 'Create', path: '/profile/create', icon: PenLine },
]

const CREATE_AREA_ROUTES = ['/profile/create', '/profile/new', '/profile/compare']

function ProfileDetailSecondaryNav({ profileId }: { profileId: string }) {
  const pathname = usePathname()

  const actions = [
    { label: 'Edit Profile', path: `/profile/${profileId}/edit`, icon: Edit },
  ]

  return (
    <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-neutral-900/60 mx-auto">
      {actions.map(action => {
        const isActive = pathname === action.path || pathname.startsWith(action.path + '/')
        const ActionIcon = action.icon
        return (
          <Link
            key={action.label}
            href={action.path}
            className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              isActive
                ? 'bg-primary-500/20 text-primary-500'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <ActionIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{action.label}</span>
          </Link>
        )
      })}
    </div>
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
      keepTabActive={!isProfileDetail}
      variant="default"
    />
  )
}
