import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * PUT - Admin approves, rejects, or publishes a song submission.
 *
 * On approve: auto-adds the track to `music_catalog` so all members
 * can listen on /audio/music. Uses the track's MP3 and cover art.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = createAdminClient()

    const { data: profile } = await adminDb
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const { status, admin_notes } = await request.json()

    if (!status || !['approved', 'rejected', 'published'].includes(status)) {
      return NextResponse.json({ error: 'status must be "approved", "rejected", or "published"' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await adminDb
      .from('song_publish_requests')
      .update({
        status,
        admin_notes: admin_notes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, songs(id, title, lyrics), song_tracks(id, mp3_url, cover_url, duration_ms, metadata)')
      .single()

    if (updateError) {
      console.error('[SongSubmission] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
    }

    if (status === 'approved' && updated) {
      await addToCatalog(adminDb, updated)
    }

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[SongSubmission] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Update failed',
    }, { status: 500 })
  }
}

async function addToCatalog(
  db: ReturnType<typeof createAdminClient>,
  submission: Record<string, any>,
) {
  const song = submission.songs as Record<string, any> | null
  const track = submission.song_tracks as Record<string, any> | null
  if (!song || !track?.mp3_url) {
    console.warn('[SongSubmission] Cannot add to catalog — missing song or mp3_url')
    return
  }

  const title = song.title || 'Untitled'
  const durationSec = track.duration_ms ? Math.round(track.duration_ms / 1000) : null

  const { data: existing } = await db
    .from('music_catalog')
    .select('id')
    .eq('title', title)
    .eq('preview_url', track.mp3_url)
    .maybeSingle()

  if (existing) {
    const lifeCategories = Array.isArray(submission.life_categories) ? submission.life_categories : []
    if (lifeCategories.length > 0) {
      const { data: row } = await db
        .from('music_catalog')
        .select('tags')
        .eq('id', existing.id)
        .single()

      const mergedTags = [...new Set([...(row?.tags || []), ...lifeCategories])]
      await db
        .from('music_catalog')
        .update({ tags: mergedTags, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    }
    console.log('[SongSubmission] Track already in catalog:', existing.id)
    return
  }

  const { error } = await db.from('music_catalog').insert({
    title,
    artist: 'Vibration Fit',
    tags: [
      'member-created',
      `creator:${submission.user_id}`,
      ...(Array.isArray(submission.life_categories) ? submission.life_categories : []),
    ],
    preview_url: track.mp3_url,
    artwork_url: track.cover_url || null,
    duration_seconds: durationSec,
    plain_lyrics: song.lyrics || null,
    description: `Created by ${submission.songwriter_legal_name}`,
    is_active: true,
    release_date: new Date().toISOString().slice(0, 10),
  })

  if (error) {
    console.error('[SongSubmission] Failed to add to music_catalog:', error)
  } else {
    console.log('[SongSubmission] Added to music_catalog:', title)
  }
}
