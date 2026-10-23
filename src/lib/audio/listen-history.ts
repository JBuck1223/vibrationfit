'use client'

/**
 * Listen history: remembers what each member played through the global
 * player and where they left off, so Home can offer "Continue Listening".
 * One row per audio set (the player's set name), saved when a set starts,
 * when it pauses or changes track, and every 15 seconds while it plays.
 */

import type { AudioTrack } from '@/lib/design-system/components/media/types'
import type { AudioContentCategory } from '@/lib/stores/global-audio-store'

export interface ListenHistoryRow {
  id: string
  set_key: string
  category: AudioContentCategory
  icon_key: string | null
  title: string
  artwork_url: string | null
  tracks: AudioTrack[]
  track_index: number
  position_seconds: number
  duration_seconds: number
  updated_at: string
}

interface PlayerSnapshot {
  tracks: AudioTrack[]
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  setName: string
  setIconKey: string
  contentCategory: AudioContentCategory
}

interface StoreLike {
  getState: () => PlayerSnapshot
  subscribe: (listener: (state: PlayerSnapshot, prev: PlayerSnapshot) => void) => () => void
}

const SAVE_EVERY_MS = 15_000

export function setKeyFor(state: Pick<PlayerSnapshot, 'setName' | 'tracks'>): string | null {
  if (state.setName) return state.setName
  const first = state.tracks[0]
  return first ? `track:${first.id}` : null
}

/** Only what is needed to replay; keeps the stored row small. */
function slimTracks(tracks: AudioTrack[]): AudioTrack[] {
  return tracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist ?? '',
    duration: t.duration ?? 0,
    url: t.url,
    thumbnail: t.thumbnail ?? '',
    ...(t.sectionKey ? { sectionKey: t.sectionKey } : {}),
  }))
}

/** Streams report Infinity until the length is known, which JSON turns into null. */
function wholeSeconds(value: number | undefined): number {
  return value && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

async function save(state: PlayerSnapshot) {
  const key = setKeyFor(state)
  const track = state.tracks[state.currentIndex]
  if (!key || !track) return
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    await supabase.from('audio_listen_history').upsert(
      {
        user_id: session.user.id,
        set_key: key,
        category: state.contentCategory,
        icon_key: state.setIconKey || null,
        title: track.title || 'Untitled',
        artwork_url: track.thumbnail || state.tracks.find((t) => t.thumbnail)?.thumbnail || null,
        tracks: slimTracks(state.tracks),
        track_index: state.currentIndex,
        position_seconds: wholeSeconds(state.currentTime),
        duration_seconds: wholeSeconds(state.duration) || wholeSeconds(track.duration),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,set_key' },
    )
  } catch {
    // History is a convenience; never disturb playback.
  }
}

let started = false

/** Called once by the global audio store in the browser. */
export function startListenHistory(store: StoreLike) {
  if (started || typeof window === 'undefined') return
  started = true
  let lastSavedAt = 0

  store.subscribe((state, prev) => {
    if (state.tracks.length === 0) return
    const setChanged = setKeyFor(state) !== setKeyFor(prev)
    const trackChanged = state.currentIndex !== prev.currentIndex
    const paused = prev.isPlaying && !state.isPlaying
    const startedPlaying = !prev.isPlaying && state.isPlaying
    const due = state.isPlaying && Date.now() - lastSavedAt > SAVE_EVERY_MS

    if (setChanged || trackChanged || paused || startedPlaying || due) {
      lastSavedAt = Date.now()
      void save(state)
    }
  })

  // Leaving the page mid-listen: keep the latest position.
  window.addEventListener('pagehide', () => {
    const state = store.getState()
    if (state.tracks.length > 0) void save(state)
  })
}
