'use client'

import { BarChart3, Activity, Award, Flame } from 'lucide-react'
import { AreaBar } from '@/lib/design-system/components'

const TABS = [
  { label: 'Activity', path: '/tracking', icon: Activity, exactPath: true },
  { label: 'Badges', path: '/tracking/badges', icon: Award },
  { label: 'Streaks', path: '/tracking/streaks', icon: Flame },
]

export function TrackingAreaBar() {
  return (
    <AreaBar
      area={{ name: 'Tracking', icon: BarChart3 }}
      tabs={TABS}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
