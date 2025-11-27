'use client'

import React from 'react'
import { Card, StatusBadge, VersionBadge, CreatedDateBadge } from '@/lib/design-system/components'
import { colors } from '@/lib/design-system/tokens'
import { Trash2 } from 'lucide-react'

interface VisionVersionCardProps {
  version: {
    id: string
    version_number: number
    is_draft: boolean
    is_active: boolean
    completion_percent: number
    created_at: string
    isDraft?: boolean  // For display override
    draftCategories?: number
    totalCategories?: number
  }
  isActive?: boolean
  actions?: React.ReactNode
  onDelete?: (versionId: string) => void
  className?: string
}

const NEON_YELLOW = colors.energy.yellow[500]

export const VisionVersionCard: React.FC<VisionVersionCardProps> = ({
  version,
  isActive = false,
  actions,
  onDelete,
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
      className={`p-3 md:p-4 relative ${className}`}
      onClick={(e) => {
        // Prevent any click events from bubbling up
        e.stopPropagation()
      }}
    >
      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(version.id)
          }}
          className="absolute top-2 right-2 p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Delete version"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        {/* Version Info */}
        <div className="flex-1">
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
            />
            
            {/* Date as plain text */}
            <span className="text-neutral-300">
              Created: {new Date(version.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
            </span>
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


