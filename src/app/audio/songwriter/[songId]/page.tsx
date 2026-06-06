'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Stack, Card, Button, EmbeddedPlayer } from '@/lib/design-system/components'
import { ChevronLeft, Loader2, RefreshCw } from 'lucide-react'
import { useSong } from '@/lib/songs/hooks/useSong'
import { convertMurekaLyrics } from '@/lib/utils/lyrics-alignment'
import type { AudioTrack } from '@/lib/design-system/components/media/types'

export default function SongDetailPage() {
  const params = useParams()
  const router = useRouter()
  const songId = params.songId as string
  const { song, tracks, loading, error, refetch } = useSong(songId)

  const [polling, setPolling] = useState(false)

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

  const playerTracks: AudioTrack[] = tracks
    .filter(t => t.mp3_url)
    .map(t => {
      const meta = t.metadata as Record<string, unknown> | null
      const lyricsSections = meta?.lyrics_sections as any[] | undefined
      return {
        id: t.id,
        title: t.title || `Version ${t.version}`,
        artist: song?.title || 'VIVA Song',
        duration: t.duration_ms ? t.duration_ms / 1000 : 180,
        url: t.mp3_url!,
        thumbnail: t.cover_url || undefined,
        syncedLyrics: lyricsSections?.length ? convertMurekaLyrics(lyricsSections) : undefined,
        plainLyrics: song?.lyrics || undefined,
      }
    })

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
          <h1 className="flex-1 text-lg font-semibold text-white">{song.title || 'Untitled Song'}</h1>
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
              <p className="text-xs text-neutral-400">VIVA is composing your song. This takes about 45 seconds.</p>
            </div>
          </Card>
        )}

        {/* Player with synced lyrics */}
        {playerTracks.length > 0 && (
          <EmbeddedPlayer
            tracks={playerTracks}
            mapActivityType="song_listen"
            setName={song.title || 'Song'}
            setIconKey="music"
            trackCount={playerTracks.length}
          />
        )}

        {/* Lyrics (shown when no synced lyrics available in player) */}
        {song.lyrics && playerTracks.length === 0 && (
          <Card variant="glass" className="p-5">
            <h3 className="mb-3 text-sm font-medium text-neutral-300">Lyrics</h3>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-200">
              {song.lyrics}
            </pre>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
