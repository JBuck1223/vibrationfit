'use client'

import React from 'react'
import { todayInTimezone, useActiveVisionSummary, useTodayDailyPaper, useTodayOccurrences } from '@/components/dashboard/widgets/queries'
import { HomeHero, type HeroAction } from './HomeHero'
import { ConceptStrip } from './ConceptStrip'
import { ContinueListening } from './ContinueListening'
import { TodayOnMap } from './TodayOnMap'
import { ProgressStrip } from './ProgressStrip'

interface MemberHomeProps {
  firstName: string | null
  timezone: string | null
}

/**
 * The member Home: one hero with the most useful next action, the three
 * concepts the member holds (Vision, Manifestations, My World), then what to
 * listen to, what today's MAP asks, and a strip of progress highlights.
 * Composes itself from live signals; there is no widget grid to arrange.
 */
export function MemberHome({ firstName, timezone }: MemberHomeProps) {
  const today = todayInTimezone(timezone)
  const { data: occurrences = [] } = useTodayOccurrences(today)
  const { data: vision, isLoading: visionLoading } = useActiveVisionSummary()
  const { data: paper, isLoading: paperLoading } = useTodayDailyPaper(today)

  const pending = occurrences.filter((o) => o.status === 'pending')
  const action: HeroAction | null = (() => {
    if (visionLoading || paperLoading) return null
    if (!vision) return { label: 'Start My Life Vision', href: '/life-vision/start' }
    if (pending.length > 0) {
      return { label: pending.length === 1 ? 'Do today’s one thing' : `Open today’s MAP (${pending.length} left)`, href: '/map' }
    }
    if (!paper) return { label: 'Start Today’s Paper', href: '/daily-paper/new' }
    if (vision.hasAudio) return { label: 'Play My Vision', href: '/audio' }
    return { label: 'Read My Vision', href: `/life-vision/${vision.id}` }
  })()

  return (
    <div className="space-y-6 md:space-y-8">
      <HomeHero firstName={firstName} action={action} />
      <ConceptStrip vision={vision ?? null} />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] md:gap-8">
        <ContinueListening />
        <TodayOnMap occurrences={occurrences} date={today} />
      </div>
      <ProgressStrip />
    </div>
  )
}
