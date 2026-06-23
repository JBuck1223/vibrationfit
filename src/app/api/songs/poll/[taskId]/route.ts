/**
 * Song Generation Poll API
 *
 * Polls Mureka for task completion. When done, downloads assets to S3
 * and creates song_tracks rows.
 *
 * GET /api/songs/poll/[taskId]?song_id=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mureka } from '@/lib/mureka/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { SONG_PUBLISHING_AGREEMENT_VERSION } from '@/lib/songs/publishing-agreement'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

const CDN_URL = 'https://media.vibrationfit.com'
const BUCKET = 'vibration-fit-client-storage'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

async function downloadToBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
  return `${CDN_URL}/${key}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId } = await params
    const songId = request.nextUrl.searchParams.get('song_id')

    if (!songId) {
      return NextResponse.json({ error: 'song_id query param is required' }, { status: 400 })
    }

    const { data: song } = await supabase
      .from('songs')
      .select('id, user_id, metadata')
      .eq('id', songId)
      .eq('user_id', user.id)
      .single()

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    // Album art auto-generated at "Create My Track" time is stored on the song;
    // apply it to each track as it's created.
    const songMeta = typeof song.metadata === 'object' && song.metadata
      ? song.metadata as Record<string, unknown>
      : {}
    const songCoverUrl = typeof songMeta.custom_cover_url === 'string' ? songMeta.custom_cover_url : null

    console.log(`[SongPoll] Querying Mureka task: ${taskId}`)
    const taskResult = await mureka.queryTask(taskId)
    const songs = taskResult.songs || taskResult.choices || []
    const isComplete = taskResult.status === 'completed' || taskResult.status === 'succeeded'
    console.log(`[SongPoll] Task ${taskId} status: ${taskResult.status}, songs: ${songs.length}, keys: ${Object.keys(taskResult).join(',')}`)

    if (taskResult.status === 'failed') {
      await supabase
        .from('songs')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', songId)
        .eq('user_id', user.id)

      return NextResponse.json({
        status: 'failed',
        error: taskResult.error || 'Music generation failed',
      })
    }

    if (!isComplete || !songs.length) {
      // Log the full response to debug missing songs
      if (isComplete && !songs.length) {
        console.log(`[SongPoll] Succeeded but no songs! Full response:`, JSON.stringify(taskResult).slice(0, 2000))
      }
      return NextResponse.json({
        status: taskResult.status,
        message: 'Still generating...',
      })
    }

    console.log(`[SongPoll] Task complete, ${songs.length} tracks. Downloading to S3...`)

    // Idempotency guard: if this task's tracks were already inserted by a prior
    // poll, return them instead of inserting duplicates. The client polls every
    // few seconds and the S3 download can outlast that interval, so overlapping
    // completed polls would otherwise stack up duplicate tracks.
    const { data: alreadyInserted } = await supabase
      .from('song_tracks')
      .select('id, version, mp3_url, duration_ms')
      .eq('song_id', songId)
      .eq('mureka_task_id', taskId)

    if (alreadyInserted && alreadyInserted.length > 0) {
      await supabase
        .from('songs')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', songId)
        .eq('user_id', user.id)

      console.log(`[SongPoll] Tracks for task ${taskId} already exist (${alreadyInserted.length}); skipping insert.`)
      return NextResponse.json({ status: 'completed', tracks: alreadyInserted })
    }

    const { data: existingTracks } = await supabase
      .from('song_tracks')
      .select('version')
      .eq('song_id', songId)

    const maxVersion = (existingTracks || []).reduce((max, t) => {
      const n = parseInt(String(t.version), 10)
      return Number.isFinite(n) ? Math.max(max, n) : max
    }, 0)

    const tracks = []
    for (let i = 0; i < songs.length; i++) {
      const murekaSong = songs[i]
      const version = String(maxVersion + i + 1)
      const s3Prefix = `user-uploads/${user.id}/songs/${songId}`

      let mp3Url: string | null = null
      let mp3S3Key: string | null = null

      if (murekaSong.url) {
        try {
          const mp3Buffer = await downloadToBuffer(murekaSong.url)
          mp3S3Key = `${s3Prefix}/track-${version}.mp3`
          mp3Url = await uploadToS3(mp3S3Key, mp3Buffer, 'audio/mpeg')
          console.log(`[SongPoll] Uploaded track-${version}.mp3 (${(mp3Buffer.length / 1024 / 1024).toFixed(1)}MB)`)
        } catch (e) {
          console.error(`[SongPoll] Failed to upload MP3 for version ${version}:`, e)
          mp3Url = murekaSong.url
        }
      }

      const { data: track, error: trackError } = await supabase
        .from('song_tracks')
        .insert({
          song_id: songId,
          user_id: user.id,
          mureka_task_id: taskId,
          mureka_song_id: murekaSong.id,
          version,
          mp3_url: mp3Url,
          s3_key: mp3S3Key,
          cover_url: songCoverUrl,
          duration_ms: murekaSong.duration || null,
          is_favorite: false,
          status: 'completed',
          metadata: {
            mureka_url: murekaSong.url,
            mureka_flac_url: murekaSong.flac_url,
            mureka_wav_url: murekaSong.wav_url,
            lyrics_sections: murekaSong.lyrics_sections || null,
          },
        })
        .select('id, version, mp3_url, duration_ms')
        .single()

      if (trackError) {
        // 23505 = unique violation: another concurrent poll already inserted
        // this Mureka song. Fetch and reuse it instead of erroring.
        if ((trackError as { code?: string }).code === '23505') {
          const { data: existing } = await supabase
            .from('song_tracks')
            .select('id, version, mp3_url, duration_ms')
            .eq('song_id', songId)
            .eq('mureka_song_id', murekaSong.id)
            .maybeSingle()
          if (existing) tracks.push(existing)
        } else {
          console.error(`[SongPoll] Failed to insert track version ${version}:`, trackError)
        }
      } else if (track) {
        tracks.push(track)
      }
    }

    await supabase
      .from('songs')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', songId)
      .eq('user_id', user.id)

    // Auto-submit publish requests for admin users so songs appear in /admin/song-submissions
    if (tracks.length > 0) {
      const adminDb = createAdminClient()
      const { data: userAccount } = await adminDb
        .from('user_accounts')
        .select('role, song_publishing_legal_name, full_name, first_name, last_name')
        .eq('id', user.id)
        .single()

      if (userAccount?.role === 'admin' || userAccount?.role === 'super_admin') {
        const legalName = userAccount.song_publishing_legal_name
          || userAccount.full_name
          || [userAccount.first_name, userAccount.last_name].filter(Boolean).join(' ')
          || user.email || 'Admin'

        // Get song life_categories for context
        const { data: songData } = await adminDb
          .from('songs')
          .select('life_categories, entity_type, entity_id')
          .eq('id', songId)
          .single()

        let lifeCategories: string[] = songData?.life_categories || []

        // If no life_categories on the song, try to derive from the source entity
        if (lifeCategories.length === 0 && songData?.entity_id) {
          if (songData.entity_type === 'life_vision') {
            const { data: vision } = await adminDb
              .from('life_visions')
              .select('category')
              .eq('id', songData.entity_id)
              .single()
            if (vision?.category) lifeCategories = [vision.category]
          } else if (songData.entity_type === 'vision_board_item') {
            const { data: item } = await adminDb
              .from('vision_board_items')
              .select('life_category')
              .eq('id', songData.entity_id)
              .single()
            if (item?.life_category) lifeCategories = [item.life_category]
          }
        }

        for (const track of tracks) {
          const { error: publishError } = await adminDb
            .from('song_publish_requests')
            .insert({
              user_id: user.id,
              song_id: songId,
              track_id: track.id,
              songwriter_legal_name: legalName,
              life_categories: lifeCategories.length > 0 ? lifeCategories : ['personal_growth'],
              royalty_split_percent: 50,
              status: 'approved',
              agreement_version: SONG_PUBLISHING_AGREEMENT_VERSION,
              reviewed_by: user.id,
              reviewed_at: new Date().toISOString(),
            })
            .select('id')
            .single()

          if (publishError) {
            // 23505 = duplicate; skip if already exists
            if ((publishError as { code?: string }).code !== '23505') {
              console.error(`[SongPoll] Auto-publish request failed for track ${track.id}:`, publishError)
            }
          } else {
            console.log(`[SongPoll] Auto-created publish request for admin track ${track.id}`)
          }
        }
      }
    }

    console.log(`[SongPoll] Done. ${tracks.length} tracks created for song ${songId}`)

    return NextResponse.json({
      status: 'completed',
      tracks,
    })
  } catch (err) {
    console.error('[SongPoll] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Polling failed',
    }, { status: 500 })
  }
}
