'use client'

/**
 * Everything the app-style audio browser shows, as one shape: an "audio
 * collection" (a Life Vision set, a story, a song, an artist, a playlist)
 * with a cover, a subtitle and a way to load its tracks. Reuses the same
 * tables, routes and track rules as the audio studio.
 */

import { createClient } from '@/lib/supabase/client'
import type { AudioTrack } from '@/lib/design-system/components/media/types'
import type { AudioContentCategory } from '@/lib/stores/global-audio-store'
import { loadAudioSetTracks } from '@/components/dashboard/widgets/queries'
import { storyTextMatchesTrack } from '@/lib/audio/content-normalize'
import { MIX_COVERS, mixTypeFor, type MixType } from '@/lib/audio/mix-covers'
import { getPlaylistTracks, getUserPlaylists, playlistTracksToAudioTracks } from '@/lib/services/playlistService'

export type AudioTab = 'life-vision' | 'stories' | 'meditations' | 'music' | 'playlists' | 'songs'

export const AUDIO_TABS: { id: AudioTab; label: string; href: string }[] = [
  { id: 'life-vision', label: 'Life Vision', href: '/audio' },
  { id: 'stories', label: 'Stories', href: '/audio/stories' },
  { id: 'meditations', label: 'Meditations', href: '/meditations' },
  { id: 'music', label: 'Music', href: '/audio/music' },
  { id: 'playlists', label: 'Playlists', href: '/audio/playlists' },
  { id: 'songs', label: 'My Songs', href: '/audio/songs' },
]

export function tabForPath(pathname: string | null): AudioTab {
  const match = AUDIO_TABS.find((t) => t.href !== '/audio' && pathname?.startsWith(t.href))
  return match?.id ?? 'life-vision'
}

export interface AudioCollection {
  key: string
  title: string
  subtitle: string
  artwork: string | null
  category: AudioContentCategory
  iconKey: string
  /** A label on the cover itself, e.g. "Voice only" so nobody expects music. */
  badge?: string
  /** Small facts shown on the set page (voice, background, frequency...). */
  chips?: string[]
  loadTracks: () => Promise<AudioTrack[]>
}

function mixNumbers(mixRatio?: string) {
  const m = mixRatio?.match(/(\d+)%\s*\/\s*(\d+)%/)
  return { voice: m ? parseInt(m[1]) : 100, background: m ? parseInt(m[2]) : 0 }
}

const VOICES: Record<string, string> = { alloy: 'Alloy', shimmer: 'Shimmer', ash: 'Ash', coral: 'Coral', echo: 'Echo', fable: 'Fable', onyx: 'Onyx', nova: 'Nova', sage: 'Sage' }

export function lifeVisionMixType(set: { variant?: string; mixRatio?: string }): MixType {
  const { voice, background } = mixNumbers(set.mixRatio)
  return mixTypeFor(set.variant, voice, background)
}

/** Same naming the studio uses for a Life Vision set. */
export function lifeVisionSetName(set: { name?: string; variant?: string; voice_id?: string; mixRatio?: string }): string {
  if (set.name && !set.name.includes('Version') && !set.name.includes(':')) return set.name
  if (set.variant === 'personal') return 'Personal Recording'
  const { voice, background } = mixNumbers(set.mixRatio)
  if (background === 0 || set.variant === 'standard') return `Voice Only · ${VOICES[set.voice_id ?? ''] ?? set.voice_id ?? ''}`
  if (voice <= 30) return 'Sleep'
  if (voice >= 40 && voice <= 60) return 'Meditation'
  return 'Power'
}

export function lifeVisionCollection(
  set: {
    id: string
    name: string
    variant: string
    voice_id: string
    track_count: number
    mixRatio?: string
    backgroundTrack?: string
    frequencyTrack?: string
    isReady: boolean
    metadata?: { voice_volume?: number; bg_volume?: number } | null
  },
  visionTitle: string,
): AudioCollection {
  const mixType = lifeVisionMixType(set)
  const artwork = MIX_COVERS[mixType]
  const chips = [
    set.voice_id && set.variant !== 'personal' ? `Voice · ${VOICES[set.voice_id] ?? set.voice_id}` : set.variant === 'personal' ? 'Your voice' : null,
    set.backgroundTrack ?? null,
    set.frequencyTrack ?? null,
    set.mixRatio ?? null,
  ].filter((c): c is string => Boolean(c))
  return {
    key: `set:${set.id}`,
    title: lifeVisionSetName(set),
    subtitle: `${visionTitle} · ${set.track_count} track${set.track_count === 1 ? '' : 's'}`,
    artwork,
    badge: mixType === 'voice-only' ? 'Voice only' : undefined,
    category: 'life_vision',
    iconKey: 'life_vision',
    chips,
    loadTracks: async () =>
      (await loadAudioSetTracks(set.id)).map((t) => ({
        id: t.id,
        title: t.title,
        artist: lifeVisionSetName(set),
        duration: t.duration,
        url: t.url,
        thumbnail: artwork ?? '',
        sectionKey: t.sectionKey,
      })),
  }
}

interface StoryLike {
  id: string
  title?: string | null
  content?: string | null
  entity_type?: string | null
  audio_set_id?: string | null
  user_audio_url?: string | null
  metadata?: { is_incantation?: boolean; is_spark_query?: boolean } | null
}

function storyKind(story: StoryLike): string {
  if (story.metadata?.is_spark_query) return 'SparkQuery'
  if (story.metadata?.is_incantation) return 'Incantation'
  return 'Story'
}

export function storyCollection(story: StoryLike, artwork: string | null): AudioCollection {
  const title = story.title || 'Untitled Story'
  return {
    key: `story:${story.id}`,
    title,
    subtitle: storyKind(story),
    artwork,
    category: 'story',
    iconKey: 'stories',
    loadTracks: async () => {
      const supabase = createClient()
      const tracks: AudioTrack[] = []
      let audioSetId = story.audio_set_id ?? null
      if (!audioSetId) {
        const { data } = await supabase
          .from('audio_sets')
          .select('id')
          .eq('content_type', 'story')
          .eq('content_id', story.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        audioSetId = data?.id ?? null
      }
      if (audioSetId) {
        const { data: rows } = await supabase
          .from('audio_tracks')
          .select('id, audio_url, text_content, duration_seconds')
          .eq('audio_set_id', audioSetId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
        const current = (rows ?? []).filter((r) => storyTextMatchesTrack(story.content, r.text_content))
        current.forEach((r, i) => {
          if (!r.audio_url) return
          tracks.push({
            id: `${story.id}:track:${r.id}`,
            title: current.length > 1 ? `${title} (${i + 1}/${current.length})` : title,
            artist: storyKind(story),
            duration: Number(r.duration_seconds) || 0,
            url: r.audio_url,
            thumbnail: artwork ?? '',
          })
        })
      }
      if (story.user_audio_url) {
        tracks.push({
          id: `${story.id}:user-recording`,
          title: `${title} · Your voice`,
          artist: storyKind(story),
          duration: 0,
          url: story.user_audio_url,
          thumbnail: artwork ?? '',
        })
      }
      return tracks
    },
  }
}

/** The member's own finished songs, newest first, with their cover art. */
export async function loadMySongs(): Promise<AudioCollection[]> {
  const supabase = createClient()
  const { data: songs } = await supabase
    .from('songs')
    .select('id, title, created_at, song_tracks(id, title, version, mp3_url, cover_url, duration_ms)')
    .neq('entity_type', 'meditation')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(50)
  return (songs ?? []).map((song) => {
    const versions = ((song.song_tracks ?? []) as { id: string; title: string | null; version: number | null; mp3_url: string | null; cover_url: string | null; duration_ms: number | null }[])
      .filter((t) => t.mp3_url)
    const cover = versions.find((v) => v.cover_url)?.cover_url ?? null
    return {
      key: `song:${song.id}`,
      title: song.title || 'Untitled song',
      subtitle: `${versions.length} version${versions.length === 1 ? '' : 's'}`,
      artwork: cover,
      category: 'music' as const,
      iconKey: 'music',
      loadTracks: async () =>
        versions.map((v, i) => ({
          id: v.id,
          title: song.title || 'Untitled song',
          artist: 'You',
          versionLabel: v.title || `Version ${v.version ?? i + 1}`,
          duration: v.duration_ms ? v.duration_ms / 1000 : 0,
          url: v.mp3_url!,
          thumbnail: v.cover_url ?? cover ?? '',
        })),
    }
  })
}

/** Vibration Fit music, browsed by artist. */
export async function loadArtists(): Promise<AudioCollection[]> {
  const res = await fetch('/api/music/artists')
  if (!res.ok) return []
  const { artists = [] } = (await res.json()) as { artists?: { id: string; name: string; avatarUrl?: string | null; songCount?: number }[] }
  return artists.map((a) => ({
    key: `artist:${a.id}`,
    title: a.name,
    subtitle: `${a.songCount ?? 0} song${a.songCount === 1 ? '' : 's'}`,
    artwork: a.avatarUrl ?? null,
    category: 'music' as const,
    iconKey: 'music',
    loadTracks: async () => {
      const r = await fetch(`/api/music/artists/${a.id}/tracks?limit=200`)
      if (!r.ok) return []
      const { tracks = [] } = (await r.json()) as { tracks?: AudioTrack[] }
      return tracks
    },
  }))
}

export async function loadPlaylists(): Promise<AudioCollection[]> {
  const lists = await getUserPlaylists()
  return lists.map((p) => ({
    key: `playlist:${p.id}`,
    title: p.name,
    subtitle: `${p.track_count} track${p.track_count === 1 ? '' : 's'}`,
    artwork: null,
    category: 'life_vision' as const,
    iconKey: 'list-music',
    loadTracks: async () => playlistTracksToAudioTracks(await getPlaylistTracks(p.id)),
  }))
}
