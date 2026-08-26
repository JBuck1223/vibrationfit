'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import type { ExpeditionSequence, SequenceStep, SequenceStepStatus } from '@/lib/life-explorer/sequence'

const STATUS_RING: Record<SequenceStepStatus, string> = {
  completed: 'border-[#39FF14] bg-[#39FF14] text-black',
  today: 'border-[#39FF14] bg-[#39FF14] text-black ring-4 ring-[#39FF14]/25',
  ready: 'border-[#00FFFF] bg-[#00FFFF]/15 text-[#00FFFF]',
  upcoming: 'border-[#444] bg-[#141414] text-neutral-500',
  skipped: 'border-[#444] bg-transparent text-neutral-600',
}

function stepHref(step: SequenceStep, expeditionId?: string) {
  if (step.lesson_id) return `/homeschool/life-explorer/lesson/${step.lesson_id}`
  if (expeditionId) return `/homeschool/life-explorer/expeditions/${expeditionId}?day=${step.day}`
  return undefined
}

export function ExpeditionPath({
  sequence,
  expeditionId,
  selectedDay,
  onSelectDay,
  size = 'md',
}: {
  sequence: ExpeditionSequence
  expeditionId?: string
  selectedDay?: number
  onSelectDay?: (day: number) => void
  size?: 'sm' | 'md'
}) {
  const node = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-11 w-11 text-sm'
  return (
    <ol className="flex items-start gap-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {sequence.steps.map((step, i) => {
        const href = onSelectDay ? undefined : stepHref(step, expeditionId)
        const selected = selectedDay === step.day
        const inner = (
          <>
            <span
              className={`flex ${node} shrink-0 items-center justify-center rounded-full border-2 font-bold transition-colors ${
                STATUS_RING[step.status]
              } ${selected ? 'outline outline-2 outline-offset-2 outline-white' : ''}`}
            >
              {step.status === 'completed' ? <Check className="h-4 w-4" strokeWidth={3} /> : step.day}
            </span>
            <span
              className={`mt-2 max-w-[7.5rem] text-center text-[11px] leading-snug ${
                step.status === 'today' ? 'font-semibold text-white' : 'text-neutral-400'
              }`}
            >
              {step.status === 'today' ? 'Today' : `Day ${step.day}`}
              <span className="mt-0.5 block truncate text-neutral-500">{step.title}</span>
            </span>
          </>
        )
        return (
          <li key={step.day} className="flex min-w-0 items-start">
            {i > 0 && (
              <span
                className={`mt-5 h-0.5 w-6 sm:w-10 shrink-0 ${
                  sequence.steps[i - 1].status === 'completed' ? 'bg-[#39FF14]/70' : 'bg-[#2a2a2a]'
                }`}
                aria-hidden
              />
            )}
            {onSelectDay ? (
              <button
                type="button"
                onClick={() => onSelectDay(step.day)}
                className="flex w-[5.5rem] sm:w-[7.5rem] flex-col items-center"
              >
                {inner}
              </button>
            ) : href ? (
              <Link href={href} className="flex w-[5.5rem] sm:w-[7.5rem] flex-col items-center">
                {inner}
              </Link>
            ) : (
              <div className="flex w-[5.5rem] sm:w-[7.5rem] flex-col items-center">{inner}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
