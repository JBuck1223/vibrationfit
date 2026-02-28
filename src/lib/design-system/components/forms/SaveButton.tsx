'use client'

import React from 'react'
import { CheckCircle, Save, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '../shared-utils'
import * as tokens from '../../tokens'

interface SaveButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  hasUnsavedChanges?: boolean
  isSaving?: boolean
  saveError?: string | null
}

export const SaveButton = React.forwardRef<HTMLButtonElement, SaveButtonProps>(
  ({ hasUnsavedChanges = false, isSaving = false, saveError, disabled, className = '', ...props }, ref) => {
    const primaryGreen = tokens.colors.primary[500]
    const black = tokens.colors.neutral[0]
    const lightGreenBg = `rgba(57, 255, 20, 0.15)`
    const lightGreenBorder = `rgba(57, 255, 20, 0.4)`
    const transparent = 'transparent'

    const [justSaved, setJustSaved] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const prevSavingRef = React.useRef(isSaving)

    React.useEffect(() => {
      if (prevSavingRef.current && !isSaving && !hasUnsavedChanges && !saveError) {
        setJustSaved(true)
        const timer = setTimeout(() => setJustSaved(false), 2500)
        return () => clearTimeout(timer)
      }
      prevSavingRef.current = isSaving
    }, [isSaving, hasUnsavedChanges, saveError])
    
    const baseClasses = cn(
      'inline-flex items-center justify-center gap-2',
      'px-4 py-3 text-sm md:px-7 md:py-3',
      'font-semibold',
      'border-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'whitespace-nowrap',
      className
    )
    
    const savedStyle: React.CSSProperties = {
      backgroundColor: lightGreenBg,
      color: primaryGreen,
      borderColor: lightGreenBorder,
      borderRadius: tokens.borderRadius.full,
      transition: `all ${tokens.durations[300]} ${tokens.easings['in-out']}`
    }

    const justSavedStyle: React.CSSProperties = {
      backgroundColor: `rgba(57, 255, 20, 0.25)`,
      color: primaryGreen,
      borderColor: primaryGreen,
      borderRadius: tokens.borderRadius.full,
      transition: `all ${tokens.durations[300]} ${tokens.easings['in-out']}`,
      boxShadow: `0 0 12px rgba(57, 255, 20, 0.3)`
    }
    
    const saveStyle: React.CSSProperties = {
      backgroundColor: primaryGreen,
      color: black,
      borderColor: transparent,
      borderRadius: tokens.borderRadius.full,
      transition: `all ${tokens.durations[300]} ${tokens.easings['in-out']}`
    }

    const savingStyle: React.CSSProperties = {
      backgroundColor: `rgba(57, 255, 20, 0.6)`,
      color: black,
      borderColor: transparent,
      borderRadius: tokens.borderRadius.full,
      transition: `all ${tokens.durations[300]} ${tokens.easings['in-out']}`
    }

    const errorStyle: React.CSSProperties = {
      backgroundColor: `rgba(255, 0, 64, 0.15)`,
      color: '#FF4060',
      borderColor: `rgba(255, 0, 64, 0.4)`,
      borderRadius: tokens.borderRadius.full,
      transition: `all ${tokens.durations[300]} ${tokens.easings['in-out']}`
    }

    let currentStyle: React.CSSProperties
    let content: React.ReactNode

    if (saveError && hasUnsavedChanges) {
      currentStyle = errorStyle
      content = (
        <>
          <AlertCircle className="w-4 h-4" />
          Retry Save
        </>
      )
    } else if (isSaving) {
      currentStyle = savingStyle
      content = (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </>
      )
    } else if (justSaved) {
      currentStyle = justSavedStyle
      content = (
        <>
          <CheckCircle className="w-4 h-4" />
          Saved
        </>
      )
    } else if (hasUnsavedChanges) {
      currentStyle = isHovered ? savedStyle : saveStyle
      content = (
        <>
          <Save className="w-4 h-4" />
          Save
        </>
      )
    } else {
      currentStyle = savedStyle
      content = (
        <>
          <CheckCircle className="w-4 h-4" />
          Saved
        </>
      )
    }

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
        {content}
      </button>
    )
  }
)
SaveButton.displayName = 'SaveButton'
