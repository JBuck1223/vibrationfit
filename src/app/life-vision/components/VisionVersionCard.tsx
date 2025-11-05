'use client'

import React from 'react'
import { Card, Badge, Heading, Text } from '@/lib/design-system/components'
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
  
  return (
    <Card 
      variant="outlined" 
      className={`p-3 md:p-4 ${className}`}
      style={isDraftVersion ? { border: `2px solid ${NEON_YELLOW}` } : undefined}
      onClick={(e) => {
        // Prevent any click events from bubbling up
        e.stopPropagation()
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        {/* Version Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Heading level={4} className="text-white text-sm md:text-base !mb-0 leading-none pb-0 font-bold">
              {isDraftVersion ? 'Draft Vision' : `Version ${version.version_number}`}
            </Heading>
            {isDraftVersion && (
              <Badge variant="warning" style={{ backgroundColor: `${NEON_YELLOW}33`, color: NEON_YELLOW }}>
                Draft Preview
              </Badge>
            )}
            {version.status === 'draft' && !isDraftVersion && (
              <Badge variant="warning">
                Draft
              </Badge>
            )}
            {version.status === 'complete' && isActive && !isDraftVersion && (
              <Badge variant="success">
                Active
              </Badge>
            )}
            {version.status === 'complete' && !isActive && !isDraftVersion && (
              <Badge variant="info">
                Complete
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            <Text size="sm" className="text-neutral-400">
              <span className="font-medium">Created:</span> {new Date(version.created_at).toLocaleDateString()} at {new Date(version.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </Text>
            {!isDraftVersion && (
              <Text size="xs" className="text-neutral-500 font-mono truncate">
                ID: {version.id}
              </Text>
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


