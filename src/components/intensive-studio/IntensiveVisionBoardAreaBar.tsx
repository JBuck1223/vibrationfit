'use client'

import { ImageIcon, Info } from 'lucide-react'
import { AreaBar } from '@/lib/design-system/components'

const TABS = [
  { label: 'About', path: '/intensive/vision-board/about', icon: Info, matchPaths: ['/intensive/vision-board'] },
]

export function IntensiveVisionBoardAreaBar() {
  return (
    <AreaBar
      area={{ name: 'Vision Board', icon: ImageIcon }}
      tabs={TABS}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
