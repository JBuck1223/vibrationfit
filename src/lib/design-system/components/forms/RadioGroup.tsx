'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { Radio } from './Radio'
Radio.displayName = 'Radio'

// RadioGroup Component - Container for multiple radio buttons
interface RadioGroupProps {
  label?: string
  name: string
  value?: string | number | boolean
  onChange?: (value: string | number | boolean) => void
  options: Array<{ value: string | number | boolean; label: string }>
  error?: string
  helperText?: string
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ label, name, value, onChange, options, error, helperText, className = '', orientation = 'horizontal' }, ref) => {
    return (
      <div ref={ref} className={className}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-neutral-200 mb-3">
            {label}
          </label>
        )}
        
        {/* Radio Options */}
        <div className={`flex ${orientation === 'horizontal' ? 'flex-row gap-3' : 'flex-col gap-3'}`}>
          {options.map((option, index) => {
            const optionId = `${name}-${index}`
            const isChecked = value === option.value
            
            return (
              <Radio
                key={optionId}
                id={optionId}
                name={name}
                label={option.label}
                checked={isChecked}
                onChange={() => onChange?.(option.value)}
                className={orientation === 'horizontal' ? '' : 'flex-1'}
              />
            )
          })}
        </div>
        
        {/* Error Message */}
        {error && (
          <p className="mt-2 text-sm text-[#FF0040]">{error}</p>
        )}
        
        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-2 text-sm text-neutral-400">{helperText}</p>
        )}
      </div>
    )
  }
)
RadioGroup.displayName = 'RadioGroup'
