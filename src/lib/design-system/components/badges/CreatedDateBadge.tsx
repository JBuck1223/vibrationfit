'use client'

import React from 'react'
import { cn } from '../shared-utils'

interface CreatedDateBadgeProps {
  createdAt: string | Date
  className?: string
  showTime?: boolean
}

export const CreatedDateBadge: React.FC<CreatedDateBadgeProps> = ({ 
  createdAt, 
  className = '',
  showTime = true 
}) => {
  const date = new Date(createdAt)
  const dateString = date.toLocaleDateString()
  const timeString = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex items-center px-3 py-2 md:px-5 bg-neutral-800/50 border border-neutral-700 rounded-lg">
        <div className="text-xs md:text-sm">
          <p className="text-white font-medium">
            {/* Mobile: date only, Desktop: date + time */}
            <span className="md:hidden">{dateString}</span>
            <span className="hidden md:inline">{showTime ? `${dateString} at ${timeString}` : dateString}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

