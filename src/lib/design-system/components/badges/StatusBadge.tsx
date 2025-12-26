'use client'

import React from 'react'
import { CheckCircle } from 'lucide-react'
import { cn } from '../shared-utils'
import { STATUS_COLORS, type StatusType } from './status-colors'
import * as tokens from '../../tokens'

interface StatusBadgeProps {
  status: StatusType | string
  className?: string
  subtle?: boolean // Use subtle styling (transparent background)
  showIcon?: boolean // Show status icon (checkmark for active, etc.)
  label?: string // Override display text (e.g., use "IN PROGRESS" instead of "DRAFT")
  children?: React.ReactNode // Override display text via children
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className = '',
  subtle = true,
  showIcon = true,
  label,
  children
}) => {
  // Normalize status to lowercase for matching
  const normalizedStatus = status.toLowerCase() as StatusType
  
  // Get colors from STATUS_COLORS, default to neutral if status not found
  const statusColors = STATUS_COLORS[normalizedStatus] || {
    bg: tokens.colors.neutral[600],
    text: '#FFFFFF',
    border: tokens.colors.neutral[600],
    bgSubtle: 'rgba(75, 85, 99, 0.2)',
    textSubtle: tokens.colors.neutral[400],
    borderSubtle: 'rgba(75, 85, 99, 0.3)',
  }
  
  // Determine display text: children > label > capitalize status
  const displayText = children || label || (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase())

  const styles = subtle ? {
    backgroundColor: statusColors.bgSubtle,
    color: statusColors.textSubtle,
    borderColor: statusColors.borderSubtle,
  } : {
    backgroundColor: statusColors.bg,
    color: statusColors.text,
    borderColor: statusColors.border,
  }

  // Get icon for status - only show checkmark for Active
  const getStatusIcon = () => {
    if (!showIcon) return null
    
    const iconColor = subtle ? statusColors.textSubtle : statusColors.text
    
    // Only show icon for active status
    if (normalizedStatus === 'active') {
      return <CheckCircle className="w-4 h-4 mr-1" style={{ color: iconColor }} />
    }
    
    return null
  }

  // Add extra padding when wide letter spacing is used for optical balance
  // Letter-spacing adds space after the last character, so we compensate with negative margin
  const hasWideTracking = className.includes('tracking-')
  
  return (
    <span 
      className={cn(
        'inline-flex items-center justify-center py-1 rounded-full text-xs md:text-sm font-semibold border',
        hasWideTracking ? 'pl-4 pr-3' : 'px-3',
        className
      )}
      style={styles}
    >
      {getStatusIcon()}
      {displayText}
    </span>
  )
}

