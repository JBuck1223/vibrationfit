import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadMeditationCatalog } from '@/lib/meditations/catalog'
import {
  BREATH_MAX_SECONDS,
  BREATH_MIN_SECONDS,
  DURATION_MAX_MINUTES,
  DURATION_MIN_MINUTES,
  HOLD_MAX_SECONDS,
} from '@/lib/meditations/constants'

export const dynamic = 'force-dynamic'

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

function clampUnit(value: unknown, fallback: number) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(1, Math.max(0, n))
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const catalog = await loadMeditationCatalog(createAdminClient(), user.id)
    return NextResponse.json(catalog)
  } catch (err) {
    console.error('[Meditations] List error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to load meditations',
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = String(body.title || '').trim().slice(0, 80)
    if (!title) {
      return NextResponse.json({ error: 'A title is required' }, { status: 400 })
    }

    const musicBackgroundTrackId = body.music_background_track_id || null
    const musicSongTrackId = body.music_song_track_id || null
    if (musicBackgroundTrackId && musicSongTrackId) {
      return NextResponse.json({ error: 'Choose one music source' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('meditations')
      .insert({
        user_id: user.id,
        title,
        inhale_seconds: clampInt(body.inhale_seconds, BREATH_MIN_SECONDS, BREATH_MAX_SECONDS, 3),
        exhale_seconds: clampInt(body.exhale_seconds, BREATH_MIN_SECONDS, BREATH_MAX_SECONDS, 5),
        hold_seconds: clampInt(body.hold_seconds, 0, HOLD_MAX_SECONDS, 0),
        duration_minutes: clampInt(body.duration_minutes, DURATION_MIN_MINUTES, DURATION_MAX_MINUTES, 5),
        music_background_track_id: musicBackgroundTrackId,
        music_song_track_id: musicSongTrackId,
        music_volume: clampUnit(body.music_volume, 0.55),
        binaural_track_id: body.binaural_track_id || null,
        binaural_volume: clampUnit(body.binaural_volume, 0.3),
        bpm: body.bpm == null ? null : clampInt(body.bpm, 40, 60, 60),
        mood: body.mood ? String(body.mood).trim().slice(0, 200) : null,
      })
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('[Meditations] Create error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to save meditation',
    }, { status: 500 })
  }
}
