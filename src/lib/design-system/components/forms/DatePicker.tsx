'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Check, CalendarDays } from 'lucide-react'
import { cn } from '../shared-utils'

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string
  error?: string
  helperText?: string
  value?: string // ISO date string (YYYY-MM-DD)
  onChange?: (date: string) => void
  minDate?: string // ISO date string
  maxDate?: string // ISO date string
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, helperText, value, onChange, minDate, maxDate, className = '', ...props }, ref) => {
    // Parse ISO date string (YYYY-MM-DD) as local date, not UTC
    const parseLocalDate = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    
    // Format date as local ISO string (YYYY-MM-DD)
    const formatLocalISO = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const [isOpen, setIsOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ? parseLocalDate(value) : null)
    const [currentMonth, setCurrentMonth] = useState<Date>(value ? parseLocalDate(value) : new Date())
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false)
    const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const yearDropdownRef = useRef<HTMLDivElement>(null)
    const monthDropdownRef = useRef<HTMLDivElement>(null)

    // Sync internal state when value prop changes (e.g., from parent useEffect)
    useEffect(() => {
      if (value) {
        const newDate = parseLocalDate(value)
        setSelectedDate(newDate)
        setCurrentMonth(newDate)
      } else {
        setSelectedDate(null)
      }
    }, [value])

    // Close calendar when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
        if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
          setIsYearDropdownOpen(false)
        }
        if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
          setIsMonthDropdownOpen(false)
        }
      }
      
      if (isOpen || isYearDropdownOpen || isMonthDropdownOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen, isYearDropdownOpen, isMonthDropdownOpen])

    // Format date for display
    const formatDisplayDate = (date: Date | null) => {
      if (!date) return ''
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }).format(date)
    }

    // Get days in month
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear()
      const month = date.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const daysInMonth = lastDay.getDate()
      const startingDayOfWeek = firstDay.getDay()
      
      return { daysInMonth, startingDayOfWeek, year, month }
    }

    const handleDateSelect = (day: number) => {
      const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const isoString = formatLocalISO(newDate)
      
      // Check if date is within min/max range
      if (minDate && isoString < minDate) return
      if (maxDate && isoString > maxDate) return
      
      setSelectedDate(newDate)
      onChange?.(isoString)
      setIsOpen(false)
    }

    const handlePrevMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    }

    const handleNextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    }

    const handleYearSelect = (year: number) => {
      setCurrentMonth(new Date(year, currentMonth.getMonth()))
      setIsYearDropdownOpen(false)
    }

    const handleMonthSelect = (monthIndex: number) => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex))
      setIsMonthDropdownOpen(false)
    }

    // Generate year options (current year descending, no future years)
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 51 }, (_, i) => currentYear - i)

    // Month options
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(currentMonth)

    // Check if date is disabled
    const isDateDisabled = (day: number) => {
      const dateStr = formatLocalISO(new Date(year, month, day))
      if (minDate && dateStr < minDate) return true
      if (maxDate && dateStr > maxDate) return true
      return false
    }

    // Check if date is selected
    const isDateSelected = (day: number) => {
      if (!selectedDate) return false
      return (
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year
      )
    }

    // Check if date is today
    const isToday = (day: number) => {
      const today = new Date()
      return (
        today.getDate() === day &&
        today.getMonth() === month &&
        today.getFullYear() === year
      )
    }

    return (
      <div className={cn('relative w-full', className)} ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
            {label}
          </label>
        )}
        
        {/* Input Field */}
        <div className="relative">
          <input
            ref={ref}
            type="text"
            readOnly
            value={formatDisplayDate(selectedDate)}
            onClick={() => setIsOpen(!isOpen)}
            placeholder="Select date..."
            className={cn(
              'w-full px-4 py-3 pr-10',
              'bg-[#404040]',
              'border-2',
              'rounded-xl',
              'text-white',
              'placeholder-[#9CA3AF]',
              'focus:outline-none',
              'transition-all duration-200',
              'cursor-pointer',
              error
                ? 'border-[#FF0040]'
                : isOpen
                ? 'border-[#39FF14]'
                : 'border-[#666666]'
            )}
            {...props}
          />
          <CalendarDays 
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" 
            strokeWidth={2.5}
          />
        </div>

        {/* Calendar Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 w-[min(calc(100vw-2rem),360px)] md:w-[360px] bg-[#1F1F1F] border-2 border-[#333] rounded-2xl overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="inline-flex items-center justify-center rounded-full transition-all duration-300 bg-[rgba(57,255,20,0.1)] text-[#39FF14] border-2 border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.2)] active:opacity-80 p-2"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              </button>
              
              <div className="flex items-center justify-center gap-2">
                <div className="relative inline-block" ref={monthDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                    className="inline-flex items-center gap-1 font-semibold text-white hover:text-[#39FF14] transition-colors cursor-pointer"
                  >
                    {monthName}
                    <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isMonthDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsMonthDropdownOpen(false)}
                      />
                      <div className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2 w-40 max-h-48 overflow-y-auto bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl py-2">
                        {months.map((month, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleMonthSelect(index)}
                            className={`w-full px-4 py-2 text-left transition-colors ${
                              index === currentMonth.getMonth()
                                ? 'bg-primary-500/20 text-primary-500 font-semibold'
                                : 'text-white hover:bg-[#333]'
                            }`}
                          >
                            {month}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="relative inline-block" ref={yearDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                    className="inline-flex items-center gap-1 font-semibold text-white hover:text-[#39FF14] transition-colors cursor-pointer"
                  >
                    {year}
                    <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isYearDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsYearDropdownOpen(false)}
                      />
                      <div className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2 w-32 max-h-48 overflow-y-auto bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl py-2">
                        {years.map((y) => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => handleYearSelect(y)}
                            className={`w-full px-4 py-2 text-left transition-colors ${
                              y === year
                                ? 'bg-primary-500/20 text-primary-500 font-semibold'
                                : 'text-white hover:bg-[#333]'
                            }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleNextMonth}
                className="inline-flex items-center justify-center rounded-full transition-all duration-300 bg-[rgba(57,255,20,0.1)] text-[#39FF14] border-2 border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.2)] active:opacity-80 p-2"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Day Names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-[#9CA3AF] py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Actual days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const selected = isDateSelected(day)
                  const today = isToday(day)
                  const disabled = isDateDisabled(day)

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => !disabled && handleDateSelect(day)}
                      disabled={disabled}
                      className={cn(
                        'aspect-square rounded-lg font-medium transition-all duration-200',
                        'flex items-center justify-center',
                        disabled && 'opacity-30 cursor-not-allowed',
                        !disabled && !selected && 'hover:bg-[#404040] text-white',
                        !disabled && selected && 'bg-[#39FF14] text-black font-bold',
                        !disabled && !selected && today && 'border-2 border-[#39FF14] text-[#39FF14]'
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
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
DatePicker.displayName = 'DatePicker'

// Radio Component - Custom branded radio button
interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  error?: string
  helperText?: string
}

