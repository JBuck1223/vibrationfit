'use client'

import React, { useId } from 'react'
import { cn } from '../shared-utils'

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  error?: string
  helperText?: string
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const generatedId = useId()
    const radioId = id || generatedId
    
    return (
      <div className={className}>
        <label 
          htmlFor={radioId}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="relative flex-shrink-0">
            <input
              ref={ref}
              type="radio"
              id={radioId}
              className="sr-only peer"
              {...props}
            />
            <div className="w-5 h-5 rounded-full border-2 border-[#666666] bg-[#404040] peer-checked:border-[#39FF14] transition-all duration-200 group-hover:border-[#39FF14]/60 relative">
              <div className={`absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-[#39FF14] transition-opacity duration-200 ${props.checked ? 'opacity-100' : 'opacity-0'}`} />
            </div>
          </div>
          
          {label && (
            <span className={`text-base text-white group-hover:text-[#39FF14]/80 transition-colors ${
              props.disabled ? 'text-neutral-500 cursor-not-allowed' : ''
            }`}>
              {label}
            </span>
          )}
        </label>
        
        {error && (
          <p className="mt-1 text-sm text-[#FF0040]">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="mt-1 text-sm text-neutral-400">{helperText}</p>
        )}
      </div>
    )
  }
)
Radio.displayName = 'Radio'
