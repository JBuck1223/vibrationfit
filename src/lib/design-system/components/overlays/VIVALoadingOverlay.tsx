'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../shared-utils'

interface VIVALoadingOverlayProps {
  isVisible: boolean
  message?: string
  messages?: string[]
  cycleDuration?: number
  estimatedTime?: string
  estimatedDuration?: number
  progress?: number
  size?: 'sm' | 'md' | 'lg'
}

export const VIVALoadingOverlay: React.FC<VIVALoadingOverlayProps> = ({
  isVisible,
  message = 'VIVA is working...',
  messages,
  cycleDuration,
  estimatedTime,
  estimatedDuration,
  progress,
  size
}) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">{message}</p>
      </div>
    </div>
  )
}
