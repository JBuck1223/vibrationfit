'use client'

import React, { useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Stack, Card, Button } from '@/lib/design-system/components'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useSong } from '@/lib/songs/hooks/useSong'
import { useSongGeneration } from '@/lib/songs/hooks/useSongGeneration'
import { SongRegeneratePanel } from '@/components/audio-studio/SongRegeneratePanel'

export default function SongDetailPage() {
  const params = useParams()
  const router = useRouter()
  const songId = params.songId as string
  const { song, tracks, loading, error, refetch } = useSong(songId)

  const { generateMore, isGenerating, error: generateError } = useSongGeneration({
    song,
    onComplete: refetch,
  })

  const handleSaveLyrics = useCallback(async (lyrics: string, stylePrompt: string) => {
    try {
      const res = await fetch(`/api/songs/${songId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics,
          style_prompt: stylePrompt || undefined,
        }),
      })
      if (!res.ok) return false
      await refetch()
      return true
    } catch {
      return false
    }
  }, [songId, refetch])

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

  return (
    <Container size="lg" className="pt-2 pb-8">
      <Stack gap="md">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/audio/songs')} className="text-neutral-400 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-lg font-semibold text-white">{song.title || 'Untitled Song'}</h1>
            <p className="text-xs text-neutral-500">
              {tracks.length} version{tracks.length !== 1 ? 's' : ''}
              {song.generation_count > 0 && ` · ${song.generation_count} generation${song.generation_count !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {song.lyrics && (
          <SongRegeneratePanel
            initialLyrics={song.lyrics}
            initialStylePrompt={song.style_prompt}
            isGenerating={isGenerating}
            error={generateError}
            savedReference={(song.metadata as Record<string, unknown>)?.reference_track as any || null}
            onSaveLyrics={handleSaveLyrics}
            onGenerate={generateMore}
          />
        )}

        {song.lyrics && tracks.length === 0 && !isGenerating && (
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
