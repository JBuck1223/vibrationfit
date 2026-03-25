/**
 * Recording Sync API (Polling Fallback)
 *
 * POST /api/admin/recordings/sync
 *
 * Checks Daily.co for completed recordings that haven't been transferred to S3 yet.
 * Works as a fallback when webhooks can't reach the server (e.g., local dev)
 * and as a safety net in production to catch any missed webhooks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createServiceClient } from '@/lib/supabase/service'
import { listRecordings, getRecordingAccessLink, getRecording } from '@/lib/video/daily'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

export const runtime = 'nodejs'
export const maxDuration = 300

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_URL = 'https://media.vibrationfit.com'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json().catch(() => ({}))
    const targetSessionId = body.session_id as string | undefined

    const supabase = createServiceClient()

    let query = supabase
      .from('video_sessions')
      .select('id, daily_room_name, daily_recording_id, recording_status, recording_url, title')
      .not('daily_room_name', 'is', null)

    if (targetSessionId) {
      query = query.eq('id', targetSessionId)
    } else {
      query = query
        .in('recording_status', ['recording', 'processing', 'none', 'failed'])
        .order('created_at', { ascending: false })
        .limit(50)
    }

    const { data: pendingSessions, error: dbError } = await query

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    const results: Array<{
      session_id: string
      room_name: string
      title: string
      action: string
      recording_url?: string
    }> = []

    for (const session of pendingSessions || []) {
      try {
        // Check Daily.co for recordings from this room
        const { data: recordings } = await listRecordings(session.daily_room_name)

        if (!recordings || recordings.length === 0) continue

        for (const recording of recordings) {
          if (recording.status !== 'ready') continue

          // Check if we already have this recording in S3
          const s3Key = `session-recordings/${session.daily_room_name}/${recording.id}.mp4`

          let alreadyInS3 = false
          try {
            await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }))
            alreadyInS3 = true
          } catch {
            // Object doesn't exist in S3
          }

          if (alreadyInS3 && session.recording_url) {
            results.push({
              session_id: session.id,
              room_name: session.daily_room_name,
              title: session.title,
              action: 'already_synced',
              recording_url: session.recording_url,
            })
            continue
          }

          // Download from Daily.co and upload to S3
          const accessData = await getRecordingAccessLink(recording.id)
          const downloadResponse = await fetch(accessData.download_link)

          if (!downloadResponse.ok || !downloadResponse.body) {
            results.push({
              session_id: session.id,
              room_name: session.daily_room_name,
              title: session.title,
              action: 'download_failed',
            })
            continue
          }

          const reader = downloadResponse.body.getReader()
          const chunks: Uint8Array[] = []
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks.push(value)
          }
          const fullBuffer = Buffer.concat(chunks)

          if (fullBuffer.length > 50 * 1024 * 1024) {
            const upload = new Upload({
              client: s3Client,
              params: {
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: fullBuffer,
                ContentType: 'video/mp4',
                CacheControl: 'max-age=31536000',
                Metadata: {
                  'daily-recording-id': recording.id,
                  'daily-room-name': session.daily_room_name,
                  'recording-duration': String(recording.duration || 0),
                },
              },
              queueSize: 4,
              partSize: 10 * 1024 * 1024,
            })
            await upload.done()
          } else {
            await s3Client.send(
              new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: fullBuffer,
                ContentType: 'video/mp4',
                CacheControl: 'max-age=31536000',
                Metadata: {
                  'daily-recording-id': recording.id,
                  'daily-room-name': session.daily_room_name,
                  'recording-duration': String(recording.duration || 0),
                },
              })
            )
          }

          const recordingUrl = `${CDN_URL}/${s3Key}`

          await supabase
            .from('video_sessions')
            .update({
              recording_status: 'uploaded',
              recording_s3_key: s3Key,
              recording_url: recordingUrl,
              recording_duration_seconds: recording.duration || 0,
              daily_recording_id: recording.id,
            })
            .eq('id', session.id)

          results.push({
            session_id: session.id,
            room_name: session.daily_room_name,
            title: session.title,
            action: 'synced',
            recording_url: recordingUrl,
          })
        }
      } catch (err) {
        console.error(`Error syncing recording for ${session.daily_room_name}:`, err)
        results.push({
          session_id: session.id,
          room_name: session.daily_room_name,
          title: session.title,
          action: 'error',
        })
      }
    }

    return NextResponse.json({
      synced: results.filter((r) => r.action === 'synced').length,
      already_synced: results.filter((r) => r.action === 'already_synced').length,
      errors: results.filter((r) => r.action === 'error').length,
      results,
    })
  } catch (error) {
    console.error('Recording sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
