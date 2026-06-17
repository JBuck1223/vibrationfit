'use client'

import { Gauge, Target, CalendarDays } from 'lucide-react'
import { AreaBar } from '@/lib/design-system/components'

const TABS = [
  { label: 'Hub', path: '/assessment', icon: Gauge },
  { label: 'Take', path: '/assessment/new', icon: Target },
  { label: 'History', path: '/assessment/history', icon: CalendarDays },
]

export function AssessmentAreaBar() {
  return (
    <AreaBar
      area={{ name: 'Assessment', icon: Gauge }}
      tabs={TABS}
      variant="default"
      appLikePrimaryTabs
      fluidAppLikeTabs
    />
  )
}
