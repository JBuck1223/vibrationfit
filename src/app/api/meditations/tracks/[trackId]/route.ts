import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncSharedInstrumentalBed } from '@/lib/meditations/register-bed'

export const dynamic = 'force-dynamic'

async function loadOwnTrack(trackId: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: track } = await supabase
    .from('song_tracks')
    .select('id, song_id, title, mp3_url, duration_ms, metadata, songs!inner(entity_type)')
    .eq('id', trackId)
    .eq('user_id', user.id)
    .eq('songs.entity_type', 'meditation')
    .maybeSingle()

  if (!track) return { error: NextResponse.json({ error: 'Track not found' }, { status: 404 }) }
  return { supabase, user, track }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> },
) {
  try {
    const { trackId } = await params
    const loaded = await loadOwnTrack(trackId)
    if ('error' in loaded) return loaded.error
    const { supabase, user, track } = loaded

    const body = await request.json()
    const update: Record<string, unknown> = {}
    if (typeof body.is_favorite === 'boolean') update.is_favorite = body.is_favorite
    if (typeof body.in_music_list === 'boolean') {
      const metadata = track.metadata && typeof track.metadata === 'object'
        ? track.metadata as Record<string, unknown>
        : {}
      update.metadata = { ...metadata, in_music_list: body.in_music_list }
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('song_tracks')
      .update(update)
      .eq('id', trackId)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: trackId })
  } catch (err) {
    console.error('[MeditationTrack] Update error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to update track',
    }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> },
) {
  try {
    const { trackId } = await params
    const loaded = await loadOwnTrack(trackId)
    if ('error' in loaded) return loaded.error
    const { supabase, user, track } = loaded

    const { error } = await supabase
      .from('song_tracks')
      .delete()
      .eq('id', trackId)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const admin = createAdminClient()
    // Saved meditations drop the track via ON DELETE SET NULL, so no shared session still holds the bed.
    if (track.mp3_url) {
      await syncSharedInstrumentalBed(admin, {
        songTrackId: track.id,
        userId: user.id,
        title: track.title || 'Untitled',
        fileUrl: track.mp3_url,
        durationSeconds: track.duration_ms ? Math.round(track.duration_ms / 1000) : null,
        shared: false,
      })
    }

    const { count } = await supabase
      .from('song_tracks')
      .select('id', { count: 'exact', head: true })
      .eq('song_id', track.song_id)
    if (count === 0) {
      await supabase.from('songs').delete().eq('id', track.song_id).eq('user_id', user.id)
    }

    return NextResponse.json({ id: trackId })
  } catch (err) {
    console.error('[MeditationTrack] Delete error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to delete track',
    }, { status: 500 })
  }
}
