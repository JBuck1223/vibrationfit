'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ExpeditionSequence, SequenceStep } from '@/lib/life-explorer/sequence'
import { ExpeditionPath } from './ExpeditionPath'

export function ExpeditionViewer({
  sequence,
  selectedDay,
  onSelectDay,
  children,
}: {
  sequence: ExpeditionSequence
  selectedDay: number
  onSelectDay: (day: number) => void
  children?: React.ReactNode
}) {
  const step = useMemo(
    () => sequence.steps.find((s) => s.day === selectedDay) || sequence.steps[0],
    [sequence.steps, selectedDay]
  )
  if (!step) return null

  const prev = sequence.steps.find((s) => s.day === step.day - 1)
  const next = sequence.steps.find((s) => s.day === step.day + 1)

  return (
    <div className="space-y-5">
      <ExpeditionPath
        sequence={sequence}
        selectedDay={step.day}
        onSelectDay={onSelectDay}
      />

      <div className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <NavButton
            label="Previous day"
            disabled={!prev}
            onClick={() => prev && onSelectDay(prev.day)}
            side="left"
          />
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Day {step.day} of {sequence.total_days}
          </p>
          <NavButton
            label="Next day"
            disabled={!next}
            onClick={() => next && onSelectDay(next.day)}
            side="right"
          />
        </div>

        <h3 className="mt-4 text-2xl font-bold text-white">{step.title}</h3>
        {step.essential_question && (
          <p className="mt-2 text-neutral-300">{step.essential_question}</p>
        )}
        <StatusLine step={step} />

        {step.status === 'upcoming' && (step.hook || step.mission) && (
          <div className="mt-4 space-y-2 rounded-xl border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm text-neutral-300">
            {step.hook && (
              <p>
                <span className="text-neutral-500">Hook: </span>
                {step.hook}
              </p>
            )}
            {step.mission && (
              <p>
                <span className="text-neutral-500">Mission: </span>
                {step.mission}
              </p>
            )}
            <p className="text-neutral-500">
              This day opens after you finish the one before it. Teach in order so the story holds.
            </p>
          </div>
        )}

        {step.lesson_id && (
          <Link
            href={`/homeschool/life-explorer/lesson/${step.lesson_id}`}
            className="mt-5 inline-flex rounded-xl bg-[#39FF14] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#5FFF3E]"
          >
            {step.status === 'completed' ? 'Revisit this day' : 'Open this day'}
          </Link>
        )}

        {children}
      </div>
    </div>
  )
}

function StatusLine({ step }: { step: SequenceStep }) {
  const copy =
    step.status === 'completed'
      ? 'Lived'
      : step.status === 'today'
        ? 'This is today'
        : step.status === 'ready'
          ? 'Ready to teach'
          : step.status === 'skipped'
            ? 'Set aside'
            : 'Coming up'
  const color =
    step.status === 'completed' || step.status === 'today'
      ? 'text-[#39FF14]'
      : step.status === 'ready'
        ? 'text-[#00FFFF]'
        : 'text-neutral-500'
  return <p className={`mt-2 text-xs font-medium uppercase tracking-wide ${color}`}>{copy}</p>
}

function NavButton({
  label,
  disabled,
  onClick,
  side,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  side: 'left' | 'right'
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-[#2a2a2a] p-2 text-neutral-300 hover:border-[#39FF14]/40 hover:text-white disabled:opacity-30"
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
