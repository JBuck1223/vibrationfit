'use client'

import React, { useEffect, useState } from 'react'
import { Card, Spinner } from '@/lib/design-system'

interface VideoProcessingOverlayProps {
  videoKey: string
  originalUrl: string
  onProcessed?: (processedUrl: string) => void
}

export const VideoProcessingOverlay: React.FC<VideoProcessingOverlayProps> = ({
  videoKey,
  originalUrl,
  onProcessed
}) => {
  const [checking, setChecking] = useState(false)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)

  // Extract the base filename without extension
  const baseFilename = videoKey.split('/').pop()?.replace(/\.[^/.]+$/, '') || ''
  
  // Construct the expected processed URL (720p version)
  // Format: user-uploads/{userId}/{folder}/processed/{baseFilename}-720p.mp4
  const processedUrlPattern = originalUrl.replace(/\.[^/.]+$/, '-720p.mp4').replace('/uploads/', '/processed/')

  useEffect(() => {
    async function checkForProcessedVideo() {
      setChecking(true)
      console.log('🔍 Checking for processed video:', processedUrlPattern)

      // Poll for processed video (check every 5 seconds)
      const maxAttempts = 60 // 5 minutes max
      let attempts = 0

      const pollInterval = setInterval(async () => {
        attempts++
        console.log(`🔍 Polling attempt ${attempts}/${maxAttempts}`)

        try {
          const response = await fetch(processedUrlPattern, { method: 'HEAD' })
          
          if (response.ok) {
            console.log('✅ Processed video found!', processedUrlPattern)
            setProcessedUrl(processedUrlPattern)
            setChecking(false)
            clearInterval(pollInterval)
            
            if (onProcessed) {
              onProcessed(processedUrlPattern)
            }
          }
        } catch (error) {
          console.log(`⚠️ Attempt ${attempts}: Video not ready yet`)
        }

        if (attempts >= maxAttempts) {
          console.log('⏱️ Timeout: Video processing taking longer than expected')
          setChecking(false)
          clearInterval(pollInterval)
          // Fallback to original video
          setProcessedUrl(null)
        }
      }, 5000) // Check every 5 seconds

      return () => clearInterval(pollInterval)
    }

    checkForProcessedVideo()
  }, [processedUrlPattern, onProcessed])

  // Show processing overlay while checking
  if (checking && !processedUrl) {
    return (
      <Card variant="elevated" className="relative">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
          <div className="text-center space-y-4">
            {/* VIVA Logo/Icon */}
            <div className="w-20 h-20 mx-auto">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">V</span>
              </div>
            </div>
            
            {/* Processing Text */}
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">
                VIVA is processing your video!
              </h3>
              <p className="text-neutral-300 text-lg">
                Creating optimized version for fast playback...
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2">
              <Spinner size="md" variant="primary" />
              <span className="text-neutral-400 text-sm">
                This may take a few minutes
              </span>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Return null when processed (parent will show the video)
  return null
}

