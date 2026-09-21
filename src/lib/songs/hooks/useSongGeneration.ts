'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Song } from '../types'

interface GenerateMusicOptions {
  lyrics?: string
  style_prompt?: string
  reference_id?: string
  reference_meta?: {
    youtube_url?: string
    title?: string
    clip_url?: string
    start?: number
    end?: number
    mureka_file_id?: string
  }
}

interface SongGenerationSource {
  id: string
  status: Song['status']
  metadata: Song['metadata']
}

interface UseSongGenerationOptions {
  song: SongGenerationSource | null
  onComplete?: () => void
}

export function useSongGeneration({ song, onComplete }: UseSongGenerationOptions) {
  const [polling, setPolling] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const songId = song?.id ?? null
  const taskId = (song?.metadata as Record<string, string> | undefined)?.mureka_task_id ?? null
  const isGenerating = song?.status === 'generating_music' || polling || submitting
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (song?.status !== 'generating_music' || !songId || !taskId) {
      setPolling(false)
      return
    }

    setPolling(true)
    let inFlight = false
    let stopped = false
    const interval = setInterval(async () => {
      // Skip if the previous poll hasn't resolved (S3 download can outlast the
      // interval) to avoid overlapping requests inserting duplicate tracks.
      if (inFlight || stopped) return
      inFlight = true
      try {
        const res = await fetch(`/api/songs/poll/${taskId}?song_id=${songId}`)
        const data = await res.json().catch(() => ({}))

        if (data.status === 'completed' || data.status === 'succeeded' || data.status === 'failed') {
          stopped = true
          clearInterval(interval)
          setPolling(false)
          if (data.status === 'failed') {
            setError(data.error || 'Music generation failed')
          } else {
            setError(null)
          }
          onCompleteRef.current?.()
        }
      } catch {
        // Keep polling until the server marks a stale task failed.
      } finally {
        inFlight = false
      }
    }, 5000)

    return () => {
      stopped = true
      clearInterval(interval)
    }
  }, [song?.status, songId, taskId])

  const generateMore = useCallback(async (options: GenerateMusicOptions = {}) => {
    if (!songId || isGenerating) return false

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/songs/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song_id: songId,
          ...options,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start music generation')
      }

      onComplete?.()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate music')
      return false
    } finally {
      setSubmitting(false)
    }
  }, [songId, isGenerating, onComplete])

  return {
    generateMore,
    isGenerating,
    polling,
    submitting,
    error,
    clearError: () => setError(null),
  }
}
