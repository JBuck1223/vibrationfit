'use client'

import React from 'react'
import { cn } from '../shared-utils'

// ============================================================================
// TOGGLE COMPONENT
// ============================================================================

interface ToggleOption<T extends string> {
  value: T
  label: string
  badge?: string
  badgeColor?: string
}

interface ToggleProps<T extends string> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: ToggleOption<T>[]
  value: T
  onChange: (value: T) => void
  /** `pill` = default lime active chip; `segmented` = zinc inset ring (e.g. life-vision new category) */
  variant?: 'pill' | 'segmented'
  /** Segmented only: fill container width with equal-width segments */
  fullWidth?: boolean
  /** Segmented only: match form control look (border, height) next to inputs/selects */
  segmentedField?: boolean
  activeColor?: string
  inactiveColor?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Toggle<T extends string>({
  options,
  value,
  onChange,
  variant = 'pill',
  fullWidth = false,
  segmentedField = false,
  activeColor = '#39FF14',
  inactiveColor = 'neutral',
  size = 'md',
  className = '',
  ...props
}: ToggleProps<T>) {
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3.5 text-base',
    lg: 'px-6 py-4 text-lg'
  }

  const segmentedSizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  }

  // Convert hex color to rgba for shadow
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return (
    <div
      className={cn(
        variant === 'segmented'
          ? cn(
              segmentedField
                ? cn(
                    'items-stretch gap-0 rounded-xl border-2 border-[#282828] bg-[#1A1A1A] p-0.5',
                    fullWidth ? 'flex h-full min-h-0 w-full' : 'inline-flex'
                  )
                : cn(
                    'items-stretch gap-0 rounded-xl bg-zinc-950/90 p-1 ring-1 ring-inset ring-white/[0.08]',
                    fullWidth ? 'flex w-full' : 'inline-flex'
                  )
            )
          : 'inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800/80 p-2 backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              variant === 'segmented' &&
                cn(
                  'inline-flex items-center justify-center font-medium transition-all duration-200',
                  segmentedField
                    ? 'min-h-[44px] flex-1 px-3 py-2 text-sm sm:min-h-[46px] sm:py-2.5'
                    : segmentedSizes[size],
                  'rounded-lg',
                  fullWidth && 'min-w-0 flex-1',
                  segmentedField &&
                    (isActive
                      ? 'bg-[#2d2d2d] font-semibold text-white shadow-inner'
                      : 'text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200'),
                  !segmentedField &&
                    (isActive
                      ? 'bg-zinc-900/85 font-semibold text-white'
                      : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200')
                ),
              variant === 'pill' &&
                cn(
                  'rounded-full font-semibold transition-all duration-300',
                  sizes[size],
                  !isActive && 'text-neutral-400 hover:bg-neutral-700/50 hover:text-white'
                )
            )}
            style={
              variant === 'pill' && isActive
                ? {
                    backgroundColor: activeColor,
                    color: '#000000',
                    boxShadow: `0 10px 15px -3px ${hexToRgba(activeColor, 0.3)}, 0 4px 6px -2px ${hexToRgba(activeColor, 0.2)}`,
                    transform: 'scale(1.05)',
                  }
                : undefined
            }
          >
            <span className="flex items-center justify-center gap-2">
              {option.label}
              {option.badge && isActive && (
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-black shadow-md"
                  style={{ backgroundColor: option.badgeColor || '#FFB701' }}
                >
                  {option.badge}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

