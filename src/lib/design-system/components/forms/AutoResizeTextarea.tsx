'use client'

import React, { useRef, useEffect } from 'react'
import { cn } from '../shared-utils'
// Auto-Resize Textarea Component
interface AutoResizeTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string
  error?: string
  helperText?: string
  value: string
  onChange: (value: string) => void
  minHeight?: number
  maxHeight?: number
}

export const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ label, error, helperText, className = '', value, onChange, minHeight = 120, maxHeight = 400, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const combinedRef = React.useMemo(() => {
      if (ref) {
        if (typeof ref === 'function') {
          return (node: HTMLTextAreaElement | null) => {
            textareaRef.current = node
            ref(node)
          }
        } else {
          ref.current = textareaRef.current
          return textareaRef
        }
      }
      return textareaRef
    }, [ref])

    const autoResize = React.useCallback(() => {
      if (textareaRef.current) {
        // Reset height to auto to get the natural height
        textareaRef.current.style.height = 'auto'
        // Get the scroll height (content height)
        const scrollHeight = textareaRef.current.scrollHeight
        // Set height to content height (no maxHeight limit!)
        const newHeight = Math.max(scrollHeight, minHeight)
        textareaRef.current.style.height = `${newHeight}px`
        
        // Always keep overflow hidden since we're expanding to full content
        textareaRef.current.style.overflowY = 'hidden'
      }
    }, [minHeight])

    // Auto-resize when value changes
    React.useEffect(() => {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        autoResize()
      })
    }, [value, autoResize])

    // Also auto-resize on mount
    React.useEffect(() => {
      autoResize()
    }, [autoResize])

    // Auto-resize when container width changes (e.g., grid toggles)
    React.useEffect(() => {
      const textarea = textareaRef.current
      if (!textarea) return

      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          autoResize()
        })
      })

      resizeObserver.observe(textarea)

      return () => {
        resizeObserver.disconnect()
      }
    }, [autoResize])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
      // Use requestAnimationFrame for smoother resize
      requestAnimationFrame(() => {
        autoResize()
      })
    }

    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="block text-sm font-medium text-[#E5E7EB]">
            {label}
          </label>
        )}
        <textarea
          ref={combinedRef}
          value={value}
          onChange={handleChange}
            className={cn(
              'w-full px-4 py-3 bg-[#404040] border-2 rounded-xl text-white placeholder-[#9CA3AF]',
              'focus:outline-none transition-all duration-200 resize-none',
              error 
                ? 'border-[#FF0040] focus:border-[#FF0040]' 
                : 'border-[#666666] focus:border-[#39FF14]',
              className
            )}
          style={{ minHeight: `${minHeight}px` }}
          {...props}
        />
        {error && (
          <p className="text-sm text-[#FF0040]">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-[#9CA3AF]">{helperText}</p>
        )}
      </div>
    )
  }
)
AutoResizeTextarea.displayName = 'AutoResizeTextarea'
