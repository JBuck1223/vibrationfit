'use client'

import { useState } from 'react'
import { Check, X, Minus, Loader2 } from 'lucide-react'
import type { OccurrenceStatus } from '@/lib/map/types'

interface MapVerifyButtonsProps {
  status: OccurrenceStatus
  onVerify: (status: 'yes' | 'no' | 'skipped') => Promise<void>
  compact?: boolean
}

export function MapVerifyButtons({ status, onVerify, compact = false }: MapVerifyButtonsProps) {
  const [saving, setSaving] = useState(false)

  const handle = async (next: 'yes' | 'no' | 'skipped') => {
    if (saving) return
    setSaving(true)
    try {
      await onVerify(next)
    } finally {
      setSaving(false)
    }
  }

  const btnClass = compact
    ? 'px-2 py-1 text-[10px] rounded-lg'
    : 'px-3 py-1.5 text-xs rounded-lg'

  if (saving) {
    return (
      <div className="flex items-center gap-1 text-neutral-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => handle('yes')}
        className={`${btnClass} font-medium transition-all ${
          status === 'yes'
            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/40'
            : 'bg-neutral-800 text-neutral-400 hover:bg-primary-500/10 hover:text-primary-400 border border-transparent'
        }`}
      >
        <Check className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} inline mr-0.5`} />
        Yes
      </button>
      <button
        type="button"
        onClick={() => handle('no')}
        className={`${btnClass} font-medium transition-all ${
          status === 'no'
            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
            : 'bg-neutral-800 text-neutral-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent'
        }`}
      >
        <X className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} inline mr-0.5`} />
        No
      </button>
      <button
        type="button"
        onClick={() => handle('skipped')}
        className={`${btnClass} font-medium transition-all ${
          status === 'skipped'
            ? 'bg-neutral-700 text-neutral-300 border border-neutral-600'
            : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700 hover:text-neutral-300 border border-transparent'
        }`}
      >
        <Minus className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} inline mr-0.5`} />
        Skip
      </button>
    </div>
  )
}
