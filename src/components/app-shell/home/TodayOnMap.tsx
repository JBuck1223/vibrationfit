'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Map as MapIcon } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { keys } from '@/lib/query/keys'
import type { CommitmentOccurrence } from '@/lib/map/types'
import { useHasActiveMap } from '@/components/dashboard/widgets/queries'

interface TodayOnMapProps {
  occurrences: CommitmentOccurrence[]
  date: string
}

/** Today's commitments with a one-tap done toggle; the first four, then a link into MAP. */
export function TodayOnMap({ occurrences, date }: TodayOnMapProps) {
  const queryClient = useQueryClient()
  const { data: hasMap } = useHasActiveMap()
  const done = occurrences.filter((o) => o.status === 'yes').length

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
    <section className="glass-panel flex flex-col p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <MapIcon className="h-4 w-4 text-[#39FF14]" />
          Today on MAP
        </h2>
        <Link href="/map" className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
          {occurrences.length > 0 ? `${done}/${occurrences.length}` : 'Open'} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {occurrences.length === 0 ? (
        <div className="flex flex-col items-start gap-3 py-2">
          <p className="text-sm text-white/70">
            {hasMap ? 'Nothing scheduled today. A rest day counts too.' : 'Your alignment plan turns the vision into daily practice.'}
          </p>
          <Link href={hasMap ? '/map/week' : '/map/new'} className="btn btn-outline !py-2 !px-4 text-sm">
            {hasMap ? 'See this week' : 'Build my MAP'}
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {occurrences.slice(0, 4).map((occ) => {
            const isDone = occ.status === 'yes'
            return (
              <li key={occ.id} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggle.mutate(occ)}
                  disabled={toggle.isPending}
                  aria-pressed={isDone}
                  aria-label={isDone ? 'Mark not done' : 'Mark done'}
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isDone ? 'border-[#39FF14] bg-[#39FF14] text-black' : 'border-white/30 text-transparent hover:border-[#39FF14]',
                  )}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </button>
                <span className={cn('min-w-0 flex-1 truncate text-sm', isDone ? 'text-white/50 line-through' : 'text-white')}>
                  {occ.commitment?.title ?? 'Commitment'}
                </span>
              </li>
            )
          })}
          {occurrences.length > 4 && (
            <li className="pt-1 text-xs text-white/50">+{occurrences.length - 4} more in MAP</li>
          )}
        </ul>
      )}
    </section>
  )
}
