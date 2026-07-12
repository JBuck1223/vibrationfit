/**
 * Public song sharing helpers (server-only).
 *
 * A share token can point to either source of /audio/music tracks:
 *  - song_tracks: a member's track, public when they shared it directly
 *    (is_shared) or put it in the member library (in_member_library)
 *  - music_catalog: an official catalog track (active rows only)
 *
 * Uses the admin client since song_tracks RLS is owner-only and music_catalog
 * is authenticated-only. Shared by the /music/[token] page and
 * GET /api/songs/shared/[token].
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { officialCatalogCreatorUserId } from '@/lib/songs/catalog-sync'
import type { MurekaLyricsSection, SyncedLyrics } from '@/lib/utils/lyrics-alignment'

export interface SharedTrack {
  id: string
  title: string
  artist_name: string
  artist_avatar_url: string | null
  mp3_url: string
  cover_url: string | null
  duration_ms: number | null
  genres: string[]
  moods: string[]
  lyrics: string | null
  lyrics_sections: MurekaLyricsSection[] | null
  /** Pre-converted synced lyrics (music_catalog rows store this format) */
  synced_lyrics: SyncedLyrics | null
  shared_at: string | null
}

export interface SharedTrackResult {
  track: SharedTrack
  referral_code: string | null
}

async function getCreatorInfo(adminDb: ReturnType<typeof createAdminClient>, userId: string | null) {
  if (!userId) return { name: null, avatarUrl: null, referralCode: null }

  const [{ data: account }, { data: referral }] = await Promise.all([
    adminDb
      .from('user_accounts')
      .select('full_name, first_name, last_name, profile_picture_url')
      .eq('id', userId)
      .maybeSingle(),
    adminDb
      .from('referral_participants')
      .select('referral_code')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const name = account?.full_name
    || [account?.first_name, account?.last_name].filter(Boolean).join(' ').trim()
    || null

  return {
    name,
    avatarUrl: account?.profile_picture_url || null,
    referralCode: referral?.referral_code || null,
  }
}

async function getSharedSongTrack(
  adminDb: ReturnType<typeof createAdminClient>,
  token: string,
): Promise<SharedTrackResult | null> {
  const { data: track, error } = await adminDb
    .from('song_tracks')
    .select('id, song_id, user_id, title, version, mp3_url, cover_url, duration_ms, genres, moods, metadata, shared_at')
    .eq('share_token', token)
    .or('is_shared.eq.true,in_member_library.eq.true')
    .not('mp3_url', 'is', null)
    .maybeSingle()

  if (error || !track) return null

  const [{ data: song }, creator] = await Promise.all([
    adminDb
      .from('songs')
      .select('title, lyrics')
      .eq('id', track.song_id)
      .maybeSingle(),
    getCreatorInfo(adminDb, track.user_id),
  ])

  const metadata = (track.metadata || {}) as Record<string, unknown>
  const lyricsSections = Array.isArray(metadata.lyrics_sections)
    ? (metadata.lyrics_sections as MurekaLyricsSection[])
    : null

  return {
    track: {
      id: track.id,
      title: track.title || song?.title || 'VIVA Song',
      artist_name: creator.name || 'Vibration Fit Member',
      artist_avatar_url: creator.avatarUrl,
      mp3_url: track.mp3_url!,
      cover_url: track.cover_url,
      duration_ms: track.duration_ms,
      genres: track.genres || [],
      moods: track.moods || [],
      lyrics: song?.lyrics || null,
      lyrics_sections: lyricsSections,
      synced_lyrics: null,
      shared_at: track.shared_at,
    },
    referral_code: creator.referralCode,
  }
}

async function getSharedCatalogTrack(
  adminDb: ReturnType<typeof createAdminClient>,
  token: string,
): Promise<SharedTrackResult | null> {
  const { data: row, error } = await adminDb
    .from('music_catalog')
    .select('id, title, album, artist, artwork_url, preview_url, duration_seconds, synced_lyrics, plain_lyrics, tags')
    .eq('share_token', token)
    .eq('is_active', true)
    .not('preview_url', 'is', null)
    .maybeSingle()

  if (error || !row) return null

  const creatorUserId = officialCatalogCreatorUserId(row)
  const creator = await getCreatorInfo(adminDb, creatorUserId)

  const syncedLyrics = row.synced_lyrics && typeof row.synced_lyrics === 'object'
    && Array.isArray((row.synced_lyrics as SyncedLyrics).lines)
    ? (row.synced_lyrics as SyncedLyrics)
    : null

  return {
    track: {
      id: row.id,
      title: row.title,
      artist_name: creator.name || (row.artist || '').trim() || 'Vibration Fit',
      artist_avatar_url: creator.avatarUrl,
      mp3_url: row.preview_url!,
      cover_url: row.artwork_url,
      duration_ms: typeof row.duration_seconds === 'number' ? row.duration_seconds * 1000 : null,
      genres: [],
      moods: [],
      lyrics: row.plain_lyrics,
      lyrics_sections: null,
      synced_lyrics: syncedLyrics,
      shared_at: null,
    },
    referral_code: creator.referralCode,
  }
}

export async function getSharedTrackByToken(token: string): Promise<SharedTrackResult | null> {
  if (!token) return null

  const adminDb = createAdminClient()

  return (
    (await getSharedSongTrack(adminDb, token))
    ?? (await getSharedCatalogTrack(adminDb, token))
  )
}
