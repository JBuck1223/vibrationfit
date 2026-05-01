'use client'

import { DollarSign, Coins, BarChart3, Flag, NotebookText, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, type AreaBarContextNavItem } from '@/lib/design-system/components'

const TABS = [
  { label: 'Track', path: '/abundance-tracker', icon: Coins },
  { label: 'Insights', path: '/abundance-tracker/reports', icon: BarChart3 },
  { label: 'Goals', path: '/abundance-tracker/goals', icon: Flag },
]

const CONTEXT_TRACK_OVERVIEW = 'Your abundance at a glance.'
const CONTEXT_TRACK_NEW_ENTRY = 'Acknowledge what is flowing to you.'
const CONTEXT_INSIGHTS =
  'View abundance by period: money vs value and by category.'
const CONTEXT_GOALS_OVERVIEW =
  'See progress for any period and every goal you have saved.'
const CONTEXT_GOALS_NEW = 'Choose a period and amount, then save your goal.'

export function AbundanceAreaBar() {
  const pathname = usePathname()

  const isReports =
    pathname === '/abundance-tracker/reports' ||
    pathname.startsWith('/abundance-tracker/reports/')
  const isGoals =
    pathname === '/abundance-tracker/goals' ||
    pathname.startsWith('/abundance-tracker/goals/')

  const isTrackSection =
    pathname.startsWith('/abundance-tracker') && !isReports && !isGoals

  const onNewEntry =
    pathname === '/abundance-tracker/new' || pathname.startsWith('/abundance-tracker/new/')
  const onOverview = isTrackSection && !onNewEntry

  const onGoalsNew =
    pathname === '/abundance-tracker/goals/new' || pathname.startsWith('/abundance-tracker/goals/new/')
  const onGoalsOverview = isGoals && !onGoalsNew

  let contextNav: AreaBarContextNavItem[] | undefined
  if (isTrackSection) {
    contextNav = [
      {
        label: 'Overview',
        path: '/abundance-tracker',
        icon: NotebookText,
        isActive: onOverview,
      },
      {
        label: 'New Entry',
        path: '/abundance-tracker/new',
        icon: Plus,
        isActive: onNewEntry,
      },
    ]
  } else if (isGoals) {
    contextNav = [
      {
        label: 'Overview',
        path: '/abundance-tracker/goals',
        icon: NotebookText,
        isActive: onGoalsOverview,
      },
      {
        label: 'New',
        path: '/abundance-tracker/goals/new',
        icon: Plus,
        isActive: onGoalsNew,
      },
    ]
  }

  let contextText: string | undefined
  if (isReports) contextText = CONTEXT_INSIGHTS
  else if (isGoals) contextText = onGoalsNew ? CONTEXT_GOALS_NEW : CONTEXT_GOALS_OVERVIEW
  else if (onNewEntry) contextText = CONTEXT_TRACK_NEW_ENTRY
  else if (isTrackSection) contextText = CONTEXT_TRACK_OVERVIEW
  else contextText = CONTEXT_TRACK_OVERVIEW

  return (
    <AreaBar
      area={{ name: 'Abundance Tracker', icon: DollarSign }}
      tabs={TABS}
      contextNav={contextNav}
      contextText={contextText}
      keepTabActive
      variant="default"
      appLikePrimaryTabs
    />
  )
}
