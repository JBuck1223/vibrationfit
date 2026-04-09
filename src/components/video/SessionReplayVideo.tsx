'use client'

import React, { useCallback, useRef, useState } from 'react'
import { Video } from '@/lib/design-system/components'
import { AlertCircle, RotateCcw } from 'lucide-react'

type SessionReplayVideoProps = {
  src: string
  poster?: string
  /** Seconds to skip from the start once duration is known (does not re-encode the file). */
  playbackStartSeconds?: number | null
  className?: string
}

/**
 * Uses the design-system <Video> player (thumbnail + play overlay),
 * while supporting an optional playback start offset for recordings.
 *
 * Mobile-optimised: uses preload="none" to avoid stalling on large
 * session MP4s, and includes error/retry handling.
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

  const seekToStart = useCallback(() => {
    const el = videoRef.current
    if (!el || start <= 0 || hasSeeked.current) return
    const d = el.duration
    if (!Number.isFinite(d) || d <= 0) return
    const t = Math.min(start, Math.max(0, d - 0.25))
    el.currentTime = t
    hasSeeked.current = true
  }, [start])

  const handleCanPlay = useCallback(() => {
    seekToStart()
  }, [seekToStart])

  const handleError = useCallback(() => {
    setError(true)
  }, [])

  const handleRetry = useCallback(() => {
    setError(false)
    hasSeeked.current = false
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
      key={retryKey}
      ref={videoRef}
      src={src}
      poster={poster}
      preload="none"
      controls
      playsInline
      className={className}
      onCanPlay={handleCanPlay}
      onError={handleError}
    />
  )
}
