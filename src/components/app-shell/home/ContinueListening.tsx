'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Headphones, Loader2, Pause, Play } from 'lucide-react'
import { loadAudioSetTracks, useListenSources, type ListenSource } from '@/components/dashboard/widgets/queries'
import { useGlobalAudioStore, type AudioContentCategory } from '@/lib/stores/global-audio-store'
import type { AudioTrack } from '@/lib/design-system/components/media/types'
import { useThemeImage } from '../ThemeProvider'

const CATEGORY: Record<ListenSource['kind'], AudioContentCategory> = {
  vision: 'life_vision',
  song: 'music',
  story: 'story',
}

const KIND_LABEL: Record<ListenSource['kind'], string> = {
  vision: 'Life Vision',
  song: 'Song',
  story: 'Story',
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * The current track if something is playing, otherwise the best thing to
 * play next (active vision audio first). One tap plays through the global
 * player, so the mini player takes over as the member moves around.
 */
export function ContinueListening() {
  const { data: sources = [], isLoading } = useListenSources()
  const tracks = useGlobalAudioStore((s) => s.tracks)
  const currentIndex = useGlobalAudioStore((s) => s.currentIndex)
  const isPlaying = useGlobalAudioStore((s) => s.isPlaying)
  const currentTime = useGlobalAudioStore((s) => s.currentTime)
  const duration = useGlobalAudioStore((s) => s.duration)
  const setName = useGlobalAudioStore((s) => s.setName)
  const play = useGlobalAudioStore((s) => s.play)
  const togglePlayPause = useGlobalAudioStore((s) => s.togglePlayPause)
  const fallbackArt = useThemeImage('listen.hero')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const current = tracks[currentIndex] ?? null
  const playable = sources.filter((s) => s.trackUrl || s.audioSetId)
  const next = playable[0] ?? null
  const nowPlayingNext = next ? setName === `home:${next.id}` : false

  const handlePlay = async (source: ListenSource) => {
    if (setName === `home:${source.id}`) {
      togglePlayPause()
      return
    }
    setLoadingId(source.id)
    try {
      let list: AudioTrack[] = []
      if (source.trackUrl) {
        list = [{ id: source.id, title: source.title, artist: '', duration: source.durationSeconds ?? 0, url: source.trackUrl, thumbnail: source.artwork ?? '' }]
      } else if (source.audioSetId) {
        const loaded = await loadAudioSetTracks(source.audioSetId)
        list = loaded.map((t) => ({
          id: t.id,
          title: source.kind === 'story' ? source.title : t.title,
          artist: '',
          duration: t.duration,
          url: t.url,
          thumbnail: '',
          sectionKey: t.sectionKey,
        }))
      }
      if (list.length === 0) return
      play(list, 0, `home:${source.id}`, source.kind, CATEGORY[source.kind])
    } finally {
      setLoadingId(null)
    }
  }

  const title = current ? current.title : next?.title
  const subtitle = current ? 'Now playing' : next ? KIND_LABEL[next.kind] : null
  const artwork = current?.thumbnail || next?.artwork || fallbackArt
  const progress = current && duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <section className="glass-panel flex flex-col p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <Headphones className="h-4 w-4 text-[#39FF14]" />
          {current ? 'Continue listening' : 'Listen'}
        </h2>
        <Link href="/listen" className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading && !current ? (
        <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
      ) : !title ? (
        <div className="flex flex-col items-start gap-3 py-2">
          <p className="text-sm text-white/70">Generate your Life Vision audio and it shows up here, ready for one tap.</p>
          <Link href="/audio" className="btn btn-outline !py-2 !px-4 text-sm">
            Open Audio
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/5 md:h-24 md:w-24">
            {artwork && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artwork} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">{subtitle}</p>
            <p className="truncate text-lg font-semibold text-white">{title}</p>
            {current ? (
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full bg-[#39FF14]" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs tabular-nums text-white/60">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-white/60">Your personal activation</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => (current ? togglePlayPause() : next && handlePlay(next))}
            aria-label={isPlaying && (current || nowPlayingNext) ? 'Pause' : 'Play'}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#39FF14] text-black shadow-[0_6px_20px_rgba(57,255,20,0.35)] transition-transform active:scale-95"
          >
            {loadingId ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isPlaying && (current || nowPlayingNext) ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="ml-0.5 h-6 w-6" />
            )}
          </button>
        </div>
      )}
    </section>
  )
}
