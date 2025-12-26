'use client'

import React from 'react'
import { Home } from 'lucide-react'
import { cn } from '../shared-utils'
import { STATUS_COLORS, type StatusType } from './status-colors'
import * as tokens from '../../tokens'

interface VersionBadgeProps {
  versionNumber: number
  status: StatusType | string
  isHouseholdVision?: boolean
  className?: string
}

export const VersionBadge: React.FC<VersionBadgeProps> = ({ 
  versionNumber, 
  status,
  isHouseholdVision = false,
  className = '' 
}) => {
  // Normalize status to lowercase for matching
  const normalizedStatus = status.toLowerCase() as StatusType
  
  // Get colors from STATUS_COLORS, default to neutral if status not found
  const statusColors = STATUS_COLORS[normalizedStatus] || {
    bg: tokens.colors.neutral[600],
    text: '#FFFFFF',
  }

  return (
    <div className="flex items-center gap-1.5">
      <span 
        className={cn(
          'w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold',
          className
        )}
        style={{
          backgroundColor: statusColors.bg,
          color: statusColors.text,
        }}
      >
        V{versionNumber}
      </span>
      {isHouseholdVision && (
        <Home className="w-4 h-4 text-secondary-500" />
      )}
    </div>
  )
}

