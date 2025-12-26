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
  activeColor?: string
  inactiveColor?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Toggle<T extends string>({
  options,
  value,
  onChange,
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
        'inline-flex items-center gap-2 p-2 bg-neutral-800/80 backdrop-blur-sm rounded-full border border-neutral-700',
        className
      )}
      {...props}
    >
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full font-semibold transition-all duration-300',
              sizes[size],
              !isActive && 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
            )}
            style={isActive ? {
              backgroundColor: activeColor,
              color: '#000000',
              boxShadow: `0 10px 15px -3px ${hexToRgba(activeColor, 0.3)}, 0 4px 6px -2px ${hexToRgba(activeColor, 0.2)}`,
              transform: 'scale(1.05)'
            } : {}}
          >
            <span className="flex items-center gap-2">
              {option.label}
              {option.badge && isActive && (
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-black shadow-md"
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

