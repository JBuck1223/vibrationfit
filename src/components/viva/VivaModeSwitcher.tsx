'use client'

import { VIVA_MODES, VIVA_MODE_LABELS, type VivaMode } from '@/lib/viva/modes'
import { cn } from '@/lib/utils'

const HINTS: Record<VivaMode, string> = {
  auto: 'VIVA reads the moment',
  friend: 'Listen only',
  coach: 'Go for the aha',
  builder: 'Build this manifestation',
  assistant: 'Find and link',
}

interface VivaModeSwitcherProps {
  value: VivaMode
  onChange: (mode: VivaMode) => void
  disabled?: boolean
}

export function VivaModeSwitcher({ value, onChange, disabled }: VivaModeSwitcherProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {VIVA_MODES.map(mode => (
        <button
          key={mode}
          type="button"
          disabled={disabled}
          title={HINTS[mode]}
          onClick={() => onChange(mode)}
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
            value === mode
              ? 'bg-white text-black'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800',
            disabled && 'opacity-40 cursor-not-allowed',
          )}
        >
          {VIVA_MODE_LABELS[mode]}
        </button>
      ))}
    </div>
  )
}
