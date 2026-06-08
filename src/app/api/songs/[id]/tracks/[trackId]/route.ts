import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; trackId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: songId, trackId } = await params

    const { data: track, error: fetchError } = await supabase
      .from('song_tracks')
      .select('id')
      .eq('id', trackId)
      .eq('song_id', songId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('song_tracks')
      .delete()
      .eq('id', trackId)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete track' }, { status: 500 })
    }

    const { count } = await supabase
      .from('song_tracks')
      .select('id', { count: 'exact', head: true })
      .eq('song_id', songId)

    if (count === 0) {
      await supabase.from('songs').update({ status: 'draft' }).eq('id', songId).eq('user_id', user.id)
    }

    return NextResponse.json({ deleted: trackId, remaining_tracks: count ?? 0 })
  } catch (err) {
    console.error('[DeleteTrack] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to delete track',
    }, { status: 500 })
  }
}
