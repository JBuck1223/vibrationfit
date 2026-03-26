'use client'

import { useEffect, useRef, useCallback, type RefObject } from 'react'
import type { AudioTrack } from '@/lib/design-system/components/media/types'

const DEFAULT_ARTWORK_URL = 'https://media.vibrationfit.com/site-assets/brand/vf-icon-512.png'
const SEEK_SECONDS = 10

interface UseMediaSessionOptions {
  track: AudioTrack | null
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onNext?: () => void
  onPrevious?: () => void
  audioRef: RefObject<HTMLAudioElement | null>
}

export function useMediaSession({
  track,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  audioRef,
}: UseMediaSessionOptions) {
  const handlersRegistered = useRef(false)

  const handleSeekForward = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.min(audio.currentTime + SEEK_SECONDS, audio.duration || 0)
  }, [audioRef])

  const handleSeekBackward = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(audio.currentTime - SEEK_SECONDS, 0)
  }, [audioRef])

  const handleSeekTo = useCallback((details: MediaSessionActionDetails) => {
    const audio = audioRef.current
    if (!audio || details.seekTime == null) return
    audio.currentTime = details.seekTime
  }, [audioRef])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    if (track) {
      const artworkSrc = track.thumbnail || DEFAULT_ARTWORK_URL
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist || 'VibrationFit',
        album: 'VibrationFit',
        artwork: [
          { src: artworkSrc, sizes: '512x512', type: 'image/png' },
        ],
      })
    }
  }, [track])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [isPlaying])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    navigator.mediaSession.setActionHandler('play', onPlay)
    navigator.mediaSession.setActionHandler('pause', onPause)
    navigator.mediaSession.setActionHandler('nexttrack', onNext || null)
    navigator.mediaSession.setActionHandler('previoustrack', onPrevious || null)
    navigator.mediaSession.setActionHandler('seekforward', handleSeekForward)
    navigator.mediaSession.setActionHandler('seekbackward', handleSeekBackward)
    navigator.mediaSession.setActionHandler('seekto', handleSeekTo)
    handlersRegistered.current = true

    return () => {
      if (!('mediaSession' in navigator)) return
      const actions: MediaSessionAction[] = [
        'play', 'pause', 'nexttrack', 'previoustrack',
        'seekforward', 'seekbackward', 'seekto',
      ]
      actions.forEach(action => {
        try { navigator.mediaSession.setActionHandler(action, null) } catch { /* unsupported action */ }
      })
      handlersRegistered.current = false
    }
  }, [onPlay, onPause, onNext, onPrevious, handleSeekForward, handleSeekBackward, handleSeekTo])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const audio = audioRef.current
    if (!audio) return

    const updatePositionState = () => {
      if (!audio.duration || !isFinite(audio.duration)) return
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate || 1,
          position: Math.min(audio.currentTime, audio.duration),
        })
      } catch { /* position state not supported */ }
    }

    audio.addEventListener('timeupdate', updatePositionState)
    audio.addEventListener('loadedmetadata', updatePositionState)

    return () => {
      audio.removeEventListener('timeupdate', updatePositionState)
      audio.removeEventListener('loadedmetadata', updatePositionState)
    }
  }, [audioRef, track?.id])
}
