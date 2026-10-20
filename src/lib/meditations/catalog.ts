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
      .select('id, title')
      .eq('user_id', userId)
      .eq('entity_type', 'meditation'),
    db
      .from('meditations')
      .select('*')
      .or(`user_id.eq.${userId},is_shared.eq.true`)
      .order('created_at', { ascending: false }),
  ])

  const songIds = (ownSongs || []).map((song) => song.id)
  const songTitle = new Map((ownSongs || []).map((song) => [song.id, song.title as string]))

  const { data: ownTracks } = songIds.length
    ? await db
        .from('song_tracks')
        .select('id, song_id, title, mp3_url, user_id, duration_ms, status')
        .in('song_id', songIds)
        .eq('status', 'completed')
    : { data: [] as Array<{ id: string; song_id: string; title: string | null; mp3_url: string | null; user_id: string }> }

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

  for (const track of ownTracks || []) {
    if (!track.mp3_url) continue
    music.push({
      id: track.id,
      source: 'generated',
      title: track.title || songTitle.get(track.song_id) || 'Untitled',
      url: track.mp3_url,
      category: 'meditations',
      creatorId: track.user_id,
      creatorName: names.get(track.user_id) || 'Member',
    })
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
    mine: cards.filter((card) => card.isMine),
    community: cards.filter((card) => card.isShared && !card.isMine),
  }
}
