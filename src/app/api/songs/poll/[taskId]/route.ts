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
import { mureka } from '@/lib/mureka/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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
      .select('id, user_id')
      .eq('id', songId)
      .eq('user_id', user.id)
      .single()

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

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
        console.error(`[SongPoll] Failed to insert track version ${version}:`, trackError)
      } else if (track) {
        tracks.push(track)
      }
    }

    await supabase
      .from('songs')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', songId)
      .eq('user_id', user.id)

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
