'use client'

import React, { useCallback, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Stack, Card, Button } from '@/lib/design-system/components'
import { ChevronLeft, Loader2, CheckCircle, Headphones, Music2, Music, Share2 } from 'lucide-react'
import { useSong } from '@/lib/songs/hooks/useSong'
import { useSongGeneration } from '@/lib/songs/hooks/useSongGeneration'
import { SongRegeneratePanel } from '@/components/audio-studio/SongRegeneratePanel'
import { ShareSongSheet } from '@/components/audio-studio/ShareSongSheet'
import { SongStorySection } from '@/components/audio-studio/SongStorySection'

export default function SongDetailPage() {
  const params = useParams()
  const router = useRouter()
  const songId = params.songId as string
  const { song, tracks, loading, error, refetch } = useSong(songId)
  const [justCompleted, setJustCompleted] = useState(false)
  const [shareTrack, setShareTrack] = useState<{ trackId: string; title?: string } | null>(null)

  const { generateMore, isGenerating, error: generateError } = useSongGeneration({
    song,
    onComplete: () => {
      refetch()
      setJustCompleted(true)
    },
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

        {justCompleted && tracks.length > 0 && (
          <Card variant="glass" className="border-[#39FF14]/30 p-5">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#39FF14]/10">
                <CheckCircle className="h-7 w-7 text-[#39FF14]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Your song is ready</h3>
                <p className="mt-1 text-sm text-neutral-400">
                  {tracks.length} version{tracks.length !== 1 ? 's' : ''} generated. Head to your library to listen.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => router.push('/audio/songs')}
                className="mt-1"
              >
                <Headphones className="mr-2 h-4 w-4" />
                Listen Now
              </Button>
            </div>
          </Card>
        )}

        {isGenerating && (
          <Card variant="glass" className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#39FF14]/10">
                <Music2 className="h-5 w-5 animate-pulse text-[#39FF14]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">VIVA is composing your track...</p>
                <p className="mt-0.5 text-xs text-neutral-500">This usually takes 1-3 minutes</p>
              </div>
              <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
            </div>
          </Card>
        )}

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

        {tracks.filter(t => t.status === 'completed' && t.mp3_url).length > 0 && (
          <Card variant="glass" className="p-5">
            <h3 className="mb-3 text-sm font-medium text-neutral-300">Versions</h3>
            <div className="space-y-1">
              {tracks
                .filter(t => t.status === 'completed' && t.mp3_url)
                .map(track => (
                  <div key={track.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5">
                    {track.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={track.cover_url}
                        alt=""
                        className="h-9 w-9 flex-shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-neutral-800">
                        <Music className="h-4 w-4 text-neutral-500" />
                      </div>
                    )}
                    <p className="flex-1 min-w-0 truncate text-sm text-neutral-200">
                      {track.title || song.title || 'Untitled'} — v{track.version}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShareTrack({ trackId: track.id, title: track.title || song.title || undefined })}
                      className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </button>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {tracks.some(t => t.status === 'completed' && t.mp3_url) && (
          <SongStorySection song={song} onSaved={refetch} />
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

      {shareTrack && (
        <ShareSongSheet
          isOpen={true}
          onClose={() => setShareTrack(null)}
          songId={songId}
          trackId={shareTrack.trackId}
          trackTitle={shareTrack.title}
        />
      )}
    </Container>
  )
}
