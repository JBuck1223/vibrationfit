'use client'

import { Home, LayoutGrid, Activity, Award, Flame } from 'lucide-react'
import { AreaBar } from '@/lib/design-system/components'

const TABS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid, exactPath: true },
  { label: 'Activity', path: '/tracking', icon: Activity, exactPath: true },
  { label: 'Badges', path: '/tracking/badges', icon: Award },
  { label: 'Streaks', path: '/tracking/streaks', icon: Flame },
]

/**
 * Shared chrome for the member home: the Dashboard widget grid plus the
 * Tracking tabs (Activity, Badges, Streaks) live under one AreaBar.
 */
export function DashboardAreaBar() {
  return (
    <AreaBar
      area={{ name: 'Dashboard', icon: Home }}
      tabs={TABS}
      variant="default"
      appLikePrimaryTabs
      fluidAppLikeTabs
    />
  )
}
