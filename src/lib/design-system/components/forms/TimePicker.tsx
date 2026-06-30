'use client'

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Clock } from 'lucide-react'
import { cn } from '../shared-utils'

interface TimePickerProps {
  label?: string
  error?: string
  helperText?: string
  value?: string // HH:MM (24h); seconds optional, normalized internally
  onChange?: (time: string) => void
  minTime?: string
  maxTime?: string
  step?: number // minutes between options (default 30)
  placeholder?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** Align popover to trigger start (default) or end — use `end` in narrow rows/modals. */
  popoverAlign?: 'start' | 'end'
}

function normalizeHHMM(t: string | undefined): string {
  if (!t?.trim()) return ''
  const m = t.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return ''
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)))
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)))
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

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

const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const formatTimeDisplay = (time: string): string => {
  if (!time) return ''
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

export const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
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
      size = 'md',
      popoverAlign = 'start',
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)

    const normalizedValue = normalizeHHMM(value)
    const timeOptions = generateTimeOptions(step, minTime, maxTime)

    useLayoutEffect(() => {
      if (!isOpen || typeof document === 'undefined') {
        setDropdownPosition(null)
        return
      }
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const padding = 8
      const estimatedHeight = 260
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      const spaceBelow = viewportHeight - rect.bottom - padding
      const spaceAbove = rect.top - padding

      let top: number
      if (spaceBelow >= estimatedHeight) {
        top = rect.bottom + padding
      } else if (spaceAbove >= estimatedHeight) {
        top = rect.top - padding - estimatedHeight
      } else {
        top =
          spaceBelow >= spaceAbove
            ? rect.bottom + padding
            : Math.max(padding, rect.top - padding - estimatedHeight)
      }
      top = Math.max(padding, Math.min(top, viewportHeight - estimatedHeight - padding))

      const dropdownWidth = Math.min(viewportWidth - 32, 280)
      let left = popoverAlign === 'end' ? rect.right - dropdownWidth : rect.left
      left = Math.max(16, Math.min(left, viewportWidth - dropdownWidth - 16))

      setDropdownPosition({ top, left })
    }, [isOpen, popoverAlign])

    useLayoutEffect(() => {
      if (!isOpen || !dropdownPosition) return
      const raf = requestAnimationFrame(() => {
        const dropdown = dropdownRef.current
        const trigger = triggerRef.current
        if (!dropdown || !trigger) return

        const triggerRect = trigger.getBoundingClientRect()
        const dropdownRect = dropdown.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const padding = 8

        let top = dropdownPosition.top
        let left = dropdownPosition.left

        if (dropdownRect.bottom > viewportHeight - padding) {
          const topAbove = triggerRect.top - padding - dropdownRect.height
          if (topAbove >= padding) {
            top = topAbove
          } else {
            top = Math.max(padding, viewportHeight - dropdownRect.height - padding)
          }
        }

        const dropdownWidth = Math.min(viewportWidth - 32, 280)
        const alignLeft =
          popoverAlign === 'end' ? triggerRect.right - dropdownWidth : triggerRect.left
        left = Math.max(16, Math.min(alignLeft, viewportWidth - dropdownWidth - 16))

        if (top !== dropdownPosition.top || left !== dropdownPosition.left) {
          setDropdownPosition({ top, left })
        }
      })
      return () => cancelAnimationFrame(raf)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, popoverAlign])

    useEffect(() => {
      if (!isOpen) return
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node
        if (containerRef.current?.contains(target)) return
        if (dropdownRef.current?.contains(target)) return
        setIsOpen(false)
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    useEffect(() => {
      if (!isOpen) return
      const id = requestAnimationFrame(() => {
        const list = listRef.current
        if (!list) return
        if (normalizedValue) {
          const selected = list.querySelector<HTMLElement>(`[data-time="${normalizedValue}"]`)
          if (selected) {
            const delta =
              selected.getBoundingClientRect().top -
              list.getBoundingClientRect().top +
              list.scrollTop
            list.scrollTop = Math.max(0, delta)
          }
        } else {
          list.scrollTop = 0
        }
      })
      return () => cancelAnimationFrame(id)
    }, [isOpen, normalizedValue])

    const sizeFieldClasses = {
      sm: 'px-3 py-2 text-base pr-9',
      md: 'px-4 py-3 text-base pr-10',
      lg: 'px-5 py-4 text-lg pr-12',
    }
    const sizeIconRight = {
      sm: 'right-2.5',
      md: 'right-3',
      lg: 'right-4',
    }
    const sizeIconWh = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }

    const handleTimeSelect = (time: string) => {
      onChange?.(time)
      setIsOpen(false)
    }

    return (
      <div className={cn('relative w-full', className)} ref={containerRef}>
        {label && (
          <label className="mb-2 block text-sm font-medium text-[#E5E7EB]">{label}</label>
        )}

        <div className="relative" ref={triggerRef}>
          <input
            ref={ref}
            type="text"
            readOnly
            disabled={disabled}
            value={normalizedValue ? formatTimeDisplay(normalizedValue) : ''}
            placeholder={placeholder}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              'w-full',
              sizeFieldClasses[size],
              'bg-[#404040]',
              'border-2',
              'rounded-xl',
              'text-white',
              'placeholder-[#9CA3AF]',
              'focus:outline-none',
              'transition-all duration-200',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              error
                ? 'border-[#FF0040]'
                : isOpen
                  ? 'border-[#39FF14]'
                  : 'border-[#666666]',
            )}
          />
          <Clock
            className={cn(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 text-neutral-400',
              sizeIconRight[size],
              sizeIconWh[size],
            )}
            strokeWidth={2.5}
          />
        </div>

        {isOpen &&
          dropdownPosition &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[9999] w-[min(calc(100vw-2rem),280px)] overflow-hidden rounded-2xl border-2 border-[#333] bg-[#1F1F1F] shadow-xl"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                maxHeight: 'min(280px, calc(100vh - 16px))',
              }}
            >
              <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
                {timeOptions.length === 0 ? (
                  <div className="px-3 py-2 text-center text-sm text-neutral-500">
                    No times available
                  </div>
                ) : (
                  timeOptions.map(time => {
                    const isSelected = time === normalizedValue
                    return (
                      <button
                        key={time}
                        type="button"
                        data-time={time}
                        onClick={() => handleTimeSelect(time)}
                        className={cn(
                          'w-full px-3 py-1.5 text-left text-sm transition-colors',
                          isSelected
                            ? 'bg-primary-500/20 font-semibold text-primary-500'
                            : 'text-white hover:bg-[#333]',
                        )}
                      >
                        {formatTimeDisplay(time)}
                      </button>
                    )
                  })
                )}
              </div>
            </div>,
            document.body,
          )}

        {error && <p className="mt-2 text-sm text-[#FF0040]">{error}</p>}
        {!error && helperText && <p className="mt-2 text-sm text-[#9CA3AF]">{helperText}</p>}
      </div>
    )
  },
)
TimePicker.displayName = 'TimePicker'
