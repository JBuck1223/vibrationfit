'use client'

import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'
import type { ExpeditionSequence } from '@/lib/life-explorer/sequence'
import { ExpeditionPath } from './ExpeditionPath'
import { WeekLessonList } from './WeekLessonList'

export function ExpeditionDashboard({
  studentName,
  expeditionTitle,
  expeditionId,
  why,
  sequence,
  primaryHref,
  primaryLabel,
}: {
  studentName?: string | null
  expeditionTitle: string
  expeditionId?: string
  why?: string | null
  sequence: ExpeditionSequence
  primaryHref?: string | null
  primaryLabel?: string | null
}) {
  const current = sequence.steps.find((s) => s.day === sequence.current_day)
  const headline =
    sequence.total_days > 0
      ? `Day ${sequence.current_day} of ${sequence.total_days}`
      : 'Ready to begin'

  return (
    <section className="rounded-3xl border border-[#222] bg-gradient-to-br from-[#101410] via-[#111] to-[#0a0a0a] p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#39FF14]/80">
            {studentName ? `${studentName} is exploring` : 'Current expedition'}
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-3xl font-bold text-white md:text-4xl">
            <Compass className="hidden h-8 w-8 shrink-0 text-[#39FF14] sm:block" />
            {expeditionTitle}
          </h2>
          {sequence.tagline && (
            <p className="mt-1 text-sm text-[#00FFFF]">{sequence.tagline}</p>
          )}
          {why && <p className="mt-2 max-w-2xl text-sm text-neutral-400">{why}</p>}
        </div>
        <div className="rounded-2xl border border-[#2a2a2a] bg-black/40 px-4 py-3 text-right">
          <p className="text-2xl font-bold tabular-nums text-white">{headline}</p>
          <p className="text-xs text-neutral-500">
            {sequence.completed_days} finished
            {sequence.total_days > 0
              ? ` · ${sequence.total_days - sequence.completed_days} ahead`
              : ''}
          </p>
        </div>
      </div>

      {sequence.steps.length > 0 && (
        <div className="mt-6 space-y-4">
          <ExpeditionPath sequence={sequence} expeditionId={expeditionId} />
          <WeekLessonList sequence={sequence} compact />
        </div>
      )}

      {current && (
        <div className="mt-6 flex flex-col gap-4 border-t border-[#222] pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Right now</p>
            <p className="mt-1 text-xl font-semibold text-white">{current.title}</p>
            {current.essential_question && (
              <p className="mt-1 text-sm text-neutral-400">{current.essential_question}</p>
            )}
          </div>
          {primaryHref && primaryLabel && (
            <Link
              href={primaryHref}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#39FF14] px-5 py-3 text-sm font-semibold text-black hover:bg-[#5FFF3E]"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
