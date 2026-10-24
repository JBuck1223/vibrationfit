/**
 * POST /api/songs/upload
 *
 * Saves an original song a member uploaded themselves. The audio file is
 * already in S3 (uploaded from the browser via the presigned flow into
 * user-uploads/<userId>/songs/uploads/). This creates the songs + song_tracks
 * rows so the track shows up in the member's Songs and, by default, in their
 * Member Library on /audio/music under their artist name.
 *
 * Members must attest the song is their original work and that they hold
 * full rights. The attestation version and timestamp are recorded on the track.
 *
 * Body: {
 *   title: string
 *   mp3_url: string            // CDN URL returned by uploadUserFile('songUploads', ...)
 *   s3_key: string
 *   duration_ms?: number
 *   file_name?: string
 *   file_size?: number
 *   content_type?: string
 *   rights_attested: true
 *   rights_version: string     // must equal ORIGINAL_MUSIC_RIGHTS_VERSION
 *   add_to_member_library?: boolean  // default true
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ORIGINAL_MUSIC_CONTENT_TYPES,
  ORIGINAL_MUSIC_MAX_BYTES,
  ORIGINAL_MUSIC_RIGHTS_VERSION,
  isMemberSongUploadUrl,
} from '@/lib/songs/upload-rights'

export const dynamic = 'force-dynamic'

interface UploadSongBody {
  title?: string
  mp3_url?: string
  s3_key?: string
  duration_ms?: number
  file_name?: string
  file_size?: number
  content_type?: string
  rights_attested?: boolean
  rights_version?: string
  add_to_member_library?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: UploadSongBody = await request.json().catch(() => ({}))

    const title = (body.title || '').trim().slice(0, 200)
    if (!title) {
      return NextResponse.json({ error: 'Give your song a title' }, { status: 400 })
    }

    const mp3Url = (body.mp3_url || '').trim()
    const s3Key = (body.s3_key || '').trim()
    if (!mp3Url || !s3Key || !isMemberSongUploadUrl(mp3Url, user.id) || !mp3Url.endsWith(`/${s3Key}`)) {
      return NextResponse.json({ error: 'Upload the audio file first' }, { status: 400 })
    }

    if (body.rights_attested !== true || body.rights_version !== ORIGINAL_MUSIC_RIGHTS_VERSION) {
      return NextResponse.json(
        { error: 'Please confirm this is your original music and you hold full rights to it' },
        { status: 400 },
      )
    }

    const contentType = (body.content_type || '').trim().toLowerCase()
    if (contentType && !ORIGINAL_MUSIC_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Unsupported audio format' }, { status: 400 })
    }
    if (typeof body.file_size === 'number' && body.file_size > ORIGINAL_MUSIC_MAX_BYTES) {
      return NextResponse.json({ error: 'That file is too large (200MB max)' }, { status: 400 })
    }

    const durationMs = typeof body.duration_ms === 'number' && isFinite(body.duration_ms) && body.duration_ms > 0
      ? Math.round(body.duration_ms)
      : null
    const addToLibrary = body.add_to_member_library !== false
    const attestedAt = new Date().toISOString()

    // Admin client: song_tracks has columns PostgREST's cached schema may lag on
    // (same reason the library + member-library routes use it). Ownership is
    // enforced by writing user.id explicitly.
    const adminDb = createAdminClient()

    const { data: song, error: songError } = await adminDb
      .from('songs')
      .insert({
        user_id: user.id,
        entity_type: 'custom',
        entity_id: crypto.randomUUID(),
        title,
        source: 'member_upload',
        status: 'completed',
        generation_count: 0,
        metadata: {
          upload: {
            original_filename: body.file_name || null,
            content_type: contentType || null,
            file_size: body.file_size ?? null,
          },
        },
      })
      .select('id')
      .single()

    if (songError || !song) {
      console.error('[SongUpload] Song insert error:', songError)
      return NextResponse.json({ error: 'Could not save your song' }, { status: 500 })
    }

    const { data: track, error: trackError } = await adminDb
      .from('song_tracks')
      .insert({
        song_id: song.id,
        user_id: user.id,
        title,
        version: '1',
        mp3_url: mp3Url,
        s3_key: s3Key,
        duration_ms: durationMs,
        status: 'completed',
        in_member_library: addToLibrary,
        rights_attested_at: attestedAt,
        rights_attestation_version: ORIGINAL_MUSIC_RIGHTS_VERSION,
        metadata: {
          upload: {
            original_filename: body.file_name || null,
            content_type: contentType || null,
            file_size: body.file_size ?? null,
          },
        },
      })
      .select('id, song_id, title, mp3_url, duration_ms, in_member_library')
      .single()

    if (trackError || !track) {
      console.error('[SongUpload] Track insert error:', trackError)
      await adminDb.from('songs').delete().eq('id', song.id).eq('user_id', user.id)
      return NextResponse.json({ error: 'Could not save your song' }, { status: 500 })
    }

    return NextResponse.json({ song_id: song.id, track })
  } catch (err) {
    console.error('[SongUpload] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to save your song',
    }, { status: 500 })
  }
}
