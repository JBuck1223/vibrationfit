import type { createAdminClient } from '@/lib/supabase/admin'
import { accountDisplayName } from './display-name'
import { FREQUENCY_CATEGORIES } from './constants'

type AdminDb = ReturnType<typeof createAdminClient>

export interface MeditationMusicOption {
  id: string
  source: 'background' | 'generated'
  title: string
  url: string
  category: string
  creatorId: string | null
  creatorName: string | null
}

/** A member's own generated instrumental, listed in the library before it joins the music list. */
export interface MeditationTrack extends MeditationMusicOption {
  source: 'generated'
  songId: string
  durationSeconds: number | null
  bpm: number | null
  mood: string | null
  referenceTitle: string | null
  isFavorite: boolean
  inMusicList: boolean
  createdAt: string
}

export interface MeditationBinauralOption {
  id: string
  title: string
  url: string
  category: string
}

export interface MeditationCard {
  id: string
  userId: string
  title: string
  creatorName: string
  inhaleSeconds: number
  exhaleSeconds: number
  holdSeconds: number
  durationMinutes: number
  musicTitle: string | null
  musicUrl: string | null
  musicBackgroundTrackId: string | null
  musicSongTrackId: string | null
  musicVolume: number
  binauralTitle: string | null
  binauralUrl: string | null
  binauralTrackId: string | null
  binauralVolume: number
  bpm: number | null
  mood: string | null
  isShared: boolean
  isFavorite: boolean
  isMine: boolean
}

interface MeditationRow {
  id: string
  user_id: string
  title: string
  inhale_seconds: number
  exhale_seconds: number
  hold_seconds: number | null
  duration_minutes: number
  music_background_track_id: string | null
  music_song_track_id: string | null
  music_volume: number
  binaural_track_id: string | null
  binaural_volume: number
  bpm: number | null
  mood: string | null
  is_shared: boolean
  is_favorite: boolean
}

interface OwnTrackRow {
  id: string
  song_id: string
  title: string | null
  version: string
  mp3_url: string | null
  user_id: string
  duration_ms: number | null
  is_favorite: boolean
  metadata: unknown
  created_at: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

export async function loadMeditationCatalog(db: AdminDb, userId: string) {
  const [{ data: beds }, { data: binauralRows }, { data: ownSongs }, { data: sessions }] = await Promise.all([
    db
      .from('audio_background_tracks')
      .select('id, display_name, category, file_url, created_by, is_active')
      .eq('is_active', true)
      .order('sort_order'),
    db
      .from('audio_background_tracks')
      .select('id, display_name, category, file_url')
      .eq('is_active', true)
      .in('category', [...FREQUENCY_CATEGORIES])
      .order('sort_order'),
    db
      .from('songs')
      .select('id, title, metadata')
      .eq('user_id', userId)
      .eq('entity_type', 'meditation'),
    db
      .from('meditations')
      .select('*')
      .or(`user_id.eq.${userId},is_shared.eq.true`)
      .order('created_at', { ascending: false }),
  ])

  const songIds = (ownSongs || []).map((song) => song.id)
  const songById = new Map((ownSongs || []).map((song) => [song.id, song]))

  const { data: ownTracks } = songIds.length
    ? await db
        .from('song_tracks')
        .select('id, song_id, title, version, mp3_url, user_id, duration_ms, is_favorite, metadata, created_at')
        .in('song_id', songIds)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
    : { data: [] as OwnTrackRow[] }

  const sessionRows = (sessions || []) as MeditationRow[]
  const songTrackIds = [
    ...new Set(sessionRows.map((row) => row.music_song_track_id).filter((id): id is string => Boolean(id))),
  ]
  const { data: sessionTracks } = songTrackIds.length
    ? await db
        .from('song_tracks')
        .select('id, title, mp3_url, user_id')
        .in('id', songTrackIds)
    : { data: [] as Array<{ id: string; title: string | null; mp3_url: string | null; user_id: string }> }

  const creatorIds = new Set<string>()
  for (const bed of beds || []) {
    if (bed.created_by) creatorIds.add(bed.created_by)
  }
  for (const row of sessionRows) creatorIds.add(row.user_id)
  creatorIds.add(userId)

  const { data: accounts } = creatorIds.size
    ? await db
        .from('user_accounts')
        .select('id, full_name, first_name, last_name')
        .in('id', [...creatorIds])
    : { data: [] as Array<{ id: string; full_name: string | null; first_name: string | null; last_name: string | null }> }

  const names = new Map((accounts || []).map((account) => [account.id, accountDisplayName(account)]))
  const bedById = new Map((beds || []).map((bed) => [bed.id, bed]))
  const trackById = new Map((sessionTracks || []).map((track) => [track.id, track]))
  const ownUrls = new Set((ownTracks || []).map((track) => track.mp3_url).filter((url): url is string => Boolean(url)))

  const music: MeditationMusicOption[] = []
  for (const bed of beds || []) {
    if (!bed.file_url) continue
    if ((FREQUENCY_CATEGORIES as readonly string[]).includes(bed.category)) continue
    if (bed.created_by === userId && ownUrls.has(bed.file_url)) continue
    music.push({
      id: bed.id,
      source: 'background',
      title: bed.display_name,
      url: bed.file_url,
      category: bed.category,
      creatorId: bed.created_by,
      creatorName: bed.created_by ? names.get(bed.created_by) || 'Member' : null,
    })
  }

  const takesPerSong = new Map<string, number>()
  for (const track of (ownTracks || []) as OwnTrackRow[]) {
    takesPerSong.set(track.song_id, (takesPerSong.get(track.song_id) || 0) + 1)
  }

  const tracks: MeditationTrack[] = []
  for (const track of (ownTracks || []) as OwnTrackRow[]) {
    if (!track.mp3_url) continue
    const song = songById.get(track.song_id)
    const songMeta = asRecord(song?.metadata)
    const songTitle = (song?.title as string | null) || 'Untitled'
    const renamed = Boolean(track.title && track.title !== songTitle)
    const baseTitle = track.title || songTitle
    tracks.push({
      id: track.id,
      source: 'generated',
      songId: track.song_id,
      title: !renamed && (takesPerSong.get(track.song_id) || 0) > 1 ? `${baseTitle} · Take ${track.version}` : baseTitle,
      url: track.mp3_url,
      category: 'meditations',
      creatorId: track.user_id,
      creatorName: names.get(track.user_id) || 'Member',
      durationSeconds: track.duration_ms ? Math.round(track.duration_ms / 1000) : null,
      bpm: typeof songMeta.bpm === 'number' ? songMeta.bpm : null,
      mood: typeof songMeta.mood === 'string' && songMeta.mood ? songMeta.mood : null,
      referenceTitle: typeof songMeta.reference_title === 'string' ? songMeta.reference_title : null,
      isFavorite: track.is_favorite,
      inMusicList: asRecord(track.metadata).in_music_list === true,
      createdAt: track.created_at,
    })
  }
  for (const track of tracks) {
    if (track.inMusicList) music.push(track)
  }

  const binaurals: MeditationBinauralOption[] = (binauralRows || [])
    .filter((row) => row.file_url)
    .map((row) => ({
      id: row.id,
      title: row.display_name,
      url: row.file_url as string,
      category: row.category,
    }))

  const cards: MeditationCard[] = sessionRows.map((row) => {
    const bed = row.music_background_track_id ? bedById.get(row.music_background_track_id) : null
    const generated = row.music_song_track_id ? trackById.get(row.music_song_track_id) : null
    const binaural = row.binaural_track_id ? bedById.get(row.binaural_track_id) : null
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      creatorName: names.get(row.user_id) || 'Member',
      inhaleSeconds: row.inhale_seconds,
      exhaleSeconds: row.exhale_seconds,
      holdSeconds: row.hold_seconds ?? 0,
      durationMinutes: row.duration_minutes,
      musicTitle: bed?.display_name || generated?.title || null,
      musicUrl: bed?.file_url || generated?.mp3_url || null,
      musicBackgroundTrackId: row.music_background_track_id,
      musicSongTrackId: row.music_song_track_id,
      musicVolume: Number(row.music_volume),
      binauralTitle: binaural?.display_name || null,
      binauralUrl: binaural?.file_url || null,
      binauralTrackId: row.binaural_track_id,
      binauralVolume: Number(row.binaural_volume),
      bpm: row.bpm,
      mood: row.mood,
      isShared: row.is_shared,
      isFavorite: row.is_favorite,
      isMine: row.user_id === userId,
    }
  })

  return {
    music,
    binaurals,
    tracks,
    mine: cards.filter((card) => card.isMine),
    community: cards.filter((card) => card.isShared && !card.isMine),
  }
}
