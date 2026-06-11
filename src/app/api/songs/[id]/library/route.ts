/**
 * Toggle Member Library status on a Song Track
 *
 * POST /api/songs/[id]/library
 * Body: { track_id: string }
 *
 * Sets in_member_library = !current value. Tracks in the member library
 * appear on /audio/music under the "Member Library" filter.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

    const adminDb = createAdminClient()

    const { data: track, error: fetchError } = await adminDb
      .from('song_tracks')
      .select('id, in_member_library')
      .eq('id', track_id)
      .eq('song_id', songId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    const newValue = !track.in_member_library

    const { error: updateError } = await adminDb
      .from('song_tracks')
      .update({ in_member_library: newValue })
      .eq('id', track_id)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({
      track_id,
      in_member_library: newValue,
    })
  } catch (err) {
    console.error('[SongLibrary] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to toggle library status',
    }, { status: 500 })
  }
}
