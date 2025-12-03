'use client'

import React from 'react'
import { Card, Badge, Heading, Text, StatusBadge } from '@/lib/design-system/components'

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
            <Heading level={4} className="text-white text-sm md:text-base !mb-0 leading-none pb-0 font-bold">
              Version {version.version_number}
            </Heading>
            {version.is_draft && (
              <StatusBadge 
                status="draft" 
                subtle={true} 
                className="uppercase tracking-[0.25em]" 
              />
            )}
            {version.is_active && !version.is_draft && (
              <StatusBadge 
                status="active" 
                subtle={false} 
                className="uppercase tracking-[0.25em]" 
              />
            )}
            {!version.is_active && !version.is_draft && (
              <StatusBadge 
                status="complete" 
                subtle={true} 
                className="uppercase tracking-[0.25em]" 
              />
            )}
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

