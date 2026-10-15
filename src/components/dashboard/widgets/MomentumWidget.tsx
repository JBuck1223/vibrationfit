'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Heart, Play, Sparkles, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { keys } from '@/lib/query/keys'
import type { RetentionMetrics } from '@/lib/retention/types'
import type { MomentumResponse } from '@/app/api/dashboard/momentum/route'
import { cn } from '@/lib/utils'
import { WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'
import { isWideWidget } from '@/lib/dashboard/widgets/registry'

const LEVELS = ['bg-white/[0.04]', 'bg-primary-500/25', 'bg-primary-500/45', 'bg-primary-500/70', 'bg-primary-500']

function level(count: number) {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

const PILLARS: { key: keyof Omit<RetentionMetrics, 'calculatedAt'>; label: string; icon: LucideIcon; color: string; window: string }[] = [
  { key: 'activations', label: 'Activations', icon: Play, color: '#39FF14', window: '30d' },
  { key: 'creations', label: 'Creations', icon: Sparkles, color: '#FFFF00', window: '30d' },
  { key: 'connections', label: 'Connections', icon: Heart, color: '#BF00FF', window: '7d' },
  { key: 'sessions', label: 'Sessions', icon: Users, color: '#14B8A6', window: '4w' },
]

export function MomentumWidget(chrome: WidgetChromeProps) {
  const weeks = isWideWidget(chrome.size) ? 12 : 6
  const [hover, setHover] = useState<{ date: string; count: number } | null>(null)

  const momentum = useQuery({
    queryKey: [...keys.areaActivations, 'momentum', weeks],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/momentum?weeks=${weeks}`)
      if (!res.ok) throw new Error('Failed to load momentum')
      return (await res.json()) as MomentumResponse
    },
    staleTime: 5 * 60_000,
  })

  const retention = useQuery({
    queryKey: [...keys.areaActivations, 'retention-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/retention-metrics')
      if (!res.ok) return null
      return (await res.json()) as RetentionMetrics
    },
    staleTime: 5 * 60_000,
  })

  // Columns are weeks (oldest left), rows are weekdays Sun..Sat.
  const columns = useMemo(() => {
    const days = momentum.data?.days ?? []
    if (days.length === 0) return []
    const firstDow = new Date(days[0].date + 'T00:00:00Z').getUTCDay()
    const padded: ({ date: string; count: number } | null)[] = [...Array(firstDow).fill(null), ...days]
    const cols: ({ date: string; count: number } | null)[][] = []
    for (let i = 0; i < padded.length; i += 7) cols.push(padded.slice(i, i + 7))
    return cols
  }, [momentum.data])

  const totals = momentum.data?.totals

  return (
    <WidgetFrame
      {...chrome}
      title="Momentum"
      icon={Activity}
      accent="#39FF14"
      href="/tracking"
      hrefLabel="Tracking"
      loading={momentum.isLoading}
    >
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs text-neutral-400">
            <span className="font-semibold text-white">{totals?.activeDays ?? 0}</span> active days in the last {weeks} weeks
            {totals?.currentStreak ? (
              <>
                {' '}· <span className="font-semibold text-white">{totals.currentStreak}</span> day streak
              </>
            ) : null}
          </p>
          <p className="h-4 text-[11px] tabular-nums text-neutral-500">
            {hover
              ? `${new Date(hover.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}: ${hover.count} ${hover.count === 1 ? 'activity' : 'activities'}`
              : totals
                ? `Best run ${totals.bestStreak} days`
                : ''}
          </p>
        </div>

        <div className="flex gap-[3px] overflow-hidden" onMouseLeave={() => setHover(null)}>
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-1 flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, ri) => {
                const cell = col[ri] ?? null
                return (
                  <div
                    key={ri}
                    onMouseEnter={() => cell && setHover(cell)}
                    title={cell ? `${cell.date}: ${cell.count}` : undefined}
                    className={cn(
                      'aspect-square w-full rounded-[3px]',
                      cell ? LEVELS[level(cell.count)] : 'bg-transparent',
                    )}
                  />
                )
              })}
            </div>
          ))}
        </div>

        <div className={cn('grid gap-2', isWideWidget(chrome.size) ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2')}>
          {PILLARS.map((p) => {
            const metric = retention.data?.[p.key]
            const Icon = p.icon
            return (
              <div key={p.key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: p.color }}>
                  <Icon className="h-3 w-3" />
                  {p.label}
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">
                  {metric ? metric.recent : '–'}
                  <span className="ml-1 text-[11px] font-normal text-neutral-500">{p.window}</span>
                </p>
                <p className="text-[11px] text-neutral-500">
                  {metric ? `${metric.lifetime} all-time` : ''}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </WidgetFrame>
  )
}
