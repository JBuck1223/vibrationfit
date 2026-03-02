'use client'

import React from 'react'
import { cn } from '../shared-utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  /** Shown at the start of the input when the field has a value (e.g. "$" for currency) */
  prefix?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, prefix, className = '', ...props }, ref) => {
    const showPrefix = prefix && props.value != null && String(props.value).trim() !== ''
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="block text-sm font-medium text-[#E5E7EB]">
            {label}
          </label>
        )}
        <div className="relative">
          {showPrefix && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-3 text-base bg-[#404040] border-2 rounded-xl text-white placeholder-[#9CA3AF]',
              'focus:outline-none transition-all duration-200',
              showPrefix && 'pl-7',
              error 
                ? 'border-[#FF0040] focus:border-[#FF0040]' 
                : 'border-[#666666] focus:border-[#39FF14]',
              className
            )}
            {...props}
          />
        </div>
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
Input.displayName = 'Input'
