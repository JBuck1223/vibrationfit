'use client'

import React from 'react'
import { Card, StatusBadge, VersionBadge, CreatedDateBadge } from '@/lib/design-system/components'
import { colors } from '@/lib/design-system/tokens'

interface VisionVersionCardProps {
  version: {
    id: string
    version_number: number
    status: 'draft' | 'complete' | string
    completion_percent: number
    created_at: string
    isDraft?: boolean
    draftCategories?: number
    totalCategories?: number
  }
  isActive?: boolean
  actions?: React.ReactNode
  className?: string
}

const NEON_YELLOW = colors.energy.yellow[500]

export const VisionVersionCard: React.FC<VisionVersionCardProps> = ({
  version,
  isActive = false,
  actions,
  className = ''
}) => {
  const isDraftVersion = version.id?.startsWith('draft-') || version.isDraft
  
  // Determine the actual status to display
  const displayStatus = isDraftVersion ? 'draft' : (isActive && version.status === 'complete') ? 'active' : version.status
  
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
          <div className="flex items-center gap-2 flex-wrap">
            {/* Version Badge - color matches status */}
            <VersionBadge 
              versionNumber={version.version_number} 
              status={displayStatus} 
            />
            
            {/* Created Date Badge */}
            <CreatedDateBadge createdAt={version.created_at} />
            
            {/* Status Badge - Active gets solid bright green, others get subtle */}
            <StatusBadge 
              status={displayStatus} 
              subtle={displayStatus !== 'active'}
            />
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


