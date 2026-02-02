'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../shared-utils'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string
  error?: string
  helperText?: string
  onCheckedChange?: (checked: boolean) => void
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, onCheckedChange, onChange, className = '', ...props }, ref) => {
    const id = React.useId()
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked)
      }
      if (onChange) {
        onChange(e)
      }
    }
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <label htmlFor={id} className="relative flex items-center cursor-pointer">
            <input
              ref={ref}
              id={id}
              type="checkbox"
              className="sr-only peer"
              onChange={handleChange}
              {...props}
            />
            <div className={cn(
              'w-6 h-6 rounded-lg border-2 transition-all duration-200',
              'peer-checked:bg-[#39FF14] peer-checked:border-[#39FF14]',
              error ? 'border-[#FF0040]' : 'border-[#666666]'
            )} />
            <Check 
              className={cn(
                'w-4 h-4 text-black absolute left-1 top-1',
                'opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none'
              )}
              strokeWidth={3}
            />
          </label>
          {label && (
            <label 
              htmlFor={id}
              className="text-sm text-[#E5E7EB] cursor-pointer"
            >
              {label}
            </label>
          )}
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
Checkbox.displayName = 'Checkbox'
