'use client'

/**
 * Public music discover page: /music
 *
 * Accessible without authentication. Lists song tracks that members have
 * opted into public listing (song_tracks.is_public = true). Each card plays
 * inline and links to the track's share page (/music/[token]).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Play, Pause, Music, Loader2, Sparkles } from 'lucide-react'
import { Button, Spinner } from '@/lib/design-system/components'

interface PublicTrack {
  id: string
  title: string
  artist_name: string
  mp3_url: string
  cover_url: string | null
  duration_ms: number | null
  genres: string[]
  moods: string[]
  share_token: string
}

const PAGE_SIZE = 24

function formatDuration(ms: number | null): string {
  if (!ms || ms <= 0) return ''
  const totalSecs = Math.round(ms / 1000)
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function PublicMusicPage() {
  const [tracks, setTracks] = useState<PublicTrack[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [playingId, setPlayingId] = useState<string | null>(null)
  const [bufferingId, setBufferingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const loadTracks = useCallback(async (offset: number) => {
    const res = await fetch(`/api/music/public?limit=${PAGE_SIZE}&offset=${offset}`)
    if (!res.ok) throw new Error('Failed to load music')
    return res.json() as Promise<{ tracks: PublicTrack[]; total: number }>
  }, [])

  useEffect(() => {
    let cancelled = false
    loadTracks(0)
      .then(data => {
        if (cancelled) return
        setTracks(data.tracks)
        setTotal(data.total)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load music. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [loadTracks])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const data = await loadTracks(tracks.length)
      setTracks(prev => [...prev, ...data.tracks])
      setTotal(data.total)
    } catch {
      setError('Failed to load more music.')
    } finally {
      setLoadingMore(false)
    }
  }

  const handlePlay = (track: PublicTrack) => {
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
    <div className="py-8 md:py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Music From Our Members
        </h1>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Songs created with VIVA on Vibration Fit — each one born from a member&apos;s
          vision for their life.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="text-center text-neutral-400 py-20">{error}</p>
      ) : tracks.length === 0 ? (
        <div className="text-center py-20">
          <Music className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400">No songs have been shared publicly yet. Check back soon.</p>
        </div>
      ) : (
        <>
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
                  <Link href={`/music/${track.share_token}`} className="block px-4 py-3">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-[#39FF14] transition-colors">
                      {track.title}
                    </p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-neutral-400 truncate">{track.artist_name}</p>
                      {track.duration_ms ? (
                        <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                          {formatDuration(track.duration_ms)}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>

          {tracks.length < total && (
            <div className="flex justify-center mt-10">
              <Button variant="outline" onClick={handleLoadMore} loading={loadingMore}>
                Load More
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Sign-up CTA ── */}
      <div className="w-full max-w-xl mx-auto mt-14">
        <div className="rounded-2xl border-2 border-[#333] bg-neutral-900 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-[#BF00FF]/15 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#BF00FF]" />
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            Create your own songs with VIVA
          </h2>
          <p className="text-sm md:text-base text-neutral-400 mb-6 max-w-md mx-auto">
            Design a vision for your life and VIVA turns it into music, audios, and more.
          </p>
          <Button size="lg" asChild>
            <Link href="/">Learn More About Vibration Fit</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
