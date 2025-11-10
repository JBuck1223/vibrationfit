'use client'

import { Video } from '@/lib/design-system/components'
import { useEffect, useState, useRef } from 'react'

interface OptimizedVideoProps {
  url: string
  thumbnailUrl?: string
  lazy?: boolean
  context?: 'list' | 'single' | 'hero'
  className?: string
  controls?: boolean
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  // Progress tracking
  trackingId?: string
  saveProgress?: boolean
  // Milestone tracking for marketing
  onMilestoneReached?: (milestone: 25 | 50 | 75 | 95, currentTime: number) => void
  // Analytics callbacks
  onPlay?: () => void
  onPause?: () => void
  onComplete?: () => void
}

/**
 * OptimizedVideo - Intelligent video player with adaptive quality and lazy loading
 * 
 * Features:
 * - Adaptive quality selection based on screen size
 * - Lazy loading for better performance in lists
 * - Network-aware quality switching
 * - Smart preload strategy by context
 * - WebM optimization (serves as-is)
 * 
 * Usage:
 * <OptimizedVideo url={videoUrl} thumbnailUrl={thumbnail} context="list" lazy />
 */
export function OptimizedVideo({ 
  url, 
  thumbnailUrl, 
  lazy = false,
  context = 'single',
  className = '',
  controls = true,
  autoplay = false,
  muted = false,
  loop = false,
  trackingId,
  saveProgress = true,
  onMilestoneReached,
  onPlay,
  onPause,
  onComplete
}: OptimizedVideoProps) {
  const [isVisible, setIsVisible] = useState(!lazy)
  const [quality, setQuality] = useState<'720p' | '1080p' | 'original'>('1080p')
  const [connectionQuality, setConnectionQuality] = useState<'high' | 'medium' | 'low'>('high')
  const containerRef = useRef<HTMLDivElement>(null)

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!lazy || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
        }
      },
      { rootMargin: '200px' } // Start loading 200px before visible
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [lazy])

  // Adaptive quality based on screen size
  useEffect(() => {
    const updateQuality = () => {
      const width = window.innerWidth
      
      if (width < 768) {
        setQuality('720p') // Mobile
      } else if (width < 1440) {
        setQuality('1080p') // Tablet/Laptop
      } else {
        setQuality('original') // Desktop
      }
    }

    updateQuality()
    window.addEventListener('resize', updateQuality)
    return () => window.removeEventListener('resize', updateQuality)
  }, [])

  // Network-aware quality (if Network Information API available)
  useEffect(() => {
    // @ts-ignore - Network Information API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      const updateConnectionQuality = () => {
        const effectiveType = connection.effectiveType
        
        if (effectiveType === '4g') {
          setConnectionQuality('high')
        } else if (effectiveType === '3g') {
          setConnectionQuality('medium')
          // Override to 720p on 3G
          setQuality('720p')
        } else {
          setConnectionQuality('low')
          // Force 720p on slow connections
          setQuality('720p')
        }
      }

      updateConnectionQuality()
      connection.addEventListener('change', updateConnectionQuality)
      
      return () => {
        connection.removeEventListener('change', updateConnectionQuality)
      }
    }
  }, [])

  // Get optimized video URL based on quality and format
  const getVideoUrl = () => {
    // WebM files are already optimized - serve as-is
    if (url.endsWith('.webm')) {
      return url
    }

    // For processed videos, select quality variant
    // Check if URL already has a quality suffix
    if (url.match(/-(720p|1080p|original)\.(mp4|mov)$/i)) {
      return url // Already has quality suffix
    }

    // Add quality suffix to base URL
    return url.replace(/\.(mp4|mov)$/i, `-${quality}.mp4`)
  }

  // Smart preload strategy based on context
  const getPreload = (): 'none' | 'metadata' | 'auto' => {
    if (context === 'hero') return 'auto' // Preload entire video for autoplay
    if (context === 'single') return 'metadata' // Load metadata for quick start
    return 'none' // Don't preload in lists
  }

  // Get controls based on context
  const getControls = () => {
    if (context === 'hero') return false
    return controls
  }

  // Get autoplay based on context
  const getAutoplay = () => {
    if (context === 'hero') return true
    return autoplay
  }

  // Get muted based on context
  const getMuted = () => {
    if (context === 'hero') return true
    return muted
  }

  // Get loop based on context
  const getLoop = () => {
    if (context === 'hero') return true
    return loop
  }

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? (
        <Video
          src={getVideoUrl()}
          poster={thumbnailUrl}
          preload={getPreload()}
          controls={getControls()}
          autoplay={getAutoplay()}
          muted={getMuted()}
          loop={getLoop()}
          trackingId={trackingId}
          saveProgress={saveProgress}
          onMilestoneReached={onMilestoneReached}
          onPlay={onPlay}
          onPause={onPause}
          onComplete={onComplete}
          className="w-full"
        />
      ) : (
        // Placeholder while lazy loading
        <div 
          className="w-full aspect-video bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-700"
          style={{ minHeight: '200px' }}
        >
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt="Video thumbnail" 
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-neutral-500 text-sm">Loading video...</div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Helper hook to get optimal video quality for manual use
 */
export function useVideoQuality() {
  const [quality, setQuality] = useState<'720p' | '1080p' | 'original'>('1080p')

  useEffect(() => {
    const updateQuality = () => {
      const width = window.innerWidth
      
      if (width < 768) {
        setQuality('720p')
      } else if (width < 1440) {
        setQuality('1080p')
      } else {
        setQuality('original')
      }
    }

    updateQuality()
    window.addEventListener('resize', updateQuality)
    return () => window.removeEventListener('resize', updateQuality)
  }, [])

  return quality
}

/**
 * Helper function to get optimized video URL (for use outside components)
 */
export function getOptimizedVideoUrl(url: string, preferredQuality?: '720p' | '1080p' | 'original'): string {
  // WebM files are already optimized
  if (url.endsWith('.webm')) {
    return url
  }

  // If URL already has quality suffix, return as-is
  if (url.match(/-(720p|1080p|original)\.(mp4|mov)$/i)) {
    return url
  }

  // Determine quality
  const quality = preferredQuality || (
    typeof window !== 'undefined' && window.innerWidth < 768 ? '720p' :
    typeof window !== 'undefined' && window.innerWidth < 1440 ? '1080p' :
    'original'
  )

  // Add quality suffix
  return url.replace(/\.(mp4|mov)$/i, `-${quality}.mp4`)
}
