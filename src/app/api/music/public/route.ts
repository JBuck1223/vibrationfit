/**
 * GET /api/music/public
 *
 * Public (unauthenticated) endpoint for the /music discover page.
 * Returns everything playable on /audio/music — all active music_catalog
 * tracks (official + member library) plus any song_tracks members opted into
 * public listing that aren't already in the catalog. Share tokens are minted
 * lazily for returned tracks so every card can link to /music/[token].
 *
 * Uses the admin client since music_catalog is authenticated-only and
 * song_tracks RLS is owner-only.
 *
 * Query params: limit (default 24, max 60), offset (default 0)
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { musicCatalogArtistFallback } from '@/lib/audio/music-performers'
import { officialCatalogCreatorUserId } from '@/lib/songs/catalog-sync'

export const dynamic = 'force-dynamic'

interface PublicTrackEntry {
  id: string
  source: 'catalog' | 'song_track'
  title: string
  artist_name: string
  mp3_url: string
  cover_url: string | null
  duration_ms: number | null
  genres: string[]
  moods: string[]
  share_token: string | null
  shared_at: string | null
  creator_user_id: string | null
  sortRank: number
  sortDate: number
}

function generateShareToken(): string {
  return randomBytes(12).toString('base64url')
}

export async function GET(request: NextRequest) {
  try {
    const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '24', 10) || 24, 1), 60)
    const offset = Math.max(parseInt(request.nextUrl.searchParams.get('offset') || '0', 10) || 0, 0)

    const adminDb = createAdminClient()

    const [{ data: catalogRows, error: catalogError }, { data: songTracks, error: tracksError }] = await Promise.all([
      adminDb
        .from('music_catalog')
        .select('id, title, album, artwork_url, preview_url, duration_seconds, tags, description, genre, is_featured, created_at, share_token')
        .eq('is_active', true)
        .not('preview_url', 'is', null),
      adminDb
        .from('song_tracks')
        .select('id, song_id, user_id, title, mp3_url, cover_url, duration_ms, genres, moods, share_token, shared_at, created_at')
        .eq('is_public', true)
        .eq('is_shared', true)
        .not('mp3_url', 'is', null)
        .not('share_token', 'is', null),
    ])

    if (catalogError || tracksError) {
      console.error('[PublicMusic] Failed to load tracks:', catalogError || tracksError)
      return NextResponse.json({ error: 'Failed to load music' }, { status: 500 })
    }

    // Member-library tracks are synced into music_catalog, so drop
    // song_tracks whose audio is already represented there.
    const catalogUrls = new Set((catalogRows || []).map(r => r.preview_url))
    const extraTracks = (songTracks || []).filter(t => !catalogUrls.has(t.mp3_url))

    // Resolve creator names for the extra member tracks.
    const songIds = [...new Set(extraTracks.map(t => t.song_id))]
    const userIds = [...new Set(extraTracks.map(t => t.user_id))]
    const [{ data: songs }, { data: accounts }] = await Promise.all([
      songIds.length > 0
        ? adminDb.from('songs').select('id, title').in('id', songIds)
        : Promise.resolve({ data: [] as { id: string; title: string | null }[] }),
      userIds.length > 0
        ? adminDb.from('user_accounts').select('id, full_name, first_name, last_name').in('id', userIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string | null; first_name: string | null; last_name: string | null }[] }),
    ])
    const songTitleById = Object.fromEntries((songs || []).map(s => [s.id, s.title]))
    const accountById = Object.fromEntries((accounts || []).map(a => [a.id, a]))

    const entries: PublicTrackEntry[] = [
      ...(catalogRows || []).map((t): PublicTrackEntry => ({
        id: t.id,
        source: 'catalog',
        title: t.title,
        artist_name: musicCatalogArtistFallback(t.id, null, { description: t.description, tags: t.tags }),
        mp3_url: t.preview_url!,
        cover_url: t.artwork_url || null,
        duration_ms: typeof t.duration_seconds === 'number' ? t.duration_seconds * 1000 : null,
        genres: t.genre ? [t.genre] : [],
        moods: [],
        share_token: t.share_token || null,
        shared_at: t.created_at || null,
        creator_user_id: officialCatalogCreatorUserId(t),
        // Featured first, holiday tracks last — mirrors /audio/music ordering.
        sortRank: t.genre === 'Holiday' ? 2 : t.is_featured ? 0 : 1,
        sortDate: t.created_at ? new Date(t.created_at).getTime() : 0,
      })),
      ...extraTracks.map((t): PublicTrackEntry => {
        const account = accountById[t.user_id]
        const artistName = account?.full_name
          || [account?.first_name, account?.last_name].filter(Boolean).join(' ').trim()
          || 'Vibration Fit Member'
        return {
          id: t.id,
          source: 'song_track',
          title: t.title || songTitleById[t.song_id] || 'VIVA Song',
          artist_name: artistName,
          mp3_url: t.mp3_url!,
          cover_url: t.cover_url,
          duration_ms: t.duration_ms,
          genres: t.genres || [],
          moods: t.moods || [],
          share_token: t.share_token,
          shared_at: t.shared_at,
          creator_user_id: t.user_id,
          sortRank: 1,
          sortDate: new Date(t.shared_at || t.created_at || 0).getTime(),
        }
      }),
    ]

    entries.sort((a, b) => a.sortRank - b.sortRank || b.sortDate - a.sortDate)

    const page = entries.slice(offset, offset + limit)

    // Mint share tokens for catalog tracks on this page that don't have one
    // yet, so every card links to a working /music/[token] page.
    await Promise.all(
      page
        .filter(e => e.source === 'catalog' && !e.share_token)
        .map(async (entry) => {
          const token = generateShareToken()
          const { data: updated } = await adminDb
            .from('music_catalog')
            .update({ share_token: token })
            .eq('id', entry.id)
            .is('share_token', null)
            .select('share_token')
            .maybeSingle()
          if (updated?.share_token) {
            entry.share_token = updated.share_token
          } else {
            // Concurrent request may have minted one — re-read it.
            const { data: row } = await adminDb
              .from('music_catalog')
              .select('share_token')
              .eq('id', entry.id)
              .maybeSingle()
            entry.share_token = row?.share_token || null
          }
        })
    )

    // Artist page handles (referral code = app-wide username, else user id).
    const creatorIds = [...new Set(page.map(e => e.creator_user_id).filter(Boolean))] as string[]
    let handleByUserId: Record<string, string> = {}
    if (creatorIds.length > 0) {
      const { data: participants } = await adminDb
        .from('referral_participants')
        .select('user_id, referral_code')
        .in('user_id', creatorIds)
      handleByUserId = Object.fromEntries(
        (participants || []).filter(p => p.user_id && p.referral_code).map(p => [p.user_id, p.referral_code])
      )
    }

    const result = page
      .filter(e => e.share_token)
      .map(({ sortRank: _rank, sortDate: _date, source: _source, creator_user_id, ...track }) => ({
        ...track,
        artist_href: creator_user_id
          ? `/music/artist/${encodeURIComponent(handleByUserId[creator_user_id] || creator_user_id)}`
          : null,
      }))

    return NextResponse.json({
      tracks: result,
      total: entries.length,
      limit,
      offset,
    })
  } catch (err) {
    console.error('[PublicMusic] Error:', err)
    return NextResponse.json({ error: 'Failed to load music' }, { status: 500 })
  }
}
