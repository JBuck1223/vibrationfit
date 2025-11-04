'use client'

import React from 'react'
import { Card, Badge, Heading, Text } from '@/lib/design-system/components'

interface VisionVersionCardProps {
  version: {
    id: string
    version_number: number
    status: 'draft' | 'complete' | string
    completion_percent: number
    created_at: string
  }
  isActive?: boolean
  actions?: React.ReactNode
  className?: string
}

export const VisionVersionCard: React.FC<VisionVersionCardProps> = ({
  version,
  isActive = false,
  actions,
  className = ''
}) => {
  return (
    <Card variant="outlined" className={`p-3 md:p-4 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        {/* Version Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Heading level={4} className="text-white text-base md:text-lg !mb-0 leading-none pb-0 font-bold">
              Version {version.version_number}
            </Heading>
            {version.status === 'draft' && (
              <Badge variant="warning">
                Draft
              </Badge>
            )}
            {version.status === 'complete' && isActive && (
              <Badge variant="success">
                Active
              </Badge>
            )}
            {version.status === 'complete' && !isActive && (
              <Badge variant="info">
                Complete
              </Badge>
            )}
            <Badge variant="success" className="px-1 text-xs">
              {version.completion_percent || 0}%
            </Badge>
          </div>
          
          <div className="space-y-1">
            <Text size="sm" className="text-neutral-400">
              <span className="font-medium">Created:</span> {new Date(version.created_at).toLocaleDateString()} at {new Date(version.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </Text>
            <Text size="xs" className="text-neutral-500 font-mono truncate">
              ID: {version.id}
            </Text>
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


