'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Play, Pause, SkipForward, SkipBack, Scissors, ArrowRight,
  Image as ImageIcon, Film, Type,
} from 'lucide-react'

type KeyframeRow = {
  id: string
  sort_order: number
  description: string
  prompt: string | null
  status: string
  fal_model: string | null
  generated_media: { id: string; url: string; file_type: string } | null
  generation_metadata: Record<string, unknown> | null
}

type ClipRow = {
  id: string
  sort_order: number
  transition_type: 'chain' | 'jump_cut'
  prompt: string | null
  status: string
  duration_seconds: number
  fal_model: string | null
  generated_media: { id: string; url: string; file_type: string } | null
  first_frame_kf: { id: string; sort_order: number; status: string; generated_media: { url: string } | null } | null
  last_frame_kf: { id: string; sort_order: number; status: string; generated_media: { url: string } | null } | null
  generation_metadata: Record<string, unknown> | null
}

type SegmentKind = 'video' | 'image' | 'placeholder'

interface Segment {
  clip: ClipRow
  kind: SegmentKind
  videoUrl?: string
  imageUrl?: string
  duration: number
  label: string
}

interface RoughDraftPlayerProps {
  clips: ClipRow[]
  keyframes: KeyframeRow[]
}

const STILL_DURATION = 3

function resolveSegments(clips: ClipRow[]): Segment[] {
  const sorted = [...clips].sort((a, b) => a.sort_order - b.sort_order)

  return sorted.map((clip) => {
    if (clip.generated_media?.url) {
      return {
        clip,
        kind: 'video' as const,
        videoUrl: clip.generated_media.url,
        duration: clip.duration_seconds || 6,
        label: `Clip ${clip.sort_order}`,
      }
    }

    const firstImg = clip.first_frame_kf?.generated_media?.url
    const lastImg = clip.last_frame_kf?.generated_media?.url
    const imageUrl = firstImg || lastImg

    if (imageUrl) {
      return {
        clip,
        kind: 'image' as const,
        imageUrl,
        duration: STILL_DURATION,
        label: `Clip ${clip.sort_order} (keyframe)`,
      }
    }

    return {
      clip,
      kind: 'placeholder' as const,
      duration: STILL_DURATION,
      label: `Clip ${clip.sort_order} (pending)`,
    }
  })
}

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-500',
  complete: 'bg-blue-500',
  generating: 'bg-yellow-500 animate-pulse',
  waiting_keyframes: 'bg-zinc-600',
  pending: 'bg-zinc-600',
  rejected: 'bg-red-500',
  failed: 'bg-red-500',
}

const KIND_ICON: Record<SegmentKind, typeof Film> = {
  video: Film,
  image: ImageIcon,
  placeholder: Type,
}

export default function RoughDraftPlayer({ clips, keyframes }: RoughDraftPlayerProps) {
  const segments = useMemo(() => resolveSegments(clips), [clips])
  const totalDuration = useMemo(
    () => segments.reduce((sum, s) => sum + s.duration, 0),
    [segments]
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [segmentProgress, setSegmentProgress] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const segment = segments[currentIndex]
  const isLastSegment = currentIndex >= segments.length - 1

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null }
  }, [])

  const advanceToNext = useCallback(() => {
    clearTimers()
    if (isLastSegment) {
      setIsPlaying(false)
      setSegmentProgress(1)
      return
    }

    const nextSeg = segments[currentIndex + 1]
    if (nextSeg?.clip.transition_type === 'jump_cut') {
      setTransitioning(true)
      setTimeout(() => {
        setTransitioning(false)
        setCurrentIndex((i) => i + 1)
        setSegmentProgress(0)
      }, 150)
    } else {
      setCurrentIndex((i) => i + 1)
      setSegmentProgress(0)
    }
  }, [clearTimers, currentIndex, isLastSegment, segments])

  // Start/stop still-image and placeholder timers
  useEffect(() => {
    if (!isPlaying || !segment || segment.kind === 'video') return

    const dur = segment.duration * 1000
    const start = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      setSegmentProgress(Math.min(elapsed / dur, 1))
    }, 50)

    advanceTimerRef.current = setTimeout(() => {
      advanceToNext()
    }, dur)

    return () => { clearTimers() }
  }, [isPlaying, currentIndex, segment, advanceToNext, clearTimers])

  // Handle video time updates
  const onVideoTimeUpdate = useCallback(() => {
    const vid = videoRef.current
    if (!vid || !vid.duration) return
    setSegmentProgress(vid.currentTime / vid.duration)
  }, [])

  const onVideoEnded = useCallback(() => {
    advanceToNext()
  }, [advanceToNext])

  // Auto-play video when segment changes
  useEffect(() => {
    if (!isPlaying || !segment || segment.kind !== 'video') return
    const vid = videoRef.current
    if (vid) {
      vid.currentTime = 0
      vid.play().catch(() => {})
    }
  }, [isPlaying, currentIndex, segment])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false)
      clearTimers()
      if (segment?.kind === 'video' && videoRef.current) {
        videoRef.current.pause()
      }
    } else {
      // If at the end, restart
      if (isLastSegment && segmentProgress >= 1) {
        setCurrentIndex(0)
        setSegmentProgress(0)
      }
      setIsPlaying(true)
      if (segment?.kind === 'video' && videoRef.current) {
        videoRef.current.play().catch(() => {})
      }
    }
  }, [isPlaying, clearTimers, segment, isLastSegment, segmentProgress])

  const jumpTo = useCallback((index: number) => {
    clearTimers()
    setCurrentIndex(index)
    setSegmentProgress(0)
    if (isPlaying && segments[index]?.kind === 'video') {
      setTimeout(() => {
        videoRef.current?.play().catch(() => {})
      }, 50)
    }
  }, [clearTimers, isPlaying, segments])

  const skipBack = useCallback(() => {
    if (currentIndex > 0) jumpTo(currentIndex - 1)
  }, [currentIndex, jumpTo])

  const skipForward = useCallback(() => {
    if (!isLastSegment) jumpTo(currentIndex + 1)
  }, [currentIndex, isLastSegment, jumpTo])

  if (segments.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-8">
        No clips to preview yet.
      </div>
    )
  }

  // Compute overall progress for the global progress bar
  const elapsedBefore = segments.slice(0, currentIndex).reduce((sum, s) => sum + s.duration, 0)
  const currentElapsed = segmentProgress * (segment?.duration || 0)
  const globalProgress = totalDuration > 0 ? (elapsedBefore + currentElapsed) / totalDuration : 0

  return (
    <div className="space-y-3">
      {/* Viewport */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        {/* Jump cut flash overlay */}
        {transitioning && (
          <div className="absolute inset-0 z-20 bg-white animate-[flash_150ms_ease-out]" />
        )}

        {/* Video segment */}
        {segment?.kind === 'video' && segment.videoUrl && (
          <video
            ref={videoRef}
            src={segment.videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={onVideoTimeUpdate}
            onEnded={onVideoEnded}
            playsInline
            muted
          />
        )}

        {/* Image segment */}
        {segment?.kind === 'image' && segment.imageUrl && (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={segment.imageUrl}
              alt={segment.label}
              className="max-w-full max-h-full object-contain"
            />
            {/* Progress ring for still images */}
            {isPlaying && (
              <div className="absolute bottom-4 right-4 w-8 h-8">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <circle
                    cx="16" cy="16" r="14" fill="none" stroke="white" strokeWidth="2"
                    strokeDasharray={`${segmentProgress * 88} 88`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Placeholder segment */}
        {segment?.kind === 'placeholder' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
            <Type className="w-8 h-8 text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-400 max-w-md">
              {segment.clip.prompt || 'Waiting for generation...'}
            </p>
            <span className="text-xs text-zinc-600 mt-2">
              KF {segment.clip.first_frame_kf?.sort_order} &rarr; KF {segment.clip.last_frame_kf?.sort_order}
            </span>
            {isPlaying && (
              <div className="absolute bottom-4 right-4 w-8 h-8">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <circle
                    cx="16" cy="16" r="14" fill="none" stroke="white" strokeWidth="2"
                    strokeDasharray={`${segmentProgress * 88} 88`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Segment info overlay (top-left) */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <span className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-white font-medium">
            {currentIndex + 1} / {segments.length}
          </span>
          {segment?.clip.transition_type === 'jump_cut' && (
            <span className="px-2 py-1 rounded-lg bg-[#FF0040]/60 backdrop-blur-sm text-xs text-white font-medium flex items-center gap-1">
              <Scissors className="w-3 h-3" /> Jump Cut
            </span>
          )}
        </div>

        {/* Click-to-play overlay when paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={skipBack}
          disabled={currentIndex === 0}
          className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 transition-colors"
        >
          <SkipBack className="w-4 h-4 text-zinc-400" />
        </button>
        <button
          onClick={togglePlay}
          className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white ml-0.5" />
          )}
        </button>
        <button
          onClick={skipForward}
          disabled={isLastSegment}
          className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 transition-colors"
        >
          <SkipForward className="w-4 h-4 text-zinc-400" />
        </button>

        {/* Global progress bar */}
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#BF00FF] rounded-full transition-[width] duration-100"
            style={{ width: `${globalProgress * 100}%` }}
          />
        </div>

        <span className="text-xs text-zinc-500 tabular-nums min-w-[3rem] text-right">
          {Math.round(elapsedBefore + currentElapsed)}s / {Math.round(totalDuration)}s
        </span>
      </div>

      {/* Timeline segments */}
      <div className="flex gap-0.5 h-8">
        {segments.map((seg, i) => {
          const widthPct = totalDuration > 0 ? (seg.duration / totalDuration) * 100 : 0
          const isActive = i === currentIndex
          const Icon = KIND_ICON[seg.kind]
          const colorClass = STATUS_COLORS[seg.clip.status] || 'bg-zinc-600'

          return (
            <div key={seg.clip.id} className="flex" style={{ width: `${widthPct}%` }}>
              {/* Jump cut divider */}
              {i > 0 && seg.clip.transition_type === 'jump_cut' && (
                <div className="w-1 flex-shrink-0 bg-[#FF0040] rounded-full" />
              )}
              <button
                onClick={() => jumpTo(i)}
                className={`
                  flex-1 min-w-0 rounded-md flex items-center justify-center gap-1 text-[10px] font-medium transition-all
                  ${isActive
                    ? 'ring-2 ring-[#BF00FF] bg-zinc-700 text-white'
                    : 'bg-zinc-800/80 text-zinc-500 hover:bg-zinc-700/80 hover:text-zinc-300'
                  }
                `}
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colorClass}`} />
                <Icon className="w-3 h-3 flex-shrink-0" />
                {widthPct > 12 && <span className="truncate">{seg.clip.sort_order}</span>}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
