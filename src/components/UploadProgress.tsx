'use client'

import React from 'react'
import { Card } from '@/lib/design-system/components'

interface UploadProgressProps {
  progress: number
  status: string
  fileName?: string
  fileSize?: number
  isVisible: boolean
}

export function UploadProgress({ 
  progress, 
  status, 
  fileName, 
  fileSize, 
  isVisible 
}: UploadProgressProps) {
  if (!isVisible) return null

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Uploading...</h3>
          <span className="text-sm font-medium text-primary-500">{Math.round(progress)}%</span>
        </div>

        {/* File Info */}
        {fileName && (
          <div className="space-y-1">
            <p className="text-sm text-neutral-300 font-medium truncate" title={fileName}>
              {fileName}
            </p>
            {fileSize && (
              <p className="text-xs text-neutral-400">
                {formatFileSize(fileSize)}
              </p>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-neutral-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Status Text */}
          <p className="text-sm text-neutral-400 text-center">
            {status}
          </p>
        </div>

        {/* Animated Dots */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </Card>
  )
}