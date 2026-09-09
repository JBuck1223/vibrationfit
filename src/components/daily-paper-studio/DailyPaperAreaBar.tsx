'use client'

import { FileText, Eye, PenLine, HelpCircle } from 'lucide-react'
import { AreaBar } from '@/lib/design-system/components'
import { useAreaBarWalkthrough } from '@/components/tool-walkthrough'

const TABS = [
  { label: 'View', path: '/daily-paper', icon: Eye, dataTour: 'studio-tab-daily-paper-view' },
  { label: 'Resources', path: '/daily-paper/resources', icon: HelpCircle, dataTour: 'studio-tab-daily-paper-resources' },
  { label: 'Create', path: '/daily-paper/new', icon: PenLine, dataTour: 'studio-tab-daily-paper-create' },
]

export function DailyPaperAreaBar() {
  const walkthroughMenu = useAreaBarWalkthrough()
  return (
    <AreaBar
      area={{ name: 'Daily Paper', icon: FileText }}
      tabs={TABS}
      menuItems={walkthroughMenu}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
