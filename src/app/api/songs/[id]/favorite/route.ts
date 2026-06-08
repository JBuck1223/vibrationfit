/**
 * Toggle Favorite on Song Track
 *
 * POST /api/songs/[id]/favorite
 * Body: { track_id: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { shareTrackToCatalog, unshareTrackFromCatalog } from '@/lib/songs/catalog-sync'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: songId } = await params
    const { track_id } = await request.json()

    if (!track_id) {
      return NextResponse.json({ error: 'track_id is required' }, { status: 400 })
    }

    const { data: track, error: fetchError } = await supabase
      .from('song_tracks')
      .select('id, is_favorite, mp3_url')
      .eq('id', track_id)
      .eq('song_id', songId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    const newFavorite = !track.is_favorite

    const { error: updateError } = await supabase
      .from('song_tracks')
      .update({ is_favorite: newFavorite })
      .eq('id', track_id)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update favorite' }, { status: 500 })
    }

    // Heart = share to the public catalog; unheart = remove it.
    const adminDb = createAdminClient()
    try {
      if (newFavorite) {
        await shareTrackToCatalog(adminDb, { userId: user.id, songId, trackId: track_id })
      } else {
        await unshareTrackFromCatalog(adminDb, track.mp3_url)
      }
    } catch (syncErr) {
      // Favorite state already saved; catalog sync is best-effort.
      console.error('[SongFavorite] Catalog sync failed:', syncErr)
    }

    return NextResponse.json({
      track_id,
      is_favorite: newFavorite,
    })
  } catch (err) {
    console.error('[SongFavorite] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to toggle favorite',
    }, { status: 500 })
  }
}
