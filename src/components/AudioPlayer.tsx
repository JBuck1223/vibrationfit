"use client"
import React, { useEffect, useRef, useState } from 'react'
import { Button, Card, ProgressBar, Badge } from '@/lib/design-system/components'

type Track = {
  sectionKey: string
  title: string
  url: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt?: string
  voiceId?: string
  contentHash?: string
}

export function AudioPlayer({ tracks }: { tracks: Track[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [repeatMode, setRepeatMode] = useState<'off' | 'track' | 'playlist'>('off')

  const current = tracks[currentIndex]

  useEffect(() => {
    if (!audioRef.current) return
    const el = audioRef.current
    const onTime = () => {
      if (!el.duration) return
      setProgress((el.currentTime / el.duration) * 100)
    }
    const onEnded = () => {
      if (repeatMode === 'track') {
        el.currentTime = 0
        el.play().catch(() => setIsPlaying(false))
        return
      }
      const nextPlayable = findNextPlayableIndex(currentIndex)
      if (nextPlayable !== null) {
        setCurrentIndex(nextPlayable)
        // autoplay will be handled by effect on currentIndex
      } else if (repeatMode === 'playlist') {
        const firstPlayable = findNextPlayableIndex(-1)
        if (firstPlayable !== null) {
          setCurrentIndex(firstPlayable)
        } else {
          setIsPlaying(false)
        }
      } else {
        setIsPlaying(false)
      }
    }
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('ended', onEnded)
    }
  }, [])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.src = current?.url || ''
    setProgress(0)
    if (isPlaying && current?.url) {
      audioRef.current.play().catch(() => setIsPlaying(false))
    }
  }, [currentIndex])

  const playPause = async () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
      }
    }
  }

  const next = () => setCurrentIndex((i) => Math.min(i + 1, tracks.length - 1))
  const prev = () => setCurrentIndex((i) => Math.max(i - 1, 0))
  const playAllFromStart = () => {
    const firstPlayable = findNextPlayableIndex(-1)
    if (firstPlayable !== null) {
      setCurrentIndex(firstPlayable)
      if (!isPlaying) setIsPlaying(true)
      setTimeout(() => {
        if (audioRef.current && tracks[firstPlayable]?.url) {
          audioRef.current.play().catch(() => setIsPlaying(false))
        }
      }, 0)
    }
  }

  function findNextPlayableIndex(fromIndex: number): number | null {
    for (let i = fromIndex + 1; i < tracks.length; i++) {
      if (tracks[i]?.url) return i
    }
    return null
  }

  function cycleRepeat() {
    setRepeatMode((m) => (m === 'off' ? 'track' : m === 'track' ? 'playlist' : 'off'))
  }

  return (
    <Card variant="elevated">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Life Vision Audio</h3>
            <p className="text-neutral-400 text-sm">{current?.title || 'No track selected'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={prev}>Prev</Button>
            <Button variant="primary" onClick={playPause}>{isPlaying ? 'Pause' : 'Play'}</Button>
            <Button variant="secondary" onClick={next}>Next</Button>
            <Button variant="outline" onClick={playAllFromStart}>Play All</Button>
            <Button variant="ghost" onClick={cycleRepeat}>
              {repeatMode === 'off' ? 'Repeat: Off' : repeatMode === 'track' ? 'Repeat: Track' : 'Repeat: Playlist'}
            </Button>
          </div>
        </div>

        <audio ref={audioRef} preload="auto" />
        <ProgressBar value={progress} variant="primary" label="" />

        <div className="grid grid-cols-1 gap-3">
          {tracks.map((t, idx) => (
            <button
              key={t.sectionKey}
              onClick={() => setCurrentIndex(idx)}
              className={`text-left p-3 rounded-xl border-2 ${idx === currentIndex ? 'border-[#5EC49A] bg-[#1F1F1F]' : 'border-[#333] hover:border-[#199D67] bg-[#1F1F1F]'} transition`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{t.title}</span>
                {t.status && (
                  <Badge variant={t.status === 'completed' ? 'success' : t.status === 'failed' ? 'error' : 'info'}>
                    {t.status}
                  </Badge>
                )}
              </div>
              <div className="text-neutral-400 text-xs mt-1 flex items-center gap-3">
                <span className="truncate max-w-[50%]">{t.url ? t.url : 'Not generated yet'}</span>
                {t.createdAt && <span>• {new Date(t.createdAt).toLocaleDateString()}</span>}
                {t.voiceId && <span>• Voice: {t.voiceId}</span>}
                {t.contentHash && <span className="hidden md:inline">• {t.contentHash.slice(0,8)}</span>}
              </div>
              {!t.url && t.status === 'failed' && (
                <div className="mt-2">
                  <Button variant="ghost" size="sm" onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const retryEvent = new CustomEvent('audio:retry-track', { detail: { sectionKey: t.sectionKey }})
                    window.dispatchEvent(retryEvent)
                  }}>Retry</Button>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}


