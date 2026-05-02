'use client'

import { FileText, Eye, PenLine, HelpCircle } from 'lucide-react'
import { AreaBar } from '@/lib/design-system/components'

const TABS = [
  { label: 'View', path: '/daily-paper', icon: Eye },
  { label: 'Resources', path: '/daily-paper/resources', icon: HelpCircle },
  { label: 'Create', path: '/daily-paper/new', icon: PenLine },
]

export function DailyPaperAreaBar() {
  return (
    <AreaBar
      area={{ name: 'Daily Paper', icon: FileText }}
      tabs={TABS}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
