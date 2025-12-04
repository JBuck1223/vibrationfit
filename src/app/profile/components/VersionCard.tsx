'use client'

import React from 'react'
import { Card, Text, StatusBadge, VersionBadge } from '@/lib/design-system/components'
import { CalendarDays } from 'lucide-react'

interface VersionCardProps {
  version: {
    id: string
    version_number: number
    is_draft: boolean
    is_active: boolean
    created_at: string
  }
  actions?: React.ReactNode
  className?: string
}

export const VersionCard: React.FC<VersionCardProps> = ({
  version,
  actions,
  className = ''
}) => {
  // Determine the actual status to display
  const getDisplayStatus = () => {
    if (version.is_active && !version.is_draft) return 'active'
    if (version.is_draft) return 'draft'
    return 'complete'
  }
  
  const displayStatus = getDisplayStatus()
  
  return (
    <Card 
      variant="outlined" 
      className={`p-3 md:p-4 ${className}`}
      onClick={(e) => {
        // Prevent any click events from bubbling up
        e.stopPropagation()
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        {/* Version Info */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-2 text-sm">
            {/* Version Badge */}
            <VersionBadge 
              versionNumber={version.version_number} 
              status={displayStatus} 
            />
            
            {/* Status Badge */}
            <StatusBadge 
              status={displayStatus} 
              subtle={displayStatus !== 'active'}
              className="uppercase tracking-[0.25em]"
            />
            
            {/* Date with icon */}
            <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
              <CalendarDays className="w-4 h-4 text-neutral-500" />
              <span className="font-medium">Created:</span>
              <span>{new Date(version.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {actions && (
          <div className="flex flex-row flex-wrap gap-2 w-full md:w-auto md:justify-end">
            {actions}
          </div>
        )}
      </div>
    </Card>
  )
}

