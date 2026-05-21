'use client'

import { Check, Clock, X, Minus } from 'lucide-react'
import type { OccurrenceStatus } from '@/lib/map/types'

const STATUS_CONFIG: Record<
  OccurrenceStatus,
  { label: string; className: string; icon: typeof Check }
> = {
  yes: {
    label: 'Done',
    className: 'text-primary-400 bg-primary-500/10 border-primary-500/30',
    icon: Check,
  },
  pending: {
    label: 'Not yet',
    className: 'text-neutral-400 bg-neutral-800/80 border-neutral-700',
    icon: Clock,
  },
  no: {
    label: 'Missed',
    className: 'text-red-400 bg-red-500/10 border-red-500/30',
    icon: X,
  },
  skipped: {
    label: 'Skipped',
    className: 'text-neutral-500 bg-neutral-800 border-neutral-700',
    icon: Minus,
  },
}

export function MapOccurrenceStatus({
  status,
  compact = false,
  variant = 'badge',
}: {
  status: OccurrenceStatus
  compact?: boolean
  variant?: 'badge' | 'minimal'
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const Icon = config.icon

  if (variant === 'minimal') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-medium tabular-nums ${
          status === 'yes'
            ? 'text-primary-400'
            : status === 'no'
              ? 'text-red-400/90'
              : 'text-neutral-500'
        }`}
      >
        <Icon className="w-3 h-3 shrink-0 opacity-80" />
        {config.label}
      </span>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium ${
        compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'
      } ${config.className}`}
    >
      <Icon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </div>
  )
}
