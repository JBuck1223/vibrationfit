'use client'

import React from 'react'
import { CheckCircle, Save } from 'lucide-react'
import { cn } from '../shared-utils'
import * as tokens from '../../tokens'

interface SaveButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  hasUnsavedChanges?: boolean
  isSaving?: boolean
}

export const SaveButton = React.forwardRef<HTMLButtonElement, SaveButtonProps>(
  ({ hasUnsavedChanges = false, isSaving = false, disabled, className = '', ...props }, ref) => {
    const primaryGreen = tokens.colors.primary[500]
    const black = tokens.colors.neutral[0]
    const lightGreenBg = `rgba(57, 255, 20, 0.1)`
    const lightGreenBorder = `rgba(57, 255, 20, 0.2)`
    const transparent = 'transparent'
    
    const baseClasses = cn(
      'inline-flex items-center justify-center gap-2',
      'px-4 py-3 text-sm md:px-7 md:py-3',
      'font-semibold',
      'border-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'whitespace-nowrap',
      className
    )
    
    const savedStyle = {
      backgroundColor: lightGreenBg,
      color: primaryGreen,
      borderColor: lightGreenBorder,
      borderRadius: tokens.borderRadius.full,
      transition: `all ${tokens.durations[300]} ${tokens.easings['in-out']}`
    }
    
    const saveStyle = {
      backgroundColor: primaryGreen,
      color: black,
      borderColor: transparent,
      borderRadius: tokens.borderRadius.full,
      transition: `all ${tokens.durations[300]} ${tokens.easings['in-out']}`
    }
    
    const [isHovered, setIsHovered] = React.useState(false)
    
    const currentStyle = hasUnsavedChanges 
      ? (isHovered ? savedStyle : saveStyle)
      : savedStyle

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isSaving}
        className={baseClasses}
        style={currentStyle}
        onMouseEnter={() => hasUnsavedChanges && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {!hasUnsavedChanges ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Saved
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </>
        )}
      </button>
    )
  }
)
SaveButton.displayName = 'SaveButton'
