'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookMarked, Headphones, Loader2, Music2, Pause, Play, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { useGlobalAudioStore, type AudioContentCategory } from '@/lib/stores/global-audio-store'
import type { AudioTrack } from '@/lib/design-system/components/media/types'
import { cn } from '@/lib/utils'
import { WidgetEmpty, WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'
import { loadAudioSetTracks, useAreaStatsQuery, useListenSources, type ListenSource } from './queries'
import { isWideWidget } from '@/lib/dashboard/widgets/registry'

const KIND_META: Record<ListenSource['kind'], { icon: LucideIcon; color: string; category: AudioContentCategory; label: string }> = {
  vision: { icon: Target, color: '#39FF14', category: 'life_vision', label: 'Life Vision' },
  song: { icon: Music2, color: '#BF00FF', category: 'music', label: 'Song' },
  story: { icon: BookMarked, color: '#00FFFF', category: 'story', label: 'Story' },
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function ListenWidget(chrome: WidgetChromeProps) {
  const { data: sources = [], isLoading } = useListenSources()
  const { data: audioStats } = useAreaStatsQuery('vision-audio')
  const play = useGlobalAudioStore((s) => s.play)
  const togglePlayPause = useGlobalAudioStore((s) => s.togglePlayPause)
  const isPlaying = useGlobalAudioStore((s) => s.isPlaying)
  const setName = useGlobalAudioStore((s) => s.setName)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handlePlay = async (source: ListenSource) => {
    const meta = KIND_META[source.kind]
    const nowPlayingThis = setName === `dashboard:${source.id}`
    if (nowPlayingThis) {
      togglePlayPause()
      return
    }

    setLoadingId(source.id)
    try {
      let tracks: AudioTrack[] = []
      if (source.trackUrl) {
        tracks = [
          {
            id: source.id,
            title: source.title,
            artist: '',
            duration: source.durationSeconds ?? 0,
            url: source.trackUrl,
            thumbnail: source.artwork ?? '',
          },
        ]
      } else if (source.audioSetId) {
        const loaded = await loadAudioSetTracks(source.audioSetId)
        tracks = loaded.map((t) => ({
          id: t.id,
          title: source.kind === 'story' ? source.title : t.title,
          artist: '',
          duration: t.duration,
          url: t.url,
          thumbnail: '',
          sectionKey: t.sectionKey,
        }))
      }
      if (tracks.length === 0) return
      play(tracks, 0, `dashboard:${source.id}`, source.kind, meta.category)
    } finally {
      setLoadingId(null)
    }
  }

  const playable = sources.filter((s) => s.trackUrl || s.audioSetId)
  const streak = audioStats?.currentStreak ?? 0
  const todayDone = audioStats?.todayCompleted ?? false

  return (
    <WidgetFrame
      {...chrome}
      title="Listen"
      icon={Headphones}
      accent="#39FF14"
      href="/audio"
      hrefLabel="Audio"
      loading={isLoading}
    >
      {playable.length === 0 ? (
        <WidgetEmpty
          title="Nothing to play yet"
          body="Generate your Life Vision audio and it shows up here, ready for one tap."
          action={
            <Button variant="primary" size="sm" asChild>
              <Link href="/audio">
                Open Audio
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>
              {todayDone
                ? 'You listened today.'
                : streak > 0
                  ? `${streak}-day listening streak. Keep it alive.`
                  : 'One listen a day keeps the vision close.'}
            </span>
          </div>
          <ul className={cn('grid gap-2', isWideWidget(chrome.size) ? 'md:grid-cols-3' : 'grid-cols-1')}>
            {playable.map((source) => {
              const meta = KIND_META[source.kind]
              const Icon = meta.icon
              const current = setName === `dashboard:${source.id}`
              const busy = loadingId === source.id
              return (
                <li
                  key={source.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition-colors',
                    current && 'border-white/20 bg-white/[0.04]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handlePlay(source)}
                    aria-label={current && isPlaying ? `Pause ${source.title}` : `Play ${source.title}`}
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg text-black transition-transform hover:scale-105"
                    style={{ backgroundColor: meta.color }}
                  >
                    {source.artwork ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={source.artwork} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                    ) : null}
                    <span className="relative">
                      {busy ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : current && isPlaying ? (
                        <Pause className="h-5 w-5" fill="currentColor" />
                      ) : (
                        <Play className="h-5 w-5" fill="currentColor" />
                      )}
                    </span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </p>
                    <Link href={source.href} className="block truncate text-sm font-medium text-white hover:underline">
                      {source.title}
                    </Link>
                    <p className="truncate text-[11px] text-neutral-500">
                      {source.subtitle}
                      {source.durationSeconds ? ` · ${formatDuration(source.durationSeconds)}` : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </WidgetFrame>
  )
}
