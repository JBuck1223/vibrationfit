'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../shared-utils'

interface TimePickerProps {
  label?: string
  error?: string
  helperText?: string
  value?: string // HH:MM format (24-hour)
  onChange?: (time: string) => void
  minTime?: string // HH:MM format
  maxTime?: string // HH:MM format
  step?: number // Minutes between options (default 30)
  placeholder?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

// Generate time options
const generateTimeOptions = (step: number = 30, minTime?: string, maxTime?: string): string[] => {
  const options: string[] = []
  const minMinutes = minTime ? parseTimeToMinutes(minTime) : 0
  const maxMinutes = maxTime ? parseTimeToMinutes(maxTime) : 24 * 60 - 1

  for (let minutes = 0; minutes < 24 * 60; minutes += step) {
    if (minutes >= minMinutes && minutes <= maxMinutes) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      options.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`)
    }
  }
  return options
}

// Parse HH:MM to total minutes
const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Format 24h time to 12h display
const formatTimeDisplay = (time: string): string => {
  if (!time) return ''
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

export const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  ({ 
    label, 
    error, 
    helperText, 
    value, 
    onChange, 
    minTime, 
    maxTime, 
    step = 30,
    placeholder = 'Select time...',
    disabled = false,
    className = '',
    size = 'md'
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    const timeOptions = generateTimeOptions(step, minTime, maxTime)

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    // Scroll to selected time when opening
    useEffect(() => {
      if (isOpen && value && listRef.current) {
        const selectedElement = listRef.current.querySelector(`[data-time="${value}"]`)
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: 'center', behavior: 'instant' })
        }
      }
    }, [isOpen, value])

    const handleTimeSelect = (time: string) => {
      onChange?.(time)
      setIsOpen(false)
    }

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3',
      lg: 'px-5 py-4 text-lg'
    }

    return (
      <div className={cn('relative', className)} ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
            {label}
          </label>
        )}

        {/* Input Field */}
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full text-left whitespace-nowrap',
              sizeClasses[size],
              'pr-5',
              'bg-[#404040]',
              'border-2',
              'rounded-xl',
              'text-white',
              'focus:outline-none',
              'transition-all duration-200',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              error
                ? 'border-[#FF0040]'
                : isOpen
                ? 'border-[#39FF14]'
                : 'border-[#666666] hover:border-[#888888]'
            )}
          >
            {value ? (
              <span className="text-white">{formatTimeDisplay(value)}</span>
            ) : (
              <span className="text-[#9CA3AF]">{placeholder}</span>
            )}
          </button>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className={cn(
              'w-3 h-3 text-neutral-400 transition-transform',
              isOpen && 'rotate-180'
            )} />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-[#1F1F1F] border-2 border-[#333] rounded-xl overflow-hidden shadow-xl">
            {/* Time Options */}
            <div ref={listRef} className="max-h-48 overflow-y-auto py-1">
              {timeOptions.length === 0 ? (
                <div className="px-3 py-2 text-center text-neutral-500 text-sm">
                  No times available
                </div>
              ) : (
                timeOptions.map((time) => {
                  const isSelected = time === value
                  return (
                    <button
                      key={time}
                      type="button"
                      data-time={time}
                      onClick={() => handleTimeSelect(time)}
                      className={cn(
                        'w-full px-3 py-1.5 text-left text-sm transition-colors',
                        isSelected
                          ? 'bg-primary-500/20 text-primary-500 font-semibold'
                          : 'text-white hover:bg-[#333]'
                      )}
                    >
                      {formatTimeDisplay(time)}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-[#FF0040]">{error}</p>
        )}
        {!error && helperText && (
          <p className="mt-2 text-sm text-[#9CA3AF]">{helperText}</p>
        )}
      </div>
    )
  }
)
TimePicker.displayName = 'TimePicker'
