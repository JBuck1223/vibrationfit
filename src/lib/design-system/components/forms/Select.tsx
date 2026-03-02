'use client'

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../shared-utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  helperText?: string
  disabled?: boolean
  className?: string
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ label, options, placeholder = 'Select...', value, onChange, error, helperText, disabled = false, className = '' }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)
    const displayValue = selectedOption?.label || placeholder

    const updateDropdownRect = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setDropdownRect({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        })
      }
    }

    useLayoutEffect(() => {
      if (isOpen && !disabled) {
        updateDropdownRect()
      } else {
        setDropdownRect(null)
      }
    }, [isOpen, disabled])

    useEffect(() => {
      if (!isOpen) return
      const onScrollOrResize = () => updateDropdownRect()
      window.addEventListener('scroll', onScrollOrResize, true)
      window.addEventListener('resize', onScrollOrResize)
      return () => {
        window.removeEventListener('scroll', onScrollOrResize, true)
        window.removeEventListener('resize', onScrollOrResize)
      }
    }, [isOpen])

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node
        if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
        setIsOpen(false)
      }
      
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue)
      setIsOpen(false)
    }

    return (
      <div className={cn('w-full relative', className)} ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            {label}
          </label>
        )}
        
        <div className="relative" ref={triggerRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full pl-4 pr-12 py-3 rounded-xl border-2 hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left',
              'bg-[#404040]',
              disabled && 'opacity-50 cursor-not-allowed',
              !selectedOption && 'text-[#9CA3AF]',
              selectedOption && 'text-white',
              error
                ? 'border-[#FF0040] focus:border-[#FF0040]'
                : 'border-[#666666] focus:border-[#39FF14]'
            )}
          >
            {displayValue}
          </button>
          
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className={cn('w-4 h-4 text-neutral-400 transition-transform', isOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {isOpen && !disabled && typeof document !== 'undefined' && createPortal(
          <>
            <div
              className="fixed inset-0 z-[60]"
              onClick={() => setIsOpen(false)}
              aria-hidden
            />
            {dropdownRect && (
              <div
                ref={dropdownRef}
                className="fixed z-[60] py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain"
                style={{
                  top: dropdownRect.top,
                  left: dropdownRect.left,
                  width: dropdownRect.width,
                }}
              >
                {options.map((option) => {
                  const isSelected = option.value === value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        'w-full px-4 py-2 text-left transition-colors',
                        isSelected
                          ? 'bg-primary-500/20 text-primary-500 font-semibold'
                          : 'text-white hover:bg-[#333]'
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            )}
          </>,
          document.body
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
Select.displayName = 'Select'
