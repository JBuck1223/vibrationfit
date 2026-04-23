'use client'

import Link from 'next/link'
import { Image, PenLine, Plus, Sparkles, Clock } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar } from '@/components/area-studio'

const TABS = [
  { label: 'My Board', path: '/vision-board', icon: Image },
  { label: 'Create', path: '/vision-board/create', icon: PenLine },
]

const CREATE_AREA_ROUTES = ['/vision-board/create', '/vision-board/new', '/vision-board/ideas', '/vision-board/queue']

const SECONDARY_TABS = [
  { label: 'Add New', path: '/vision-board/new', icon: Plus },
  { label: 'VIVA Ideas', path: '/vision-board/ideas', icon: Sparkles },
  { label: 'Queue', path: '/vision-board/queue', icon: Clock },
]

function CreateSecondaryNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-neutral-900/60 mx-auto">
      {SECONDARY_TABS.map(tab => {
        const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/')
        const TabIcon = tab.icon
        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              isActive
                ? 'bg-primary-500/20 text-primary-500'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <TabIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function VisionBoardAreaBar() {
  const pathname = usePathname()

  const isCreateArea = CREATE_AREA_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isOnSecondaryPage = SECONDARY_TABS.some(t => pathname === t.path || pathname.startsWith(t.path + '/'))

  let contextBar: React.ReactNode = undefined
  if (isCreateArea) {
    contextBar = <CreateSecondaryNav />
  }

  return (
    <AreaBar
      area={{ name: 'Vision Board', icon: Image }}
      tabs={TABS}
      contextBar={contextBar}
      keepTabActive={!isOnSecondaryPage}
      activeParentPath={isOnSecondaryPage ? '/vision-board/create' : undefined}
      variant="default"
    />
  )
}
