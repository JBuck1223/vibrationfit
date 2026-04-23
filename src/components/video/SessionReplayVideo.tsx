'use client'

import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import { Video } from '@/lib/design-system/components'
import { AlertCircle, RotateCcw } from 'lucide-react'
import {
  buildAdaptiveVideoUrlCandidates,
  type VideoQualityRendition,
} from '@/components/OptimizedVideo'

type SessionReplayVideoProps = {
  src: string
  poster?: string
  /** Seconds to skip from the start once duration is known (does not re-encode the file). */
  playbackStartSeconds?: number | null
  className?: string
}

/**
 * Replay player for session recordings with adaptive quality selection.
 *
 * Once MediaConvert has processed a recording the DB stores the 1080p URL.
 * This component derives 720p / original variants from that URL (via the
 * standard -{quality}.mp4 naming convention) and picks the best one based on
 * screen width and network conditions — identical to OptimizedVideo.
 *
 * Additional session-recording specifics:
 *  - preload="metadata" for fast initial load
 *  - Seeks to playbackStartSeconds on first play
 *  - Error/retry handling for flaky connections
 *  - Falls through quality candidates if a variant 404s
 */
export function SessionReplayVideo({
  src,
  poster,
  playbackStartSeconds = 0,
  className = '',
}: SessionReplayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const start = Math.max(0, Math.floor(playbackStartSeconds ?? 0))
  const hasSeeked = useRef(false)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  // Adaptive quality based on screen width
  const [quality, setQuality] = useState<VideoQualityRendition>('1080p')
  const [mounted, setMounted] = useState(false)
  const [candidateIndex, setCandidateIndex] = useState(0)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    const update = () => {
      const w = window.innerWidth
      setQuality(w < 768 ? '720p' : w < 1440 ? '1080p' : 'original')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mounted])

  // Network-aware downgrade
  useEffect(() => {
    if (!mounted) return
    // @ts-expect-error Network Information API
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (!conn) return
    const update = () => {
      if (['3g', '2g', 'slow-2g'].includes(conn.effectiveType)) setQuality('720p')
    }
    update()
    conn.addEventListener('change', update)
    return () => conn.removeEventListener('change', update)
  }, [mounted])

  const candidates = useMemo(
    () => buildAdaptiveVideoUrlCandidates(src, quality),
    [src, quality],
  )
  const activeSrc = candidates[Math.min(candidateIndex, candidates.length - 1)] ?? src

  useEffect(() => { setCandidateIndex(0) }, [src, quality])

  const seekToStart = useCallback(() => {
    const el = videoRef.current
    if (!el || start <= 0 || hasSeeked.current) return
    hasSeeked.current = true
    const d = el.duration
    if (Number.isFinite(d) && d > 0) {
      el.currentTime = Math.min(start, Math.max(0, d - 0.25))
    } else {
      el.currentTime = start
    }
  }, [start])

  // Seek on first *playing* (not *play*). Seeking in `play` runs while the
  // browser's play() promise is still pending and can cause AbortError:
  // "The play() request was interrupted by a call to pause()."
  const handlePlaying = useCallback(() => {
    seekToStart()
  }, [seekToStart])

  const handleError = useCallback(() => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex(i => i + 1)
    } else {
      setError(true)
    }
  }, [candidateIndex, candidates.length])

  const handleRetry = useCallback(() => {
    setError(false)
    hasSeeked.current = false
    setCandidateIndex(0)
    setRetryKey(k => k + 1)
  }, [])

  if (error) {
    return (
      <div className="w-full aspect-video rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center gap-3 px-4">
        <AlertCircle className="w-8 h-8 text-neutral-500" />
        <p className="text-sm text-neutral-400 text-center">
          Playback error. This can happen on slower connections.
        </p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary-500/20 text-primary-500 hover:bg-primary-500/30 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Try again
        </button>
      </div>
    )
  }

  return (
    <Video
      key={`${retryKey}-${activeSrc}`}
      ref={videoRef}
      src={activeSrc}
      poster={poster}
      preload="metadata"
      controls
      playsInline
      className={className}
      onPlaying={handlePlaying}
      onError={handleError}
    />
  )
}
