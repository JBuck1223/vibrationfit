'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ChevronDown, ChevronRight, Map as MapIcon } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { keys } from '@/lib/query/keys'
import type { CommitmentOccurrence } from '@/lib/map/types'
import { getActivityDefinition, getMapActivityDeepLink } from '@/lib/map/activities'
import { PILLAR_META } from '@/lib/map/map-pillar-config'
import { GLASS_CARD } from '@/lib/app-shell/glass'
import { useHasActiveMap } from '@/components/dashboard/widgets/queries'

interface TodayOnMapProps {
  occurrences: CommitmentOccurrence[]
  date: string
}

const PENDING_LIMIT = 5

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="#39FF14"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-white">
        {done}/{total}
      </span>
    </div>
  )
}

function Row({
  occ,
  onToggle,
  busy,
}: {
  occ: CommitmentOccurrence
  onToggle: () => void
  busy: boolean
}) {
  const isDone = occ.status === 'yes'
  const activity = occ.commitment?.activity_type ? getActivityDefinition(occ.commitment.activity_type) : undefined
  const Icon = activity?.icon ?? MapIcon
  const pillar = PILLAR_META[activity?.category ?? String(occ.commitment?.category ?? '')]
  const color = pillar?.color ?? '#39FF14'
  const href = occ.commitment?.activity_type
    ? getMapActivityDeepLink(occ.commitment.activity_type, { completed: isDone })
    : '/map'

  return (
    <li className="flex items-center gap-3">
      <Link
        href={href}
        className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-white/[0.05]"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: `${color}22`, color }}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate text-[15px] font-medium', isDone ? 'text-white/45 line-through' : 'text-white')}>
            {occ.commitment?.title ?? 'Commitment'}
          </span>
          {pillar && <span className="block text-xs text-white/50">{pillar.label}</span>}
        </span>
        {!isDone && <ChevronRight className="h-4 w-4 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5" />}
      </Link>
      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        aria-pressed={isDone}
        aria-label={isDone ? `Mark ${occ.commitment?.title ?? 'this'} not done` : `Mark ${occ.commitment?.title ?? 'this'} done`}
        className={cn(
          'mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          isDone ? 'border-[#39FF14] bg-[#39FF14] text-black' : 'border-white/25 text-transparent hover:border-[#39FF14] hover:text-[#39FF14]/60',
        )}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </button>
    </li>
  )
}

/**
 * Today's MAP at a glance: a progress ring, what's next, every commitment as
 * a row that opens the activity, and a check to mark it done. Finished items
 * fold away under the open ones.
 */
export function TodayOnMap({ occurrences, date }: TodayOnMapProps) {
  const queryClient = useQueryClient()
  const { data: hasMap } = useHasActiveMap()
  const [showDone, setShowDone] = React.useState(false)
  const [showAllPending, setShowAllPending] = React.useState(false)

  const pending = occurrences.filter((o) => o.status !== 'yes')
  const done = occurrences.filter((o) => o.status === 'yes')
  const allDone = occurrences.length > 0 && pending.length === 0
  const visiblePending = showAllPending ? pending : pending.slice(0, PENDING_LIMIT)
  const dayLabel = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  const toggle = useMutation({
    mutationFn: async (occ: CommitmentOccurrence) => {
      const status = occ.status === 'yes' ? 'pending' : 'yes'
      const res = await fetch('/api/map/occurrences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: occ.id, status }),
      })
      if (!res.ok) throw new Error('Could not update')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.commitmentOccurrences })
      void queryClient.invalidateQueries({ queryKey: keys.areaActivations })
    },
  })

  return (
    <section className={`${GLASS_CARD} flex flex-col p-5 md:p-6`}>
      <div className="flex items-center gap-4">
        {occurrences.length > 0 ? (
          <ProgressRing done={done.length} total={occurrences.length} />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[rgba(57,255,20,0.14)] text-[#39FF14]">
            <MapIcon className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">Today on MAP · {dayLabel}</p>
          <h2 className="truncate text-lg font-semibold text-white">
            {occurrences.length === 0
              ? hasMap
                ? 'A rest day on your plan'
                : 'Build your alignment plan'
              : allDone
                ? 'All done for today'
                : `Next: ${pending[0]?.commitment?.title ?? 'your next commitment'}`}
          </h2>
        </div>
        <Link href="/map" className="hidden shrink-0 items-center gap-1 text-sm text-white/60 hover:text-white sm:flex">
          Open MAP <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {occurrences.length === 0 ? (
        <div className="mt-4 flex flex-col items-start gap-3">
          <p className="text-sm text-white/70">
            {hasMap ? 'Nothing is scheduled today. Rest counts too.' : 'Your MAP turns your vision into a simple daily practice.'}
          </p>
          <Link href={hasMap ? '/map/week' : '/map/new'} className="btn btn-outline !py-2 !px-4 text-sm">
            {hasMap ? 'See this week' : 'Build my MAP'}
          </Link>
        </div>
      ) : (
        <>
          {allDone && (
            <p className="mt-3 text-sm text-white/70">Every commitment is checked off. That&apos;s you living it.</p>
          )}

          {visiblePending.length > 0 && (
            <ul className="mt-3 space-y-0.5">
              {visiblePending.map((occ) => (
                <Row key={occ.id} occ={occ} busy={toggle.isPending} onToggle={() => toggle.mutate(occ)} />
              ))}
            </ul>
          )}
          {pending.length > PENDING_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAllPending((v) => !v)}
              className="mt-1 self-start px-2 text-xs text-white/55 hover:text-white"
            >
              {showAllPending ? 'Show fewer' : `+${pending.length - PENDING_LIMIT} more today`}
            </button>
          )}

          {done.length > 0 && (
            <div className="mt-2 border-t border-white/10 pt-2">
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                aria-expanded={showDone}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-white/60 hover:text-white"
              >
                <Check className="h-4 w-4 text-[#39FF14]" />
                {done.length} done
                <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', showDone && 'rotate-180')} />
              </button>
              {showDone && (
                <ul className="space-y-0.5">
                  {done.map((occ) => (
                    <Row key={occ.id} occ={occ} busy={toggle.isPending} onToggle={() => toggle.mutate(occ)} />
                  ))}
                </ul>
              )}
            </div>
          )}

          <Link href="/map" className="mt-3 flex items-center gap-1 self-start px-2 text-sm text-white/60 hover:text-white sm:hidden">
            Open MAP <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </>
      )}
    </section>
  )
}
