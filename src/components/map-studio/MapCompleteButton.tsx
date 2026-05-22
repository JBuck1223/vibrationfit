'use client'

import { useState } from 'react'
import { Check, CheckCircle2, Loader2 } from 'lucide-react'
import type { OccurrenceStatus } from '@/lib/map/types'

interface MapCompleteButtonProps {
  status: OccurrenceStatus
  onVerify: (status: 'yes' | 'pending') => Promise<void>
  compact?: boolean
}

export function MapCompleteButton({ status, onVerify, compact = false }: MapCompleteButtonProps) {
  const [saving, setSaving] = useState(false)
  const isComplete = status === 'yes'

  const handleClick = async () => {
    if (saving) return
    setSaving(true)
    try {
      await onVerify(isComplete ? 'pending' : 'yes')
    } finally {
      setSaving(false)
    }
  }

  const sizeClass = compact
    ? 'px-2.5 py-1.5 text-[10px] rounded-lg gap-1'
    : 'px-3 py-2 text-xs rounded-lg gap-1.5'

  if (saving) {
    return (
      <div
        className={`inline-flex items-center justify-center border border-[#333] bg-neutral-800 text-neutral-500 ${sizeClass}`}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center font-medium transition-all border ${sizeClass} ${
        isComplete
          ? 'border-primary-500/40 bg-primary-500/20 text-primary-400 hover:bg-primary-500/25'
          : 'border-[#333] bg-neutral-800 text-neutral-300 hover:bg-primary-500/10 hover:text-primary-400 hover:border-primary-500/30 cursor-pointer'
      }`}
      aria-pressed={isComplete}
    >
      {isComplete ? (
        <>
          <span>Complete</span>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-primary-500" strokeWidth={2} aria-hidden />
        </>
      ) : (
        <>
          <Check className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden />
          <span>Mark Complete</span>
        </>
      )}
    </button>
  )
}
