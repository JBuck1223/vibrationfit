'use client'

import { User, PenLine } from 'lucide-react'
import { AreaBar } from '@/lib/design-system/components'

const TABS = [
  { label: 'Create', path: '/intensive/profile/new', icon: PenLine, matchPaths: ['/intensive/profile'] },
]

export function IntensiveProfileAreaBar() {
  return (
    <AreaBar
      area={{ name: 'My Profile', icon: User }}
      tabs={TABS}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
