'use client'

import React from 'react'
import { Badge } from '@/lib/design-system/components'
import { CheckCircle, Clock, Edit3, GitBranch } from 'lucide-react'

// ============================================================================
// Version Status Indicator Component
// ============================================================================

interface VersionStatusIndicatorProps {
  isActive: boolean
  isDraft: boolean
  versionNumber: number
  completionPercentage: number
  className?: string
  showIcon?: boolean
  showCompletion?: boolean
}

export const VersionStatusIndicator: React.FC<VersionStatusIndicatorProps> = ({
  isActive,
  isDraft,
  versionNumber,
  completionPercentage,
  className = '',
  showIcon = true,
  showCompletion = true
}) => {
  const getStatusInfo = () => {
    if (isActive) {
      return {
        label: 'Active',
        variant: 'success' as const,
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'text-green-400'
      }
    }
    
    if (isDraft) {
      return {
        label: 'Draft',
        variant: 'warning' as const,
        icon: <Edit3 className="w-4 h-4" />,
        color: 'text-yellow-400'
      }
    }
    
    return {
      label: 'Complete',
      variant: 'info' as const,
      icon: <Clock className="w-4 h-4" />,
      color: 'text-blue-400'
    }
  }

  const status = getStatusInfo()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <div className={status.color}>
          {status.icon}
        </div>
      )}
      
      <Badge variant={status.variant} className="text-xs">
        {status.label}
      </Badge>
      
      <span className="text-sm text-neutral-400">
        v{versionNumber}
      </span>
      
      {showCompletion && (
        <div className="flex items-center gap-1 text-sm text-neutral-500">
          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
          <span>{completionPercentage}%</span>
        </div>
      )}
    </div>
  )
}

export default VersionStatusIndicator
