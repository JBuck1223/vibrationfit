import { Video } from '@/lib/design-system'
import { useLazyVideo } from '@/hooks/useLazyLoading'
import { useState, useEffect } from 'react'

interface OptimizedVideoProps {
  src: string
  trackingId: string
  className?: string
  quality?: 'auto' | 'high' | 'medium' | 'low'
  saveProgress?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  poster?: string
}

export function OptimizedVideo({
  src,
  trackingId,
  className = '',
  quality = 'auto',
  saveProgress = false,
  preload = 'metadata',
  poster
}: OptimizedVideoProps) {
  const { elementRef, shouldLoad, videoLoaded, videoError } = useLazyVideo(src, {
    rootMargin: '200px', // Start loading earlier for videos
    threshold: 0.1,
    triggerOnce: true
  })

  const [isLoading, setIsLoading] = useState(true)
  const [showPoster, setShowPoster] = useState(true)

  // Generate poster from video if not provided
  useEffect(() => {
    if (!poster && shouldLoad) {
      // Create a canvas to capture video frame
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.preload = 'metadata'
      
      video.onloadedmetadata = () => {
        video.currentTime = 1 // Seek to 1 second
      }
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          const posterUrl = canvas.toDataURL('image/jpeg', 0.8)
          setPoster(posterUrl)
        }
      }
      
      video.src = src
    }
  }, [src, poster, shouldLoad])

  // Show loading state
  if (!shouldLoad || (!videoLoaded && !videoError)) {
    return (
      <div
        ref={elementRef}
        className={`bg-neutral-800 animate-pulse rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="text-center text-neutral-500">
          <div className="w-12 h-12 bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-sm">Loading video...</div>
        </div>
      </div>
    )
  }

  // Show error state
  if (videoError) {
    return (
      <div
        className={`bg-neutral-800 rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="text-center text-neutral-500">
          <div className="text-sm">Failed to load video</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative group ${className}`}>
      <Video
        src={src}
        trackingId={trackingId}
        quality={quality}
        saveProgress={saveProgress}
        preload={preload}
        poster={poster}
        className="w-full h-full"
        onLoadStart={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <div className="text-center text-white">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <div className="text-sm">Loading...</div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Get optimal video quality based on connection speed
 */
export function getOptimalVideoQuality(): 'auto' | 'high' | 'medium' | 'low' {
  if (typeof navigator === 'undefined') return 'auto'
  
  // Check connection speed if available
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  if (connection) {
    const effectiveType = connection.effectiveType
    
    switch (effectiveType) {
      case '4g':
        return 'high'
      case '3g':
        return 'medium'
      case '2g':
        return 'low'
      default:
        return 'auto'
    }
  }
  
  return 'auto'
}

/**
 * Generate multiple video qualities for adaptive streaming
 */
export function generateVideoQualities(baseSrc: string): {
  high: string
  medium: string
  low: string
} {
  // This would typically involve generating multiple versions during upload
  // For now, return the same source for all qualities
  return {
    high: baseSrc,
    medium: baseSrc,
    low: baseSrc
  }
}
