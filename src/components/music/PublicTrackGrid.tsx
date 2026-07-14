'use client'

/**
 * Card grid of publicly shared tracks with inline play. Used by the /music
 * discover page and /music/artist/[handle] pages. Each card links to the
 * track's share page (/music/[token]).
 */

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Play, Pause, Music, Loader2 } from 'lucide-react'

export interface PublicGridTrack {
  id: string
  title: string
  artist_name: string
  mp3_url: string
  cover_url: string | null
  duration_ms: number | null
  share_token: string
  /** Optional link target for the artist name (e.g. /music/artist/[handle]) */
  artist_href?: string | null
}

function formatDuration(ms: number | null): string {
  if (!ms || ms <= 0) return ''
  const totalSecs = Math.round(ms / 1000)
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function PublicTrackGrid({ tracks }: { tracks: PublicGridTrack[] }) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [bufferingId, setBufferingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const handlePlay = (track: PublicGridTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }

    audioRef.current?.pause()
    const audio = new Audio(track.mp3_url)
    audioRef.current = audio
    setBufferingId(track.id)
    setPlayingId(track.id)
    audio.addEventListener('playing', () => setBufferingId(null))
    audio.addEventListener('ended', () => setPlayingId(prev => (prev === track.id ? null : prev)))
    audio.play().catch(() => {
      setBufferingId(null)
      setPlayingId(null)
    })
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {tracks.map(track => {
        const isPlaying = playingId === track.id
        const isBuffering = bufferingId === track.id
        return (
          <div
            key={track.id}
            className="group rounded-2xl border-2 border-[#333] bg-neutral-900 overflow-hidden transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="relative aspect-square bg-neutral-800">
              {track.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={track.cover_url}
                  alt={`${track.title} cover art`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-10 h-10 text-neutral-600" />
                </div>
              )}
              <button
                type="button"
                onClick={() => handlePlay(track)}
                aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                  isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <span className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                  {isBuffering ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6" fill="currentColor" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                  )}
                </span>
              </button>
            </div>
            <div className="px-4 py-3">
              <Link href={`/music/${track.share_token}`} className="block">
                <p className="text-sm font-semibold text-white truncate group-hover:text-[#39FF14] transition-colors">
                  {track.title}
                </p>
              </Link>
              <div className="flex items-center justify-between mt-0.5">
                {track.artist_href ? (
                  <Link
                    href={track.artist_href}
                    className="text-xs text-neutral-400 truncate hover:text-[#39FF14] transition-colors"
                  >
                    {track.artist_name}
                  </Link>
                ) : (
                  <p className="text-xs text-neutral-400 truncate">{track.artist_name}</p>
                )}
                {track.duration_ms ? (
                  <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                    {formatDuration(track.duration_ms)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
