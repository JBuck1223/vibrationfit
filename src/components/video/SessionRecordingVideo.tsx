'use client'

import { useCallback, useRef, type ReactEventHandler, type VideoHTMLAttributes } from 'react'

type SessionRecordingVideoProps = {
  src: string
  /** Seconds to skip from the start once duration is known (does not re-encode the file). */
  playbackStartSeconds?: number | null
  className?: string
} & Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'>

/**
 * HTML5 video for S3/session recordings with optional skip at the start
 * (same idea as trimming playback for audio, without producing a new file).
 */
export function SessionRecordingVideo({
  src,
  playbackStartSeconds = 0,
  className = '',
  onLoadedMetadata,
  ...rest
}: SessionRecordingVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const start = Math.max(0, Math.floor(playbackStartSeconds ?? 0))

  const seekToStart = useCallback(() => {
    const el = ref.current
    if (!el || start <= 0) return
    const d = el.duration
    if (!Number.isFinite(d) || d <= 0) return
    const t = Math.min(start, Math.max(0, d - 0.25))
    el.currentTime = t
  }, [start])

  const handleLoadedMetadata: ReactEventHandler<HTMLVideoElement> = e => {
    seekToStart()
    onLoadedMetadata?.(e)
  }

  return (
    <video
      ref={ref}
      src={src}
      controls
      playsInline
      preload="metadata"
      className={className}
      onLoadedMetadata={handleLoadedMetadata}
      {...rest}
    />
  )
}
