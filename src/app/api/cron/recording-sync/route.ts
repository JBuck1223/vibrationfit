/**
 * Recording Sync Cron Job
 *
 * GET /api/cron/recording-sync
 *
 * Runs hourly as a safety net to catch recordings missed by the Daily webhook.
 * Finds sessions stuck in 'recording' or 'processing' status, pulls recordings
 * from Daily, uploads to S3, and updates the session so replays appear.
 *
 * Also checks webhook health and logs a warning if the webhook is not active.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { listRecordings, getRecordingAccessLink } from '@/lib/video/daily'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

export const runtime = 'nodejs'
export const maxDuration = 300

const DAILY_API_KEY = process.env.DAILY_API_KEY || ''
const CRON_SECRET = process.env.CRON_SECRET

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_URL = 'https://media.vibrationfit.com'

async function checkWebhookHealth(): Promise<{ healthy: boolean; state: string }> {
  try {
    const response = await fetch('https://api.daily.co/v1/webhooks', {
      headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
    })
    if (!response.ok) return { healthy: false, state: 'api_error' }

    const webhooks = await response.json()
    const wh = webhooks.find(
      (w: Record<string, unknown>) =>
        (w.url as string)?.includes('/api/webhooks/daily') &&
        Array.isArray(w.eventTypes) &&
        (w.eventTypes as string[]).includes('recording.ready-to-download')
    )

    if (!wh) return { healthy: false, state: 'missing' }
    return { healthy: wh.state === 'ACTIVE', state: wh.state }
  } catch {
    return { healthy: false, state: 'check_failed' }
  }
}

export async function GET(request: NextRequest) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log: string[] = []
  const step = (msg: string) => {
    log.push(msg)
    console.log(`[cron/recording-sync] ${msg}`)
  }

  try {
    // 1. Check webhook health
    const webhook = await checkWebhookHealth()
    step(`Webhook status: ${webhook.state} (healthy: ${webhook.healthy})`)
    if (!webhook.healthy) {
      step('WARNING: Daily webhook is not active — recordings rely on this cron fallback')
    }

    // 2. Find sessions that need recording sync
    const supabase = createServiceClient()
    const { data: stuckSessions, error: dbError } = await supabase
      .from('video_sessions')
      .select('id, daily_room_name, recording_status, recording_url, title, status, ended_at')
      .not('daily_room_name', 'is', null)
      .in('recording_status', ['recording', 'processing', 'failed'])
      .order('created_at', { ascending: false })
      .limit(20)

    if (dbError) {
      step(`DB query error: ${dbError.message}`)
      return NextResponse.json({ error: dbError.message, log }, { status: 500 })
    }

    if (!stuckSessions || stuckSessions.length === 0) {
      step('No stuck sessions found — all recordings are synced')
      return NextResponse.json({
        synced: 0,
        webhookHealthy: webhook.healthy,
        webhookState: webhook.state,
        log,
      })
    }

    step(`Found ${stuckSessions.length} session(s) with pending recordings`)

    let syncedCount = 0
    let errorCount = 0

    for (const session of stuckSessions) {
      try {
        step(`Checking ${session.daily_room_name} (${session.title || 'untitled'})...`)

        const { data: recordings } = await listRecordings(session.daily_room_name)
        if (!recordings || recordings.length === 0) {
          step(`  No recordings found on Daily for ${session.daily_room_name}`)
          continue
        }

        const ready = recordings.filter(
          (r) => r.status === 'ready' || r.status === 'finished'
        )
        if (ready.length === 0) {
          step(`  ${recordings.length} recording(s) found but none ready yet`)
          continue
        }

        const best = ready.sort((a, b) => (b.start_ts || 0) - (a.start_ts || 0))[0]
        step(`  Found ready recording: ${best.id} (${best.duration}s)`)

        const s3Key = `session-recordings/${session.daily_room_name}/${best.id}.mp4`

        // Check if already in S3
        let alreadyInS3 = false
        try {
          await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }))
          alreadyInS3 = true
        } catch {
          // Not in S3 yet
        }

        if (alreadyInS3 && session.recording_url) {
          step(`  Already synced — updating status only`)
          await supabase
            .from('video_sessions')
            .update({ recording_status: 'uploaded' })
            .eq('id', session.id)
          syncedCount++
          continue
        }

        // Download from Daily
        const accessData = await getRecordingAccessLink(best.id)
        const downloadResponse = await fetch(accessData.download_link)
        if (!downloadResponse.ok || !downloadResponse.body) {
          step(`  Download failed: HTTP ${downloadResponse.status}`)
          errorCount++
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
        step(`  Downloaded ${(fullBuffer.length / (1024 * 1024)).toFixed(1)} MB`)

        // Upload to S3
        if (fullBuffer.length > 50 * 1024 * 1024) {
          const upload = new Upload({
            client: s3Client,
            params: {
              Bucket: BUCKET_NAME,
              Key: s3Key,
              Body: fullBuffer,
              ContentType: 'video/mp4',
              CacheControl: 'max-age=31536000',
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
            })
          )
        }

        const recordingUrl = `${CDN_URL}/${s3Key}`

        // Update DB
        const updatePayload: Record<string, unknown> = {
          recording_status: 'uploaded',
          recording_s3_key: s3Key,
          recording_url: recordingUrl,
          recording_duration_seconds: best.duration || 0,
          daily_recording_id: best.id,
        }

        if (session.status !== 'completed') {
          updatePayload.status = 'completed'
          updatePayload.ended_at = session.ended_at || new Date().toISOString()
        }

        await supabase.from('video_sessions').update(updatePayload).eq('id', session.id)

        step(`  Synced: ${recordingUrl}`)
        syncedCount++
      } catch (err) {
        step(`  Error: ${err instanceof Error ? err.message : err}`)
        errorCount++
      }
    }

    step(`Done: ${syncedCount} synced, ${errorCount} errors`)

    return NextResponse.json({
      synced: syncedCount,
      errors: errorCount,
      webhookHealthy: webhook.healthy,
      webhookState: webhook.state,
      log,
    })
  } catch (error) {
    console.error('[cron/recording-sync] Unexpected error:', error)
    return NextResponse.json({ error: 'Cron failed', log }, { status: 500 })
  }
}
