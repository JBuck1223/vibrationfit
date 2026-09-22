'use client'

import React from 'react'
import { cn } from '../shared-utils'
import { fieldControlClass, fieldErrorClass } from './field-styles'
import { scrollSafeAutoResize } from './auto-resize-utils'

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

    const doResize = React.useCallback(() => {
      if (textareaRef.current) {
        scrollSafeAutoResize(textareaRef.current, { minHeight, maxHeight })
      }
    }, [minHeight, maxHeight])

    React.useEffect(() => {
      doResize()
    }, [value, doResize])

    React.useEffect(() => {
      doResize()
    }, [doResize])

    React.useEffect(() => {
      const textarea = textareaRef.current
      if (!textarea) return

      const resizeObserver = new ResizeObserver(() => {
        doResize()
      })

      resizeObserver.observe(textarea)

      return () => {
        resizeObserver.disconnect()
      }
    }, [doResize])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
      scrollSafeAutoResize(e.target, { minHeight, maxHeight })
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
              fieldControlClass,
              'resize-none',
              error && fieldErrorClass,
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
