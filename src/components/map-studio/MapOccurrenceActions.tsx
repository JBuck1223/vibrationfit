'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { OccurrenceStatus } from '@/lib/map/types'
import { MapCompleteButton } from './MapCompleteButton'

export function MapOccurrenceActions({
  status,
  onVerify,
  manualLogHint,
}: {
  status: OccurrenceStatus
  onVerify: (status: 'yes' | 'pending') => Promise<void>
  /** Shown under Mark Complete when manual log is open (system rows). */
  manualLogHint?: string
}) {
  const [manualOpen, setManualOpen] = useState(false)

  return (
    <div className="border-t border-white/[0.04]">
      <button
        type="button"
        onClick={() => setManualOpen(v => !v)}
        className="flex w-full items-center justify-center gap-0.5 px-2.5 py-2 text-[10px] text-neutral-600 hover:bg-white/[0.04] hover:text-neutral-500 transition-colors"
      >
        <span>{manualOpen ? 'Hide' : 'Manual log'}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${manualOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {manualOpen ? (
        <div className="px-2.5 pb-2.5 flex flex-col items-start gap-2">
          <MapCompleteButton status={status} onVerify={onVerify} compact />
          {manualLogHint ? (
            <p className="text-[10px] text-neutral-600 leading-relaxed max-w-md">
              {manualLogHint}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
