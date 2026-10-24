'use client'

import { GLASS_CARD } from '@/lib/app-shell/glass'
import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ChevronRight, Headphones, Loader2, Pause, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'
import { loadAudioSetTracks, useListenSources, type ListenSource } from '@/components/dashboard/widgets/queries'
import { useGlobalAudioStore, type AudioContentCategory } from '@/lib/stores/global-audio-store'
import { setKeyFor, type ListenHistoryRow } from '@/lib/audio/listen-history'
import type { AudioTrack } from '@/lib/design-system/components/media/types'
import type { ThemeSlot } from '@/lib/app-shell/theme-slots'
import { useThemeImage } from '../ThemeProvider'

const CATEGORY_LABEL: Record<AudioContentCategory, string> = {
  life_vision: 'Life Vision',
  story: 'Story',
  music: 'Song',
  meditation: 'Meditation',
}

const SOURCE_CATEGORY: Record<ListenSource['kind'], AudioContentCategory> = {
  vision: 'life_vision',
  song: 'music',
  story: 'story',
}

/** Puts the card's image on tracks that have none, so the player matches the card. */
function withArt(list: AudioTrack[], artwork: string | null): AudioTrack[] {
  return artwork ? list.map((t) => (t.thumbnail ? t : { ...t, thumbnail: artwork })) : list
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`
}

/** The 1–3 audio sets this member played most recently, newest first. */
function useRecentListens() {
  return useQuery({
    queryKey: [...keys.audioSets, 'listen-history', 'recent'],
    queryFn: async (): Promise<ListenHistoryRow[]> => {
      const supabase = createClient()
      const { data } = await supabase
        .from('audio_listen_history')
        .select('id, set_key, category, icon_key, title, artwork_url, tracks, track_index, position_seconds, duration_seconds, updated_at')
        .order('updated_at', { ascending: false })
        .limit(3)
      return (data ?? []) as ListenHistoryRow[]
    },
    staleTime: 15_000,
  })
}

interface PlayedSet {
  setId: string
  name: string
  category: AudioContentCategory
  lastPlayedAt: string
  sectionKey: string | null
}

/**
 * Audio sets played before listen history existed (or on a build without it):
 * every play bumps the track's play_count and updated_at, so the member's most
 * recently bumped tracks point at the sets they listened to last. No position,
 * but it starts on the track they last played.
 */
function usePlayedSets() {
  return useQuery({
    queryKey: [...keys.audioSets, 'listen-history', 'played-sets'],
    queryFn: async (): Promise<PlayedSet[]> => {
      const supabase = createClient()
      // RLS returns the member's own tracks plus household sets they can
      // listen to, which is where shared Life Vision audio lives.
      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('audio_set_id, section_key, updated_at')
        .gt('play_count', 0)
        .not('audio_set_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(40)
      const latest = new Map<string, { updated_at: string; section_key: string | null }>()
      for (const t of tracks ?? []) {
        if (t.audio_set_id && !latest.has(t.audio_set_id)) latest.set(t.audio_set_id, t)
      }
      const ids = [...latest.keys()].slice(0, 3)
      if (ids.length === 0) return []
      const { data: sets } = await supabase.from('audio_sets').select('id, name, content_type').in('id', ids)
      return ids
        .map((id): PlayedSet | null => {
          const set = (sets ?? []).find((x) => x.id === id)
          if (!set) return null
          const hit = latest.get(id)!
          const type = String(set.content_type ?? '')
          const category: AudioContentCategory = type.includes('story') ? 'story' : type.includes('song') || type.includes('music') ? 'music' : 'life_vision'
          return { setId: id, name: set.name || 'Life Vision', category, lastPlayedAt: hit.updated_at, sectionKey: hit.section_key }
        })
        .filter((x): x is PlayedSet => x !== null)
    },
    staleTime: 60_000,
  })
}

function lastPlayed(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 60) return `Played ${Math.max(1, mins)}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Played ${hours}h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Played yesterday' : `Played ${days} days ago`
}

interface CardProps {
  eyebrow: string
  title: string
  subtitle: string | null
  artwork: string | null
  progress: number | null
  timeLabel: string | null
  playing: boolean
  loading: boolean
  onPlay: () => void
}

function ListenCard({ eyebrow, title, subtitle, artwork, progress, timeLabel, playing, loading, onPlay }: CardProps) {
  return (
    <div className={`${GLASS_CARD} flex h-full min-w-0 items-center gap-4 p-3 pr-4`}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/5">
        {artwork && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artwork} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">{eyebrow}</p>
        <p className="truncate text-base font-semibold leading-snug text-white">{title}</p>
        {subtitle && <p className="truncate text-sm text-white/60">{subtitle}</p>}
        {progress !== null && (
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-[#39FF14]" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
            </div>
            {timeLabel && <span className="shrink-0 text-xs tabular-nums text-white/60">{timeLabel}</span>}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onPlay}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white transition-colors hover:border-[#39FF14]/60 hover:text-[#39FF14] active:scale-95"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : playing ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="ml-0.5 h-5 w-5" />
        )}
      </button>
    </div>
  )
}

/**
 * Continue Listening: the one to three audio sets the member played most
 * recently, each resuming where they left off. With no history yet, it offers
 * the best thing to start (their active vision audio first).
 */
export function ContinueListening() {
  const { data: history = [], isLoading: historyLoading } = useRecentListens()
  const { data: sources = [], isLoading: sourcesLoading } = useListenSources()
  const { data: playedSets = [], isLoading: playedLoading } = usePlayedSets()
  const tracks = useGlobalAudioStore((s) => s.tracks)
  const currentIndex = useGlobalAudioStore((s) => s.currentIndex)
  const setName = useGlobalAudioStore((s) => s.setName)
  const isPlaying = useGlobalAudioStore((s) => s.isPlaying)
  const currentTime = useGlobalAudioStore((s) => s.currentTime)
  const duration = useGlobalAudioStore((s) => s.duration)
  const play = useGlobalAudioStore((s) => s.play)
  const togglePlayPause = useGlobalAudioStore((s) => s.togglePlayPause)
  const art = [
    useThemeImage('card.1' as ThemeSlot),
    useThemeImage('card.3' as ThemeSlot),
    useThemeImage('card.5' as ThemeSlot),
  ]
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const liveKey = tracks.length > 0 ? setKeyFor({ setName, tracks }) : null

  const resume = (row: ListenHistoryRow, artwork: string | null) => {
    if (liveKey === row.set_key) {
      togglePlayPause()
      return
    }
    if (!row.tracks?.length) return
    const index = Math.min(row.track_index, row.tracks.length - 1)
    play(withArt(row.tracks, artwork), index, row.set_key, row.icon_key ?? undefined, row.category, Number(row.position_seconds) || 0)
  }

  const startSource = async (source: ListenSource, artwork: string | null) => {
    const key = `home:${source.id}`
    if (liveKey === key) {
      togglePlayPause()
      return
    }
    setLoadingKey(key)
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
      if (list.length > 0) play(withArt(list, artwork), 0, key, source.kind, SOURCE_CATEGORY[source.kind])
    } finally {
      setLoadingKey(null)
    }
  }

  const startPlayedSet = async (set: PlayedSet, artwork: string | null) => {
    const key = `set:${set.setId}`
    if (liveKey === key) {
      togglePlayPause()
      return
    }
    setLoadingKey(key)
    try {
      const loaded = await loadAudioSetTracks(set.setId)
      if (loaded.length === 0) return
      const index = Math.max(0, loaded.findIndex((t) => t.sectionKey === set.sectionKey))
      play(
        withArt(loaded.map((t) => ({ id: t.id, title: t.title, artist: '', duration: t.duration, url: t.url, thumbnail: '', sectionKey: t.sectionKey })), artwork),
        index,
        key,
        set.category === 'life_vision' ? 'vision' : set.category,
        set.category,
      )
    } finally {
      setLoadingKey(null)
    }
  }

  // History first; top up to three with sets played before history existed.
  const fillers = playedSets
    .filter((p) => !history.some((h) => h.set_key.endsWith(p.setId)))
    .slice(0, Math.max(0, 3 - history.length))

  // The fixed mix covers were retired; old history rows may still point at them.
  const savedArt = (url: string | null) => (url && !url.includes('/audio/mix-covers/') ? url : null)

  const loading = historyLoading || playedLoading || (history.length === 0 && fillers.length === 0 && sourcesLoading)
  const starter = sources.find((s) => s.trackUrl || s.audioSetId) ?? null

  return (
    <section className="flex min-w-0 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <Headphones className="h-4 w-4 text-[#39FF14]" />
          Continue Listening
        </h2>
        <Link href="/audio" className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
          See all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-[104px] animate-pulse rounded-3xl bg-white/5 md:max-w-md" />
        </div>
      ) : history.length + fillers.length > 0 ? (
        <ul className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {history.map((row, i) => {
            const artwork = savedArt(row.artwork_url) || art[i % art.length]
            const live = liveKey === row.set_key
            const liveTrack = live ? tracks[currentIndex] : null
            const position = live ? currentTime : Number(row.position_seconds) || 0
            const length = live ? duration : Number(row.duration_seconds) || 0
            const trackCount = row.tracks?.length ?? 0
            const index = live ? currentIndex : row.track_index
            return (
              <li key={row.id} className="min-w-0">
                <ListenCard
                  eyebrow={CATEGORY_LABEL[row.category] ?? 'Audio'}
                  title={liveTrack?.title || row.title}
                  subtitle={trackCount > 1 ? `Track ${index + 1} of ${trackCount}` : live ? 'Now playing' : null}
                  artwork={artwork}
                  progress={length > 0 ? (position / length) * 100 : 0}
                  timeLabel={length > 0 ? `${formatTime(position)} / ${formatTime(length)}` : null}
                  playing={live && isPlaying}
                  loading={false}
                  onPlay={() => resume(row, artwork)}
                />
              </li>
            )
          })}
          {fillers.map((set, i) => {
            const artwork = art[(history.length + i) % art.length]
            const key = `set:${set.setId}`
            const live = liveKey === key
            return (
              <li key={key} className="min-w-0">
                <ListenCard
                  eyebrow={CATEGORY_LABEL[set.category]}
                  title={set.name}
                  subtitle={live ? tracks[currentIndex]?.title ?? 'Now playing' : lastPlayed(set.lastPlayedAt)}
                  artwork={artwork}
                  progress={live && duration > 0 ? (currentTime / duration) * 100 : null}
                  timeLabel={live && duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : null}
                  playing={live && isPlaying}
                  loading={loadingKey === key}
                  onPlay={() => void startPlayedSet(set, artwork)}
                />
              </li>
            )
          })}
        </ul>
      ) : starter ? (
        <div className="md:max-w-md">
        <ListenCard
          eyebrow={starter.kind === 'vision' ? 'Life Vision' : starter.kind === 'song' ? 'Song' : 'Story'}
          title={starter.title}
          subtitle="Your personal activation"
          artwork={starter.artwork ?? art[0]}
          progress={null}
          timeLabel={null}
          playing={liveKey === `home:${starter.id}` && isPlaying}
          loading={loadingKey === `home:${starter.id}`}
          onPlay={() => void startSource(starter, starter.artwork ?? art[0])}
        />
        </div>
      ) : (
        <div className={`${GLASS_CARD} flex flex-col items-start gap-3 p-5 md:max-w-md`}>
          <p className="text-sm text-white/70">Generate your Life Vision audio and it shows up here, ready for one tap.</p>
          <Link href="/audio" className="inline-flex h-9 items-center rounded-full border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-white transition-colors hover:border-white/30">
            Open Audio <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  )
}
