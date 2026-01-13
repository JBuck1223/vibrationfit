'use client'

import { ListMusic, Music2, Layers } from 'lucide-react'

export type OutputFormat = 'individual' | 'combined' | 'both'

interface FormatSelectorProps {
  value: OutputFormat
  onChange: (value: OutputFormat) => void
  disabled?: boolean
  showDescription?: boolean
}

const FORMAT_OPTIONS = [
  {
    value: 'individual' as const,
    label: 'Individual Sections',
    description: 'Separate track for each section',
    icon: ListMusic
  },
  {
    value: 'combined' as const,
    label: 'Combined Full Track',
    description: 'One continuous track with all sections',
    icon: Music2
  },
  {
    value: 'both' as const,
    label: 'Both',
    description: 'Individual tracks + full combined track',
    icon: Layers
  }
]

export function FormatSelector({
  value,
  onChange,
  disabled = false,
  showDescription = true
}: FormatSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {FORMAT_OPTIONS.map(option => {
          const isSelected = value === option.value
          const Icon = option.icon
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={`
                p-4 rounded-xl border-2 transition-all text-left
                ${isSelected 
                  ? 'border-primary-500 bg-primary-500/10' 
                  : 'border-neutral-700 hover:border-neutral-600 bg-neutral-900/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isSelected ? 'bg-primary-500/20' : 'bg-neutral-800'}
                `}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-primary-500' : 'text-neutral-400'}`} />
                </div>
                <div className="min-w-0">
                  <p className={`font-medium ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                    {option.label}
                  </p>
                  {showDescription && (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
