'use client'

import React from 'react'
import { Card, StatusBadge, VersionBadge } from '@/lib/design-system/components'
import { colors } from '@/lib/design-system/tokens'
import { CalendarDays } from 'lucide-react'

interface VisionVersionCardProps {
  version: {
    id: string
    version_number: number
    is_draft: boolean
    is_active: boolean
    completion_percent: number
    created_at: string
    household_id?: string | null
    isDraft?: boolean  // For display override
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
  // Check the database is_draft field, not deprecated isDraft property
  const isDraftVersion = version.is_draft === true
  
  // Determine the actual status to display based on is_active and is_draft flags
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
        <div className="flex-1">
          <div className="flex flex-col items-center md:items-start gap-2 text-sm">
            {/* Badges Row */}
            <div className="flex flex-col md:flex-row items-center gap-2">
              <VersionBadge 
                versionNumber={version.version_number} 
                status={displayStatus}
                isHouseholdVision={!!version.household_id}
              />
              <StatusBadge 
                status={displayStatus} 
                subtle={displayStatus !== 'active'}
                className="uppercase tracking-[0.25em]"
              />
            </div>
            
            {/* Date Row */}
            <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
              <CalendarDays className="w-4 h-4 text-neutral-500" />
              <span className="font-medium">Created:</span>
              <span>{new Date(version.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {actions && (
          <div className="flex flex-row flex-wrap gap-2 w-full md:w-auto justify-center md:justify-end">
            {actions}
          </div>
        )}
      </div>
    </Card>
  )
}


