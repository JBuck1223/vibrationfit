'use client'

import { Headphones, AudioLines, Mic, Sliders } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, type AreaBarContextNavItem } from '@/lib/design-system/components'

const TABS = [
  { label: 'Create', path: '/intensive/audio/create', icon: Headphones, matchPaths: ['/intensive/audio'] },
]

const SECONDARY_TABS = [
  { label: 'Generate', path: '/intensive/audio/generate', icon: AudioLines },
  { label: 'Record', path: '/intensive/audio/record', icon: Mic },
  { label: 'Mix', path: '/intensive/audio/mix', icon: Sliders },
]

export function IntensiveAudioAreaBar() {
  const pathname = usePathname()

  const isOnSecondaryPage = SECONDARY_TABS.some(
    t => pathname === t.path || pathname.startsWith(t.path + '/')
  )

  let contextNav: AreaBarContextNavItem[] | undefined

  if (isOnSecondaryPage) {
    contextNav = SECONDARY_TABS.map(tab => ({
      label: tab.label,
      path: tab.path,
      icon: tab.icon,
      isActive: pathname === tab.path || pathname.startsWith(tab.path + '/'),
    }))
  }

  return (
    <AreaBar
      area={{ name: 'Audio Studio', icon: Headphones }}
      tabs={TABS}
      contextNav={contextNav}
      keepTabActive={!isOnSecondaryPage}
      activeParentPath={isOnSecondaryPage ? '/intensive/audio/create' : undefined}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
