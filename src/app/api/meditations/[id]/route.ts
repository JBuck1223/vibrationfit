import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncSharedInstrumentalBed } from '@/lib/meditations/register-bed'
import {
  BREATH_MAX_SECONDS,
  BREATH_MIN_SECONDS,
  DURATION_MAX_MINUTES,
  DURATION_MIN_MINUTES,
} from '@/lib/meditations/constants'

export const dynamic = 'force-dynamic'

function clampInt(value: unknown, min: number, max: number) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  return Math.min(max, Math.max(min, Math.round(n)))
}

function clampUnit(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  return Math.min(1, Math.max(0, n))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const { data: existing, error: fetchError } = await supabase
      .from('meditations')
      .select('id, user_id, title, music_song_track_id, is_shared')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Meditation not found' }, { status: 404 })
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (typeof body.title === 'string') {
      const title = body.title.trim().slice(0, 80)
      if (!title) return NextResponse.json({ error: 'A title is required' }, { status: 400 })
      update.title = title
    }
    if (body.inhale_seconds != null) {
      const value = clampInt(body.inhale_seconds, BREATH_MIN_SECONDS, BREATH_MAX_SECONDS)
      if (value != null) update.inhale_seconds = value
    }
    if (body.exhale_seconds != null) {
      const value = clampInt(body.exhale_seconds, BREATH_MIN_SECONDS, BREATH_MAX_SECONDS)
      if (value != null) update.exhale_seconds = value
    }
    if (body.duration_minutes != null) {
      const value = clampInt(body.duration_minutes, DURATION_MIN_MINUTES, DURATION_MAX_MINUTES)
      if (value != null) update.duration_minutes = value
    }
    if ('music_background_track_id' in body) {
      update.music_background_track_id = body.music_background_track_id || null
    }
    if ('music_song_track_id' in body) {
      update.music_song_track_id = body.music_song_track_id || null
    }
    if (body.music_volume != null) {
      const value = clampUnit(body.music_volume)
      if (value != null) update.music_volume = value
    }
    if ('binaural_track_id' in body) {
      update.binaural_track_id = body.binaural_track_id || null
    }
    if (body.binaural_volume != null) {
      const value = clampUnit(body.binaural_volume)
      if (value != null) update.binaural_volume = value
    }
    if ('bpm' in body) update.bpm = body.bpm == null ? null : clampInt(body.bpm, 40, 60)
    if ('mood' in body) update.mood = body.mood ? String(body.mood).trim().slice(0, 200) : null
    if (typeof body.is_favorite === 'boolean') update.is_favorite = body.is_favorite
    if (typeof body.is_shared === 'boolean') update.is_shared = body.is_shared

    const { error: updateError } = await supabase
      .from('meditations')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const songTrackId = ('music_song_track_id' in update
      ? update.music_song_track_id
      : existing.music_song_track_id) as string | null
    const shared = typeof update.is_shared === 'boolean' ? update.is_shared : existing.is_shared
    const title = (update.title as string | undefined) || existing.title

    if (songTrackId && typeof body.is_shared === 'boolean') {
      const admin = createAdminClient()
      const { data: track } = await admin
        .from('song_tracks')
        .select('id, mp3_url, duration_ms, title, user_id')
        .eq('id', songTrackId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (track?.mp3_url) {
        await syncSharedInstrumentalBed(admin, {
          songTrackId: track.id,
          userId: user.id,
          title: track.title || title,
          fileUrl: track.mp3_url,
          durationSeconds: track.duration_ms ? Math.round(track.duration_ms / 1000) : null,
          shared,
        })
      }
    }

    return NextResponse.json({ id, is_shared: shared, is_favorite: update.is_favorite ?? undefined })
  } catch (err) {
    console.error('[Meditations] Update error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to update meditation',
    }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { data: existing, error: fetchError } = await supabase
      .from('meditations')
      .select('id, title, music_song_track_id, is_shared')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Meditation not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('meditations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // A shared session may have been the last one publishing its instrumental bed.
    if (existing.is_shared && existing.music_song_track_id) {
      const admin = createAdminClient()
      const { data: track } = await admin
        .from('song_tracks')
        .select('id, mp3_url, duration_ms, title')
        .eq('id', existing.music_song_track_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (track?.mp3_url) {
        await syncSharedInstrumentalBed(admin, {
          songTrackId: track.id,
          userId: user.id,
          title: track.title || existing.title,
          fileUrl: track.mp3_url,
          durationSeconds: track.duration_ms ? Math.round(track.duration_ms / 1000) : null,
          shared: false,
        })
      }
    }

    return NextResponse.json({ id })
  } catch (err) {
    console.error('[Meditations] Delete error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to delete meditation',
    }, { status: 500 })
  }
}
