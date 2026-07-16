/**
 * Song update API
 *
 * PATCH /api/songs/[id]
 * Body: { lyrics?: string, style_prompt?: string, title?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface UpdateSongBody {
  lyrics?: string
  style_prompt?: string
  title?: string
  story_media_url?: string | null
  story_media_type?: 'video' | 'audio' | null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body: UpdateSongBody = await request.json()

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.lyrics !== undefined) {
      if (!body.lyrics.trim()) {
        return NextResponse.json({ error: 'Lyrics cannot be empty' }, { status: 400 })
      }
      updates.lyrics = body.lyrics.trim()
      updates.status = 'lyrics_complete'
    }

    if (body.style_prompt !== undefined) {
      updates.style_prompt = body.style_prompt.trim() || null
    }

    if (body.title !== undefined) {
      // Renaming is allowed until a track of this song is published to the catalog.
      const { data: publishedRequest } = await supabase
        .from('song_publish_requests')
        .select('id')
        .eq('song_id', id)
        .eq('user_id', user.id)
        .eq('status', 'published')
        .limit(1)
        .maybeSingle()

      if (publishedRequest) {
        return NextResponse.json({
          error: 'This song has been published and can no longer be renamed',
        }, { status: 403 })
      }

      updates.title = body.title.trim() || null
    }

    // Story Behind the Song recording (set together, or clear both with null)
    if (body.story_media_url !== undefined) {
      if (body.story_media_url === null) {
        updates.story_media_url = null
        updates.story_media_type = null
        updates.story_recorded_at = null
      } else {
        if (body.story_media_type !== 'video' && body.story_media_type !== 'audio') {
          return NextResponse.json({ error: 'story_media_type must be "video" or "audio"' }, { status: 400 })
        }
        updates.story_media_url = body.story_media_url
        updates.story_media_type = body.story_media_type
        updates.story_recorded_at = new Date().toISOString()
      }
    }

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: song, error } = await supabase
      .from('songs')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, title, lyrics, style_prompt, status, generation_count, metadata, story_media_url, story_media_type, story_recorded_at')
      .single()

    if (error || !song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    return NextResponse.json({ song })
  } catch (err) {
    console.error('[SongUpdate] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to update song',
    }, { status: 500 })
  }
}
