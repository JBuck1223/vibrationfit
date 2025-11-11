'use client'

import React from 'react'
import { Card, Badge, Heading, Text } from '@/lib/design-system/components'
import { colors } from '@/lib/design-system/tokens'
import { CheckCircle } from 'lucide-react'

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
            {/* Version Circle - color matches badge */}
            {isDraftVersion ? (
              <span className="w-7 h-7 flex items-center justify-center text-black rounded-full text-xs font-semibold" style={{ backgroundColor: NEON_YELLOW }}>
                V{version.version_number}
              </span>
            ) : version.status === 'complete' && isActive ? (
              <span className="w-7 h-7 flex items-center justify-center bg-[#39FF14] text-black rounded-full text-xs font-semibold">
                V{version.version_number}
              </span>
            ) : (
              <span className="w-7 h-7 flex items-center justify-center bg-blue-500 text-white rounded-full text-xs font-semibold">
                V{version.version_number}
              </span>
            )}
            
            {/* Created Date Badge */}
            <div className="flex items-center px-3 py-2 md:px-5 bg-neutral-800/50 border border-neutral-700 rounded-lg">
              <span className="text-xs md:text-sm text-white font-medium">
                {/* Mobile: date only, Desktop: date + time */}
                <span className="md:hidden">{new Date(version.created_at).toLocaleDateString()}</span>
                <span className="hidden md:inline">{new Date(version.created_at).toLocaleDateString()} at {new Date(version.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              </span>
            </div>
            
            {isDraftVersion && (
              <Badge variant="warning" style={{ backgroundColor: `${NEON_YELLOW}33`, color: NEON_YELLOW }}>
                Draft
              </Badge>
            )}
            {version.status === 'draft' && !isDraftVersion && (
              <Badge variant="warning">
                Draft
              </Badge>
            )}
            {version.status === 'complete' && isActive && !isDraftVersion && (
              <Badge variant="success" className="!bg-[#39FF14] !text-black !border-[#39FF14]">
                <CheckCircle className="w-4 h-4 mr-1 !text-black" />
                Active
              </Badge>
            )}
            {version.status === 'complete' && !isActive && !isDraftVersion && (
              <Badge variant="info">
                Complete
              </Badge>
            )}
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


