'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Stack, Card, Button, Badge, EmbeddedPlayer } from '@/lib/design-system/components'
import { Heart, Download, RefreshCw, ChevronLeft, Loader2 } from 'lucide-react'
import { useSong } from '@/lib/songs/hooks/useSong'
import type { SongTrack } from '@/lib/songs/types'
import type { AudioTrack } from '@/lib/design-system/components/media/types'

export default function SongDetailPage() {
  const params = useParams()
  const router = useRouter()
  const songId = params.songId as string
  const { song, tracks, loading, error, refetch } = useSong(songId)

  const [polling, setPolling] = useState(false)
  const [loadingStems, setLoadingStems] = useState<string | null>(null)

  // Poll for music generation completion
  useEffect(() => {
    if (song?.status !== 'generating_music') return

    const taskId = (song.metadata as Record<string, string>)?.mureka_task_id
    if (!taskId) return

    setPolling(true)
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/songs/poll/${taskId}?song_id=${songId}`)
        const data = await res.json()

        if (data.status === 'completed' || data.status === 'succeeded' || data.status === 'failed') {
          clearInterval(interval)
          setPolling(false)
          refetch()
        }
      } catch {
        // Keep polling
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [song?.status, song?.metadata, songId, refetch])

  const toggleFavorite = async (track: SongTrack) => {
    await fetch(`/api/songs/${songId}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: track.id }),
    })
    refetch()
  }

  const requestStems = async (track: SongTrack) => {
    setLoadingStems(track.id)
    try {
      const res = await fetch(`/api/songs/${songId}/stems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_id: track.id }),
      })
      const data = await res.json()
      if (data.stems_url) {
        window.open(data.stems_url, '_blank')
      }
      refetch()
    } catch (err) {
      console.error('Stems request failed:', err)
    } finally {
      setLoadingStems(null)
    }
  }

  const playerTracks: AudioTrack[] = tracks
    .filter(t => t.mp3_url)
    .map(t => ({
      id: t.id,
      title: t.title || `Version ${t.version}`,
      artist: song?.title || 'VIVA Song',
      duration: t.duration_ms ? t.duration_ms / 1000 : 180,
      url: t.mp3_url!,
      thumbnail: t.cover_url || undefined,
    }))

  const regenerateMusic = async () => {
    if (!songId) return
    try {
      await fetch('/api/songs/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_id: songId }),
      })
      refetch()
    } catch (err) {
      console.error('Regenerate failed:', err)
    }
  }

  if (loading) {
    return (
      <Container size="lg" className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </Container>
    )
  }

  if (error || !song) {
    return (
      <Container size="lg" className="py-10">
        <Card variant="glass" className="p-6 text-center">
          <p className="text-neutral-400">{error || 'Song not found'}</p>
          <Button variant="ghost" onClick={() => router.push('/audio/songwriter')} className="mt-4">
            Back to Songwriter
          </Button>
        </Card>
      </Container>
    )
  }

  const isGenerating = song.status === 'generating_music' || polling

  return (
    <Container size="lg" className="pt-2 pb-8">
      <Stack gap="md">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/audio/songwriter')} className="text-neutral-400 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">{song.title || 'Untitled Song'}</h1>
            {song.song_essence && (
              <p className="text-xs text-neutral-400">
                {(song.song_essence as { emotional_start?: string }).emotional_start}
                {' → '}
                {(song.song_essence as { emotional_destination?: string }).emotional_destination}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={regenerateMusic} disabled={isGenerating}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            More Versions
          </Button>
        </div>

        {/* Generation in progress */}
        {isGenerating && (
          <Card variant="glass" className="flex items-center gap-3 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-[#39FF14]" />
            <div>
              <p className="text-sm font-medium text-white">Generating music...</p>
              <p className="text-xs text-neutral-400">Mureka is composing your song. This takes about 45 seconds.</p>
            </div>
          </Card>
        )}

        {/* Player */}
        {playerTracks.length > 0 && (
          <div className="space-y-3">
            <EmbeddedPlayer
              tracks={playerTracks}
              mapActivityType="song_listen"
              setName={song.title || 'Song'}
              setIconKey="music"
              trackCount={playerTracks.length}
            />

            {/* Track actions (favorite, stems) */}
            <div className="space-y-2">
              {tracks.filter(t => t.mp3_url).map(track => (
                <div key={track.id} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-300">
                      {track.title || `Version ${track.version}`}
                    </span>
                    {track.genres?.slice(0, 2).map(g => (
                      <Badge key={g} variant="default" className="text-[10px]">{g}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleFavorite(track)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        track.is_favorite
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${track.is_favorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => requestStems(track)}
                      disabled={loadingStems === track.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-500 transition-colors hover:text-neutral-300 disabled:opacity-40"
                      title="Download stems"
                    >
                      {loadingStems === track.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lyrics */}
        {song.lyrics && (
          <Card variant="glass" className="p-5">
            <h3 className="mb-3 text-sm font-medium text-neutral-300">Lyrics</h3>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-200">
              {song.lyrics}
            </pre>
          </Card>
        )}

        {/* Song Essence summary */}
        {song.song_essence && (
          <Card variant="glass" className="p-5">
            <h3 className="mb-3 text-sm font-medium text-neutral-300">Song Essence</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-neutral-500">About:</span>
                <p className="text-neutral-200">{(song.song_essence as { song_idea?: string }).song_idea}</p>
              </div>
              <div>
                <span className="text-neutral-500">Message:</span>
                <p className="text-neutral-200">{(song.song_essence as { core_message?: string }).core_message}</p>
              </div>
              <div>
                <span className="text-neutral-500">Style:</span>
                <p className="text-neutral-200">{(song.song_essence as { energy_style?: string }).energy_style}</p>
              </div>
              <div>
                <span className="text-neutral-500">Arc:</span>
                <p className="text-neutral-200">
                  {(song.song_essence as { emotional_start?: string }).emotional_start}
                  {' → '}
                  {(song.song_essence as { emotional_destination?: string }).emotional_destination}
                </p>
              </div>
            </div>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
