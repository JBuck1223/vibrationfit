'use client'

import { Lock } from 'lucide-react'
import { ProgressBar } from '@/lib/design-system/components'
import { getVisionCategoryIcon } from '@/lib/design-system/vision-categories'
import { ACTIVATION_COPY } from '@/lib/activation/copy'
import {
  describeActivationCategoryProgress,
  summarizeActivationProgress,
  type ActivationCategoryProgress,
  type ActivationProgressInput,
} from '@/lib/activation/category-progress'

/**
 * The 12 life areas as progress bars. The chosen area is pinned first and
 * unlocked; the other eleven fill from seeds VIVA catches along the way and
 * stay locked until membership.
 */
export function ActivationProgressBoard({
  input,
  compact = false,
  className = '',
}: {
  input: ActivationProgressInput
  /** Tight strip for the offer section — no hints, smaller bars. */
  compact?: boolean
  className?: string
}) {
  const copy = ACTIVATION_COPY.progress
  const progress = describeActivationCategoryProgress(input)
  const summary = summarizeActivationProgress(progress)
  const ordered = [
    ...progress.filter((p) => !p.locked),
    ...progress.filter((p) => p.locked),
  ]

  if (compact) {
    return (
      <div className={className}>
        <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {ordered.map((row) => (
            <ProgressRow key={row.category} row={row} compact />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="px-1 pb-1 text-xs text-neutral-500">
        {copy.boardLine(summary.touched)}
      </p>
      {ordered.map((row) => (
        <ProgressRow key={row.category} row={row} />
      ))}
    </div>
  )
}

function ProgressRow({ row, compact = false }: { row: ActivationCategoryProgress; compact?: boolean }) {
  const copy = ACTIVATION_COPY.progress
  const Icon = getVisionCategoryIcon(row.category)
  const active = row.percent > 0

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${row.locked ? (active ? 'text-neutral-300' : 'text-neutral-600') : 'text-[#BF00FF]'}`} />
        <span className={`w-20 shrink-0 truncate text-xs ${active ? 'text-neutral-200' : 'text-neutral-600'}`}>
          {row.label}
        </span>
        <ProgressBar
          value={row.percent}
          size="sm"
          variant={row.locked ? 'primary' : 'accent'}
          className={row.locked && !active ? 'opacity-40' : row.locked ? 'opacity-80' : ''}
        />
        <span className={`w-9 shrink-0 text-right text-xs tabular-nums ${active ? 'text-neutral-300' : 'text-neutral-600'}`}>
          {row.percent}%
        </span>
      </div>
    )
  }

  return (
    <div
      className={`group rounded-2xl border px-4 py-3 transition-colors ${
        row.locked
          ? active
            ? 'border-[#2a2a2a] bg-[#111]'
            : 'border-[#1f1f1f] bg-[#0c0c0c]'
          : 'border-[#BF00FF]/40 bg-[#BF00FF]/[0.06] shadow-[0_0_24px_rgba(191,0,255,0.12)]'
      }`}
      title={row.locked ? copy.lockedHint : undefined}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`h-4 w-4 shrink-0 ${
            row.locked ? (active ? 'text-neutral-200' : 'text-neutral-600') : 'text-[#BF00FF]'
          }`}
        />
        <span className={`truncate text-sm font-medium ${active || !row.locked ? 'text-white' : 'text-neutral-500'}`}>
          {row.label}
        </span>
        {!row.locked && (
          <span className="rounded-full border border-[#BF00FF]/40 bg-[#BF00FF]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#d580ff]">
            {copy.chosenTag}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2 text-xs tabular-nums">
          {row.locked && (
            <Lock className={`h-3 w-3 ${active ? 'text-neutral-400' : 'text-neutral-600'}`} />
          )}
          <span className={active || !row.locked ? 'text-neutral-200' : 'text-neutral-600'}>
            {row.percent}%
          </span>
        </span>
      </div>
      <ProgressBar
        value={row.percent}
        size="sm"
        variant={row.locked ? 'primary' : 'accent'}
        className={`mt-2.5 ${row.locked && !active ? 'opacity-40' : row.locked ? 'opacity-80' : ''}`}
      />
      {row.gapHint && (
        <p className={`mt-2 text-xs ${row.locked ? 'text-neutral-500' : 'text-[#d580ff]/80'}`}>
          {row.gapHint}
        </p>
      )}
      {row.locked && !row.gapHint && (
        <p className="mt-2 text-xs text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100">
          {copy.lockedHint}
        </p>
      )}
    </div>
  )
}
