'use client'

import React from 'react'
import { cn } from '../shared-utils'
import { trackVideoMilestone } from '@/lib/tracking/pixels'

/**
 * Derives the MediaConvert-generated thumbnail URL from a video URL.
 *
 * MediaConvert outputs follow this naming convention:
 *   Video:     {base}-1080p.mp4  (or -720p, -original)
 *   Thumbnail: {base}-thumb.0000000.jpg
 *
 * Only works for site-assets processed by MediaConvert.
 * Returns empty string for user-uploaded videos (no thumbnail available).
 */
export function getVideoThumbnailUrl(videoUrl: string): string {
  const isMediaConvertAsset = /site-assets\//.test(videoUrl) ||
    /-(1080p|720p|original)\.(mp4|mov|webm)$/i.test(videoUrl)
  if (!isMediaConvertAsset) return ''

  return videoUrl
    .replace(/-(1080p|720p|original)\.(mp4|mov|webm)$/i, '-thumb.0000000.jpg')
    .replace(/\.(mp4|mov|webm)$/i, '-thumb.0000000.jpg')
}

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string
  poster?: string
  variant?: 'default' | 'card'
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
  className?: string
  caption?: string
  // Performance optimization
  preload?: 'none' | 'metadata' | 'auto'
  quality?: 'auto' | 'high' | 'medium' | 'low'
  // Engagement tracking props
  onMilestoneReached?: (milestone: 25 | 50 | 75 | 95, currentTime: number) => void
  onLeadCapture?: (data: { name: string; email: string }) => void
  showLeadCaptureAt?: 25 | 50 | 75 | 95
  trackingId?: string
  saveProgress?: boolean
  // Analytics
  onPlay?: () => void
  onPause?: () => void
  onComplete?: () => void
}

export const Video = React.forwardRef<HTMLVideoElement, VideoProps>(
  ({ 
    src, 
    poster, 
    variant = 'default', 
    autoplay = false, 
    muted = false, 
    loop = false, 
    controls = true,
    className = '',
    caption,
    preload = 'metadata',
    quality = 'auto',
    onMilestoneReached,
    onLeadCapture,
    showLeadCaptureAt,
    trackingId,
    saveProgress = true,
    onPlay,
    onPause,
    onComplete,
    ...props 
  }, ref) => {
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const [currentTime, setCurrentTime] = React.useState(0)
    const [duration, setDuration] = React.useState(0)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [hasStarted, setHasStarted] = React.useState(false)
    const [milestonesReached, setMilestonesReached] = React.useState<Set<number>>(new Set())
    const [showLeadForm, setShowLeadForm] = React.useState(false)
    const [leadFormData, setLeadFormData] = React.useState({ name: '', email: '' })

    const variants = {
      default: 'rounded-xl border-2 border-[#404040]',
      card: 'rounded-2xl border border-[#404040]'
    }

    // Combine refs
    React.useImperativeHandle(ref, () => videoRef.current!)

    // Load saved progress
    React.useEffect(() => {
      if (saveProgress && trackingId) {
        const savedTime = localStorage.getItem(`video-progress-${trackingId}`)
        if (savedTime && videoRef.current) {
          videoRef.current.currentTime = parseFloat(savedTime)
        }
      }
    }, [trackingId, saveProgress])

    const handleTimeUpdate = () => {
      if (!videoRef.current) return
      
      const time = videoRef.current.currentTime
      const total = videoRef.current.duration
      
      setCurrentTime(time)
      if (Number.isFinite(total) && total > 0) {
        setDuration(total)
      }

      // Save progress to localStorage
      if (saveProgress && trackingId) {
        localStorage.setItem(`video-progress-${trackingId}`, time.toString())
      }

      // Check milestones
      if (total > 0) {
        const percentage = (time / total) * 100
        const milestones = [25, 50, 75, 95]
        
        milestones.forEach(milestone => {
          if (percentage >= milestone && !milestonesReached.has(milestone)) {
            setMilestonesReached(prev => new Set([...prev, milestone]))
            onMilestoneReached?.(milestone as 25 | 50 | 75 | 95, time)
            if (trackingId) {
              trackVideoMilestone(trackingId, milestone as 25 | 50 | 75 | 95, time)
            }

            // Show lead capture form if specified
            if (showLeadCaptureAt === milestone) {
              setShowLeadForm(true)
            }
          }
        })
      }
    }

    const handleLoadedMetadata = () => {
      if (!videoRef.current) return
      const reported = videoRef.current.duration

      if (Number.isFinite(reported) && reported > 0) {
        setDuration(reported)
        return
      }

      // WebM files from MediaRecorder often report Infinity for duration.
      // Seek to a large value to force the browser to discover the real length.
      const video = videoRef.current
      const onSeeked = () => {
        if (video) {
          const realDuration = video.duration
          if (Number.isFinite(realDuration)) {
            setDuration(realDuration)
          }
          video.currentTime = 0
        }
        video?.removeEventListener('seeked', onSeeked)
      }
      video.addEventListener('seeked', onSeeked)
      video.currentTime = 1e10
    }

    const handlePlay = () => {
      setIsPlaying(true)
      setHasStarted(true)
      onPlay?.()
    }

    const handlePause = () => {
      setIsPlaying(false)
      onPause?.()
    }

    const handleEnded = () => {
      onComplete?.()
    }

    const derivedPoster = poster !== undefined ? poster : getVideoThumbnailUrl(src)
    const resolvedPoster = derivedPoster || undefined

    const getOptimizedSrc = () => {
      return src
    }

    const handleLeadSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onLeadCapture?.(leadFormData)
      setShowLeadForm(false)
      setLeadFormData({ name: '', email: '' })
    }

    const handlePlayButtonClick = () => {
      if (videoRef.current) {
        videoRef.current.play()
      }
    }

    const showPlayOverlay = !hasStarted && !autoplay

    return (
      <div className="flex flex-col">
        <div className={cn('relative overflow-hidden group', variants[variant], className)}>
          <video
            ref={videoRef}
            src={getOptimizedSrc()}
            poster={resolvedPoster}
            autoPlay={autoplay}
            muted={muted}
            loop={loop}
            controls={hasStarted ? controls : false}
            preload={preload}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            className="w-full h-auto"
            style={{
              aspectRatio: '16/9'
            }}
            {...props}
          />
          
          {showPlayOverlay && (
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/0 hover:bg-black/40 transition-colors duration-300"
              onClick={handlePlayButtonClick}
            >
              <div className="w-[68px] h-[48px] bg-[#39FF14] group-hover:bg-[#FF0040] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <div className="w-0 h-0 border-l-[18px] border-l-black group-hover:border-l-white border-y-[11px] border-y-transparent ml-1 transition-colors duration-300" />
              </div>
            </div>
          )}

          {!controls && !isPlaying && hasStarted && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer hover:bg-black/40 transition-colors duration-300"
              onClick={handlePlayButtonClick}
            >
              <div className="w-[68px] h-[48px] bg-[#39FF14] hover:bg-[#FF0040] rounded-2xl flex items-center justify-center transition-all duration-300">
                <div className="w-0 h-0 border-l-[18px] border-l-black border-y-[11px] border-y-transparent ml-1" />
              </div>
            </div>
          )}

          {/* Lead Capture Form Overlay */}
          {showLeadForm && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-[#1F1F1F] border-2 border-[#39FF14] rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Get More Vibration Fit Content
                </h3>
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={leadFormData.name}
                    onChange={(e) => setLeadFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#404040] border-2 border-[#39FF14] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#39FF14]"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={leadFormData.email}
                    onChange={(e) => setLeadFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#404040] border-2 border-[#39FF14] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#39FF14]"
                    required
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-[#39FF14] text-black font-semibold py-3 px-6 rounded-xl hover:bg-[#00FF88] transition-colors"
                    >
                      Continue Watching
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLeadForm(false)}
                      className="px-4 py-3 bg-[#404040] text-white rounded-xl hover:bg-[#666666] transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Progress Indicator - Only show when controls are disabled */}
          {!controls && duration > 0 && (
            <div className="absolute bottom-2 left-2 right-2 bg-black/50 rounded-full h-1">
              <div 
                className="bg-[#39FF14] h-full rounded-full transition-all duration-300"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          )}
        </div>

        {caption && (
          <p className="text-center text-sm text-neutral-400 mt-2 tracking-wide">{caption}</p>
        )}
      </div>
    )
  }
)
Video.displayName = 'Video'

