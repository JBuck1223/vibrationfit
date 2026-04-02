'use client'

import { Video } from '@/lib/design-system/components'
import { useEffect, useState, useRef, useMemo, useCallback } from 'react'

export type VideoQualityRendition = '720p' | '1080p' | 'original'

function orderedQualities(preferred: VideoQualityRendition): VideoQualityRendition[] {
  const all: VideoQualityRendition[] = ['720p', '1080p', 'original']
  return [preferred, ...all.filter(q => q !== preferred)]
}

/**
 * Build CDN URLs for MediaConvert-style outputs: {base}-720p.mp4, -1080p.mp4, -original.mp4
 * Also supports /processed/... paths where the file is base.mp4 before renditions exist.
 */
export function buildAdaptiveVideoUrlCandidates(
  url: string,
  preferredQuality: VideoQualityRendition
): string[] {
  if (url.endsWith('.webm')) {
    return [url]
  }

  const suffixed = url.match(/^(.*)-(720p|1080p|original)(\.(mp4|mov))$/i)
  if (suffixed) {
    const base = suffixed[1]
    const ext = suffixed[3]
    const seen = new Set<string>()
    const out: string[] = []
    for (const q of orderedQualities(preferredQuality)) {
      const u = `${base}-${q}${ext}`
      if (!seen.has(u)) {
        seen.add(u)
        out.push(u)
      }
    }
    return out
  }

  if (url.includes('/processed/')) {
    const seen = new Set<string>()
    const out: string[] = []
    for (const q of orderedQualities(preferredQuality)) {
      const u = url.replace(/\.(mp4|mov)$/i, `-${q}.mp4`)
      if (!seen.has(u)) {
        seen.add(u)
        out.push(u)
      }
    }
    return out
  }

  return [url]
}

interface OptimizedVideoProps {
  url: string
  thumbnailUrl?: string
  lazy?: boolean
  context?: 'list' | 'single' | 'hero'
  variant?: 'default' | 'hero' | 'card'
  className?: string
  controls?: boolean
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  /** Shown under the player (same as design-system Video caption). */
  caption?: string
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
  variant,
  className = '',
  controls = true,
  autoplay = false,
  muted = false,
  loop = false,
  caption,
  trackingId,
  saveProgress = true,
  onMilestoneReached,
  onPlay,
  onPause,
  onComplete
}: OptimizedVideoProps) {
  const [isVisible, setIsVisible] = useState(!lazy)
  const [quality, setQuality] = useState<VideoQualityRendition>('1080p')
  const [mounted, setMounted] = useState(false)
  const [candidateIndex, setCandidateIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const candidates = useMemo(
    () => buildAdaptiveVideoUrlCandidates(url, quality),
    [url, quality]
  )

  const activeSrc = candidates[Math.min(candidateIndex, candidates.length - 1)] ?? url

  useEffect(() => {
    setCandidateIndex(0)
  }, [url, quality])

  // Prevent hydration mismatch - only run client-side logic after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!lazy || !containerRef.current || !mounted) return

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
  }, [lazy, mounted])

  // Adaptive quality based on screen size - only after mount
  useEffect(() => {
    if (!mounted) return

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
  }, [mounted])

  // Network-aware quality (if Network Information API available) - only after mount
  useEffect(() => {
    if (!mounted) return

    // @ts-ignore - Network Information API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      const updateConnectionQuality = () => {
        const effectiveType = connection.effectiveType
        if (effectiveType === '3g' || effectiveType === '2g' || effectiveType === 'slow-2g') {
          setQuality('720p')
        }
      }

      updateConnectionQuality()
      connection.addEventListener('change', updateConnectionQuality)

      return () => {
        connection.removeEventListener('change', updateConnectionQuality)
      }
    }
  }, [mounted])

  const handleVideoError = useCallback(() => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex(i => i + 1)
    }
  }, [candidateIndex, candidates.length])

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

  // Auto-determine variant from context if not explicitly provided
  const getVariant = (): 'default' | 'card' => {
    if (variant === 'card') return 'card'
    if (variant === 'default' || variant === 'hero') return 'default'
    if (context === 'list') return 'card'
    return 'default'
  }

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? (
        <Video
          key={activeSrc}
          src={activeSrc}
          poster={thumbnailUrl}
          caption={caption}
          variant={getVariant()}
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
          onError={handleVideoError}
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
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

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
  }, [mounted])

  return quality
}

/**
 * Helper function to get optimized video URL (for use outside components)
 */
export function getOptimizedVideoUrl(
  url: string,
  preferredQuality?: VideoQualityRendition
): string {
  const q: VideoQualityRendition =
    preferredQuality ||
    (typeof window !== 'undefined' && window.innerWidth < 768 ? '720p' :
      typeof window !== 'undefined' && window.innerWidth < 1440 ? '1080p' :
      'original')

  const list = buildAdaptiveVideoUrlCandidates(url, q)
  return list[0] ?? url
}
