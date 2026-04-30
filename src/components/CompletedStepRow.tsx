'use client'

import type { ReactNode } from 'react'
import { CheckCircle } from 'lucide-react'

/**
 * Collapsed “completed step” row for audio flows: step number on the left,
 * label + value in the middle, completed icon on the right. Badge and check are
 * vertically centered within the row relative to the text block.
 */
const badgeClasses = {
  primary:
    'bg-primary-500/15 text-primary-500',
  accent:
    'bg-accent-500/15 text-accent-500',
} as const

const checkClasses = {
  primary: 'text-primary-500',
  accent: 'text-accent-500',
} as const

export function CompletedStepRow({
  step,
  label,
  value,
  valueIcon,
  onChange,
  badgeVariant = 'primary',
}: {
  step: number
  label: string
  value: ReactNode
  valueIcon?: ReactNode
  onChange: () => void
  /** `accent` = design-system purple (e.g. nested steps under Create your mix on /audio/mix). */
  badgeVariant?: keyof typeof badgeClasses
}) {
  return (
    <div
      className="rounded-2xl border border-neutral-700/50 bg-neutral-900/40 px-4 py-3 cursor-pointer transition-colors active:bg-neutral-800/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
      onClick={() => onChange()}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onChange()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${label.toLowerCase()} step`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums leading-none ${badgeClasses[badgeVariant]}`}
        >
          {step}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="m-0 text-sm leading-tight text-neutral-400">
            {label}:
          </p>
          <div className="min-w-0 flex flex-wrap items-center gap-x-1.5 text-sm leading-normal font-medium break-words text-white md:truncate">
            {valueIcon}
            {value}
          </div>
        </div>
        <CheckCircle
          className={`h-5 w-5 shrink-0 md:h-6 md:w-6 ${checkClasses[badgeVariant]}`}
          aria-hidden
        />
      </div>
    </div>
  )
}
