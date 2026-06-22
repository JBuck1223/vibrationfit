/**
 * GET /api/music/artists/[id]/tracks?limit&offset
 *
 * Returns AudioTrack[] for a single artist:
 *  - id === 'vibrationfit': the official admin-curated catalog (music_catalog).
 *  - otherwise id is a member user id: that member's Member Library songs
 *    (song_tracks.in_member_library = true), one row per song.
 *
 * Reads cross-member data with the admin client (song_tracks RLS is owner-only).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  isOfficialMusicCatalogTrack,
  compareMusicCatalogByTitle,
} from '@/lib/songs/catalog-sync'
import {
  musicCatalogArtistFallback,
  musicCatalogPerformerLinks,
} from '@/lib/audio/music-performers'
import { convertMurekaLyrics } from '@/lib/utils/lyrics-alignment'
import { OFFICIAL_ARTIST_ID } from '@/lib/music/artists'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 100

interface ArtistTrack {
  id: string
  title: string
  artist: string
  performers: { name: string; snapshotHref: string }[]
  albumLabel?: string
  duration: number
  url: string
  thumbnail: string
  sectionKey: 'music'
  syncedLyrics?: unknown
  plainLyrics?: string
  publishStatus?: 'published'
  memberCreated?: boolean
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || DEFAULT_LIMIT, 500)
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

    const adminDb = createAdminClient()

    // ── Official Vibration Fit catalog ────────────────────────────────────────
    if (id === OFFICIAL_ARTIST_ID) {
      const { data: rows, error } = await adminDb
        .from('music_catalog')
        .select('id, title, album, artwork_url, preview_url, duration_seconds, synced_lyrics, plain_lyrics, description, tags')
        .eq('is_active', true)

      if (error) {
        console.error('[ArtistTracks] Official catalog error:', error)
        return NextResponse.json({ error: 'Failed to load tracks' }, { status: 500 })
      }

      const official = (rows || [])
        .filter(r => r.preview_url && isOfficialMusicCatalogTrack(r))
        .sort(compareMusicCatalogByTitle)
        .slice(offset, offset + limit)
        .map((t): ArtistTrack => ({
          id: t.id,
          title: t.title,
          artist: musicCatalogArtistFallback(t.id, t.album, { description: t.description, tags: t.tags }),
          performers: musicCatalogPerformerLinks(t.id, { description: t.description, tags: t.tags }),
          albumLabel: (t.album || '').trim() || undefined,
          duration: typeof t.duration_seconds === 'number' && isFinite(t.duration_seconds) ? t.duration_seconds : 0,
          url: t.preview_url!,
          thumbnail: t.artwork_url || '',
          sectionKey: 'music',
          syncedLyrics: t.synced_lyrics || undefined,
          plainLyrics: t.plain_lyrics || undefined,
        }))

      return NextResponse.json({ tracks: official })
    }

    // ── Member artist: their Member Library songs ─────────────────────────────
    const { data: tracks, error } = await adminDb
      .from('song_tracks')
      .select('id, song_id, title, version, mp3_url, cover_url, duration_ms, is_favorite, created_at, metadata')
      .eq('user_id', id)
      .eq('in_member_library', true)
      .not('mp3_url', 'is', null)

    if (error) {
      console.error('[ArtistTracks] Member tracks error:', error)
      return NextResponse.json({ error: 'Failed to load tracks' }, { status: 500 })
    }

    // Keep one track per song (prefer favorite, then latest version, then newest).
    type MemberTrackRow = NonNullable<typeof tracks>[number]
    const bySong = new Map<string, MemberTrackRow>()
    for (const t of tracks || []) {
      const existing = bySong.get(t.song_id)
      if (!existing) {
        bySong.set(t.song_id, t)
        continue
      }
      const better =
        (Number(t.is_favorite) - Number(existing.is_favorite)) ||
        ((t.version || 0) - (existing.version || 0)) ||
        (new Date(t.created_at).getTime() - new Date(existing.created_at).getTime())
      if (better > 0) bySong.set(t.song_id, t)
    }
    const deduped = [...bySong.values()]

    // Song titles + lyrics.
    const songIds = [...new Set(deduped.map(t => t.song_id))]
    let songMap: Record<string, { title: string | null; lyrics: string | null }> = {}
    if (songIds.length > 0) {
      const { data: songs } = await adminDb
        .from('songs')
        .select('id, title, lyrics')
        .in('id', songIds)
      if (songs) {
        songMap = Object.fromEntries(songs.map(s => [s.id, { title: s.title, lyrics: s.lyrics }]))
      }
    }

    // Creator display name.
    const { data: account } = await adminDb
      .from('user_accounts')
      .select('full_name, first_name, last_name')
      .eq('id', id)
      .maybeSingle()
    const artistName = account?.full_name
      || [account?.first_name, account?.last_name].filter(Boolean).join(' ').trim()
      || 'VibrationFit Member'

    // Which are published (live on streaming) -> music_catalog with 'published' tag.
    const mp3Urls = deduped.map(t => t.mp3_url).filter(Boolean) as string[]
    let publishedUrls = new Set<string>()
    if (mp3Urls.length > 0) {
      const { data: published } = await adminDb
        .from('music_catalog')
        .select('preview_url')
        .in('preview_url', mp3Urls)
        .contains('tags', ['published'])
      if (published) {
        publishedUrls = new Set(published.map(p => p.preview_url).filter(Boolean) as string[])
      }
    }

    const snapshotHref = `/snapshot/${id}`
    const mapped: ArtistTrack[] = deduped
      .map((t): ArtistTrack => {
        // Mureka word-level timing is persisted on the track at generation time.
        const meta = (t.metadata && typeof t.metadata === 'object') ? t.metadata as Record<string, unknown> : null
        const lyricsSections = Array.isArray(meta?.lyrics_sections) ? meta!.lyrics_sections as any[] : null
        return {
          id: t.id,
          title: songMap[t.song_id]?.title || t.title || 'VIVA Song',
          artist: artistName,
          performers: [{ name: artistName, snapshotHref }],
          duration: typeof t.duration_ms === 'number' && isFinite(t.duration_ms) ? Math.round(t.duration_ms / 1000) : 0,
          url: t.mp3_url!,
          thumbnail: t.cover_url || '',
          sectionKey: 'music',
          syncedLyrics: lyricsSections?.length ? convertMurekaLyrics(lyricsSections) : undefined,
          plainLyrics: songMap[t.song_id]?.lyrics || undefined,
          publishStatus: publishedUrls.has(t.mp3_url!) ? 'published' : undefined,
          memberCreated: true,
        }
      })
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true }))
      .slice(offset, offset + limit)

    return NextResponse.json({ tracks: mapped })
  } catch (err) {
    console.error('[ArtistTracks] Error:', err)
    return NextResponse.json({ error: 'Failed to load tracks' }, { status: 500 })
  }
}
