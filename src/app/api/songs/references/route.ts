/**
 * Reference Tracks Library API
 *
 * GET  /api/songs/references — list user's reference tracks
 * POST /api/songs/references — save a new reference track to library
 * DELETE /api/songs/references?id=xxx — remove from library
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('reference_tracks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ references: data || [] })
  } catch (err) {
    console.error('[References] GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch references' }, { status: 500 })
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
    const { title, youtube_url, full_audio_url, clip_url, clip_start, clip_end, duration, mureka_file_id } = body

    if (!full_audio_url) {
      return NextResponse.json({ error: 'full_audio_url is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('reference_tracks')
      .insert({
        user_id: user.id,
        title: title || null,
        youtube_url: youtube_url || null,
        full_audio_url,
        clip_url: clip_url || null,
        clip_start: clip_start ?? 0,
        clip_end: clip_end ?? 30,
        duration: duration || null,
        mureka_file_id: mureka_file_id || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reference: data })
  } catch (err) {
    console.error('[References] POST error:', err)
    return NextResponse.json({ error: 'Failed to save reference' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('reference_tracks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[References] DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete reference' }, { status: 500 })
  }
}
