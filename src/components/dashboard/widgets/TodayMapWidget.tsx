'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, Compass, Sparkles } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { keys } from '@/lib/query/keys'
import { PILLAR_META, PILLAR_ORDER } from '@/lib/map/map-pillar-config'
import { getActivityDefinition, getMapActivityDeepLink } from '@/lib/map/activities'
import type { CommitmentOccurrence, OccurrenceStatus } from '@/lib/map/types'
import { MapVerifyButtons } from '@/components/map-studio/MapVerifyButtons'
import { cn } from '@/lib/utils'
import { useDashboard } from '../DashboardContext'
import { WidgetEmpty, WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'
import { todayInTimezone, todayOccurrencesKey, useHasActiveMap, useTodayOccurrences } from './queries'

function ProgressRing({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#2A2A2A" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="#39FF14"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-white">
        {value}/{total}
      </span>
    </div>
  )
}

export function TodayMapWidget(chrome: WidgetChromeProps) {
  const { server } = useDashboard()
  const queryClient = useQueryClient()
  const today = todayInTimezone(server.userTimezone)
  const { data: hasMap, isLoading: mapLoading } = useHasActiveMap()
  const { data: occurrences = [], isLoading } = useTodayOccurrences(today)

  const grouped = useMemo(() => {
    const byPillar = new Map<string, CommitmentOccurrence[]>()
    for (const occ of occurrences) {
      const pillar = (occ.commitment?.category as string | undefined) ?? 'activations'
      const list = byPillar.get(pillar) ?? []
      list.push(occ)
      byPillar.set(pillar, list)
    }
    return PILLAR_ORDER.filter((p) => byPillar.has(p)).map((p) => ({ pillar: p, items: byPillar.get(p)! }))
  }, [occurrences])

  const done = occurrences.filter((o) => o.status === 'yes').length
  const total = occurrences.length
  const allDone = total > 0 && done === total

  const verify = async (occ: CommitmentOccurrence, status: 'yes' | 'no' | 'skipped') => {
    const next: OccurrenceStatus = occ.status === status ? 'pending' : status
    const key = todayOccurrencesKey(today)
    const previous = queryClient.getQueryData<CommitmentOccurrence[]>(key)
    queryClient.setQueryData<CommitmentOccurrence[]>(key, (old = []) =>
      old.map((o) => (o.id === occ.id ? { ...o, status: next } : o)),
    )
    const res = await fetch('/api/map/occurrences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: occ.id, status: next }),
    })
    if (!res.ok && previous) queryClient.setQueryData(key, previous)
    queryClient.invalidateQueries({ queryKey: keys.commitmentOccurrences })
    queryClient.invalidateQueries({ queryKey: keys.areaActivations })
  }

  return (
    <WidgetFrame
      {...chrome}
      title="Today's MAP"
      icon={Compass}
      accent="#39FF14"
      href="/map"
      hrefLabel="Open MAP"
      loading={isLoading || mapLoading}
    >
      {!hasMap && total === 0 ? (
        <WidgetEmpty
          title="Activate your MAP"
          body="Your Alignment Plan turns the vision into a weekly rhythm. Set it up once and verify from here each day."
          action={
            <Button variant="primary" size="sm" asChild>
              <Link href="/map/update">
                Create my MAP
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      ) : total === 0 ? (
        <WidgetEmpty
          title="Nothing scheduled today"
          body="A rest day on the plan. Press play on an audio or open the journal if you feel like it."
        />
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-4">
            <ProgressRing value={done} total={total} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">
                {allDone
                  ? 'Every commitment verified. That is alignment.'
                  : done === 0
                    ? 'Fresh day. One at a time.'
                    : `${done} done. Keep the thread going.`}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Tap Yes when you did it. Tap again to undo.
              </p>
            </div>
            {allDone ? <Sparkles className="ml-auto h-5 w-5 shrink-0 text-primary-500" /> : null}
          </div>

          <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.06]">
            {grouped.flatMap(({ pillar, items }) =>
              items.map((occ) => {
                const commitment = occ.commitment
                const def = commitment?.activity_type ? getActivityDefinition(commitment.activity_type) : undefined
                const Icon = def?.icon ?? Check
                const meta = PILLAR_META[pillar]
                const deepLink = commitment?.activity_type
                  ? getMapActivityDeepLink(commitment.activity_type, { completed: occ.status === 'yes' })
                  : '/map'
                return (
                  <li
                    key={occ.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5',
                      occ.status === 'yes' && 'bg-primary-500/[0.04]',
                    )}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${meta?.color ?? '#39FF14'}1A`, color: meta?.color ?? '#39FF14' }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <Link href={deepLink} className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-sm',
                          occ.status === 'yes' ? 'text-neutral-400 line-through decoration-neutral-600' : 'text-white',
                        )}
                      >
                        {commitment?.title ?? 'Commitment'}
                      </p>
                      <p className="text-[10px] font-medium text-white/50">{meta?.label ?? pillar}</p>
                    </Link>
                    <MapVerifyButtons status={occ.status} onVerify={(s) => verify(occ, s)} compact />
                  </li>
                )
              }),
            )}
          </ul>
        </div>
      )}
    </WidgetFrame>
  )
}
