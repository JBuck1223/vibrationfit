/**
 * GET /api/music/public
 *
 * Public (unauthenticated) endpoint for the /music discover page.
 * Returns a paginated list of song tracks members have opted into public
 * listing (song_tracks.is_public = true). Uses the admin client since
 * song_tracks RLS is owner-only.
 *
 * Query params: limit (default 24, max 60), offset (default 0)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '24', 10) || 24, 1), 60)
    const offset = Math.max(parseInt(request.nextUrl.searchParams.get('offset') || '0', 10) || 0, 0)

    const adminDb = createAdminClient()

    const { data: tracks, error, count } = await adminDb
      .from('song_tracks')
      .select('id, song_id, user_id, title, mp3_url, cover_url, duration_ms, genres, moods, share_token, shared_at', { count: 'exact' })
      .eq('is_public', true)
      .eq('is_shared', true)
      .not('mp3_url', 'is', null)
      .not('share_token', 'is', null)
      .order('shared_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[PublicMusic] Failed to load tracks:', error)
      return NextResponse.json({ error: 'Failed to load music' }, { status: 500 })
    }

    const songIds = [...new Set((tracks || []).map(t => t.song_id))]
    const userIds = [...new Set((tracks || []).map(t => t.user_id))]

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

    const result = (tracks || []).map(t => {
      const account = accountById[t.user_id]
      const artistName = account?.full_name
        || [account?.first_name, account?.last_name].filter(Boolean).join(' ').trim()
        || 'Vibration Fit Member'
      return {
        id: t.id,
        title: t.title || songTitleById[t.song_id] || 'VIVA Song',
        artist_name: artistName,
        mp3_url: t.mp3_url,
        cover_url: t.cover_url,
        duration_ms: t.duration_ms,
        genres: t.genres || [],
        moods: t.moods || [],
        share_token: t.share_token,
        shared_at: t.shared_at,
      }
    })

    return NextResponse.json({
      tracks: result,
      total: count ?? result.length,
      limit,
      offset,
    })
  } catch (err) {
    console.error('[PublicMusic] Error:', err)
    return NextResponse.json({ error: 'Failed to load music' }, { status: 500 })
  }
}
