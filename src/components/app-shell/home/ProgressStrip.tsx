'use client'

import { GLASS_CARD } from '@/lib/app-shell/glass'
import React from 'react'
import Link from 'next/link'
import { Award, ChevronRight, Flame, Sparkles } from 'lucide-react'
import { useAreaStatsQuery } from '@/components/dashboard/widgets/queries'

/**
 * Progress highlights, not the full screens: the two streaks that matter
 * most and a door into badges. The detail lives under Account.
 */
export function ProgressStrip() {
  const { data: paper } = useAreaStatsQuery('daily-paper')
  const { data: audio } = useAreaStatsQuery('vision-audio')

  const items = [
    {
      icon: Flame,
      label: 'Daily Paper streak',
      value: paper ? `${paper.currentStreak} ${paper.streakUnit}` : '—',
      done: paper?.todayCompleted ?? false,
      href: '/tracking/streaks',
    },
    {
      icon: Sparkles,
      label: 'Vision listening',
      value: audio ? `${audio.currentStreak} ${audio.streakUnit}` : '—',
      done: audio?.todayCompleted ?? false,
      href: '/tracking/streaks',
    },
    { icon: Award, label: 'Badges', value: 'See what you’ve earned', done: false, href: '/tracking/badges' },
  ]

  return (
    <section aria-label="Progress" className="grid gap-3 sm:grid-cols-3">
      {items.map(({ icon: Icon, label, value, done, href }) => (
        <Link key={label} href={href} className={`${GLASS_CARD} flex items-center gap-3 px-4 py-3 transition-colors hover:border-[#39FF14]/60`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(57,255,20,0.16)] text-[#39FF14]">
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">{label}</span>
            <span className="block truncate text-sm font-medium text-white">
              {value}
              {done && <span className="ml-2 text-xs text-[#39FF14]">today ✓</span>}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
        </Link>
      ))}
    </section>
  )
}
