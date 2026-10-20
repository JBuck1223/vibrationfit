import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mureka } from '@/lib/mureka/client'
import { trackTokenUsage } from '@/lib/tokens/tracking'
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

const FAILED_TASK_STATUSES = new Set([
  'failed', 'error', 'timeout', 'timed_out', 'timeouted', 'cancelled', 'canceled', 'expired',
])

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
  { params }: { params: Promise<{ taskId: string }> },
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
      .select('id, title, metadata, updated_at, entity_type')
      .eq('id', songId)
      .eq('user_id', user.id)
      .eq('entity_type', 'meditation')
      .single()

    if (!song) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    const startedAt = song.updated_at ? new Date(song.updated_at).getTime() : 0
    const stale = Date.now() - startedAt > 10 * 60 * 1000

    let taskResult
    try {
      taskResult = await mureka.queryInstrumental(taskId)
    } catch (queryErr) {
      if (!stale) throw queryErr
      await supabase.from('songs').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', songId)
      return NextResponse.json({ status: 'failed', error: 'Music generation did not finish. Try again.' })
    }

    const songs = taskResult.songs || taskResult.choices || []
    const taskStatus = String(taskResult.status || '').toLowerCase()
    const isComplete = taskStatus === 'completed' || taskStatus === 'succeeded'

    if (FAILED_TASK_STATUSES.has(taskStatus) || (stale && !isComplete)) {
      await supabase.from('songs').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', songId)
      return NextResponse.json({
        status: 'failed',
        error: taskResult.error || 'Music generation did not finish. Try again.',
      })
    }

    if (!isComplete) {
      return NextResponse.json({ status: taskResult.status, message: 'Still generating...' })
    }

    if (!songs.length) {
      await supabase.from('songs').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', songId)
      return NextResponse.json({ status: 'failed', error: 'Music generation finished without a track' })
    }

    const { data: alreadyInserted } = await supabase
      .from('song_tracks')
      .select('id, mp3_url, title, duration_ms')
      .eq('song_id', songId)
      .eq('mureka_task_id', taskId)

    if (alreadyInserted && alreadyInserted.length > 0) {
      await supabase.from('songs').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', songId)
      return NextResponse.json({ status: 'completed', tracks: alreadyInserted })
    }

    const tracks = []
    for (let i = 0; i < songs.length; i++) {
      const murekaSong = songs[i]
      const version = String(i + 1)
      let mp3Url: string | null = null
      let mp3S3Key: string | null = null

      if (murekaSong.url) {
        try {
          const mp3Buffer = await downloadToBuffer(murekaSong.url)
          mp3S3Key = `user-uploads/${user.id}/meditations/${songId}/track-${version}.mp3`
          mp3Url = await uploadToS3(mp3S3Key, mp3Buffer, 'audio/mpeg')
        } catch (e) {
          console.error('[MeditationPoll] MP3 upload failed:', e)
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
          title: song.title,
          version,
          mp3_url: mp3Url,
          s3_key: mp3S3Key,
          duration_ms: murekaSong.duration || null,
          is_favorite: false,
          status: 'completed',
          metadata: {
            kind: 'meditation_instrumental',
            mureka_url: murekaSong.url,
          },
        })
        .select('id, mp3_url, title, duration_ms')
        .single()

      if (trackError) {
        if ((trackError as { code?: string }).code === '23505') {
          const { data: existing } = await supabase
            .from('song_tracks')
            .select('id, mp3_url, title, duration_ms')
            .eq('song_id', songId)
            .eq('mureka_song_id', murekaSong.id)
            .maybeSingle()
          if (existing) tracks.push(existing)
        } else {
          console.error('[MeditationPoll] Insert failed:', trackError)
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

    const songMeta = typeof song.metadata === 'object' && song.metadata
      ? song.metadata as Record<string, unknown>
      : {}

    await trackTokenUsage({
      user_id: user.id,
      action_type: 'song_music_generation',
      model_used: 'mureka-song',
      tokens_used: 0,
      unit_count: songs.length,
      provider: 'mureka',
      provider_request_id: taskId,
      billable: false,
      success: true,
      metadata: {
        song_id: songId,
        kind: 'meditation_instrumental',
        songs_generated: songs.length,
        mureka_model: (songMeta.mureka_model as string) || null,
      },
    })

    return NextResponse.json({ status: 'completed', tracks })
  } catch (err) {
    console.error('[MeditationPoll] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Polling failed',
    }, { status: 500 })
  }
}
