'use client'

import Link from 'next/link'
import { useQueries } from '@tanstack/react-query'
import { BookOpen, DollarSign, Flame, Headphones, Heart, Snowflake, Sun, Users, Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { keys } from '@/lib/query/keys'
import type { AreaSlug } from '@/hooks/useAreaStats'
import type { AreaStatsResponse } from '@/app/api/area-stats/route'
import { cn } from '@/lib/utils'
import { WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'
import { isWideWidget } from '@/lib/dashboard/widgets/registry'

const AREAS: { slug: AreaSlug; label: string; icon: LucideIcon; color: string; href: string }[] = [
  { slug: 'daily-paper', label: 'Daily Paper', icon: Sun, color: '#FFFF00', href: '/daily-paper' },
  { slug: 'vision-audio', label: 'Vision Audio', icon: Headphones, color: '#39FF14', href: '/audio' },
  { slug: 'journal', label: 'Journal', icon: BookOpen, color: '#00FFFF', href: '/journal' },
  { slug: 'abundance-tracker', label: 'Abundance', icon: DollarSign, color: '#FFB701', href: '/abundance-tracker' },
  { slug: 'vibe-tribe', label: 'Vibe Tribe', icon: Heart, color: '#BF00FF', href: '/vibe-tribe' },
  { slug: 'alignment-gym', label: 'Gym', icon: Users, color: '#14B8A6', href: '/alignment-gym' },
]

export function StreaksWidget(chrome: WidgetChromeProps) {
  const results = useQueries({
    queries: AREAS.map((a) => ({
      queryKey: [...keys.areaActivations, 'stats', a.slug],
      queryFn: async () => {
        const res = await fetch(`/api/area-stats?area=${encodeURIComponent(a.slug)}`)
        if (!res.ok) return null
        return (await res.json()) as AreaStatsResponse
      },
      staleTime: 60_000,
    })),
  })

  const loading = results.some((r) => r.isLoading)
  const shown = isWideWidget(chrome.size) ? AREAS : AREAS.slice(0, 4)
  const todayCount = results.filter((r) => r.data?.todayCompleted).length

  return (
    <WidgetFrame
      {...chrome}
      title="Streaks"
      icon={Flame}
      accent="#FFB701"
      href="/tracking/streaks"
      hrefLabel="All streaks"
      loading={loading}
    >
      <p className="mb-3 text-xs text-neutral-500">
        {todayCount === 0
          ? 'Nothing checked off yet today.'
          : `${todayCount} ${todayCount === 1 ? 'practice' : 'practices'} done today.`}
      </p>
      <ul className={cn('grid gap-2', isWideWidget(chrome.size) ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2')}>
        {shown.map((area, i) => {
          const stats = results[i]?.data ?? null
          const Icon = area.icon
          const streak = stats?.currentStreak ?? 0
          const unit = stats?.streakUnit === 'weeks' ? 'wk' : 'd'
          return (
            <li key={area.slug}>
              <Link
                href={area.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors hover:bg-white/[0.04]',
                  stats?.todayCompleted ? 'border-white/15 bg-white/[0.03]' : 'border-white/[0.06]',
                )}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${area.color}1A`, color: area.color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">{area.label}</p>
                  <p className="text-[11px] tabular-nums text-neutral-400">
                    {streak > 0 ? (
                      <>
                        <span className="font-semibold text-white">{streak}</span>
                        {unit} streak
                      </>
                    ) : (
                      'Start today'
                    )}
                  </p>
                </div>
                {stats?.todayCompleted ? (
                  <Check className="h-4 w-4 shrink-0 text-primary-500" />
                ) : stats?.streakFreezeUsedThisWeek ? (
                  <Snowflake className="h-4 w-4 shrink-0 text-secondary-500" aria-label="Streak freeze used" />
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </WidgetFrame>
  )
}
