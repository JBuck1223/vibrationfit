'use client'

import { BookOpen, Info } from 'lucide-react'
import { AreaBar } from '@/lib/design-system/components'

const TABS = [
  { label: 'About', path: '/intensive/journal/about', icon: Info, matchPaths: ['/intensive/journal'] },
]

export function IntensiveJournalAreaBar() {
  return (
    <AreaBar
      area={{ name: 'Journal', icon: BookOpen }}
      tabs={TABS}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
