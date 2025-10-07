"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
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

  const current = tracks[currentIndex]

  useEffect(() => {
    if (!audioRef.current) return
    const el = audioRef.current
    const onTime = () => {
      if (!el.duration) return
      setProgress((el.currentTime / el.duration) * 100)
    }
    el.addEventListener('timeupdate', onTime)
    return () => el.removeEventListener('timeupdate', onTime)
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
          </div>
        </div>

        <audio ref={audioRef} preload="auto" />
        <ProgressBar value={progress} variant="primary" label="" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}


