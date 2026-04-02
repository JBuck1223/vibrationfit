'use client'

import { useCallback, useRef } from 'react'
import { Video } from '@/lib/design-system/components'

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
 */
export function SessionReplayVideo({
  src,
  poster,
  playbackStartSeconds = 0,
  className = '',
}: SessionReplayVideoProps) {
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

  return (
    <Video
      ref={ref}
      src={src}
      poster={poster}
      preload="metadata"
      controls
      playsInline
      className={className}
      onLoadedMetadata={seekToStart}
    />
  )
}

