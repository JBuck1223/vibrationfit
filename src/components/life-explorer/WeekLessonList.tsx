'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ExpeditionSequence, SequenceStep } from '@/lib/life-explorer/sequence'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function weekdayLabel(iso: string | null) {
  if (!iso) return null
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return WEEKDAYS[d.getDay()]
}

function statusCopy(step: SequenceStep) {
  if (step.status === 'completed') return 'Lived'
  if (step.status === 'today') return 'Today — teach this'
  if (step.status === 'ready') return 'Ready to teach'
  if (step.status === 'skipped') return 'Set aside'
  return 'Coming up'
}

export function WeekLessonList({
  sequence,
  compact = false,
}: {
  sequence: ExpeditionSequence
  compact?: boolean
}) {
  if (sequence.steps.length === 0) return null

  return (
    <ol className="space-y-2">
      {sequence.steps.map((step) => {
        const weekday = weekdayLabel(step.planned_for)
        const isToday = step.status === 'today'
        const href = step.lesson_id
          ? `/homeschool/life-explorer/lesson/${step.lesson_id}`
          : null
        return (
          <li
            key={step.day}
            className={`rounded-2xl border px-4 py-4 ${
              isToday
                ? 'border-[#39FF14]/70 bg-[#39FF14]/5'
                : 'border-[#222] bg-[#111]'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p
                  className={`text-[10px] uppercase tracking-[0.18em] ${
                    isToday ? 'text-[#39FF14]' : 'text-neutral-500'
                  }`}
                >
                  Day {step.day}
                  {weekday ? ` · ${weekday}` : ''}
                  {step.planned_for ? ` · ${step.planned_for}` : ''}
                  {' · '}
                  {statusCopy(step)}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">{step.title}</p>
                {step.essential_question && !compact && (
                  <p className="mt-1 text-sm text-neutral-400">{step.essential_question}</p>
                )}
              </div>
              {href ? (
                <Link
                  href={href}
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    isToday
                      ? 'bg-[#39FF14] text-black hover:bg-[#5FFF3E]'
                      : 'border border-[#333] text-white hover:border-[#39FF14]/50'
                  }`}
                >
                  {step.status === 'completed' ? 'Revisit this lesson' : 'Open this lesson'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <p className="text-xs text-neutral-500">Lesson not written yet</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
