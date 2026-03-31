/**
 * Daily.co Webhook Handler
 * 
 * POST /api/webhooks/daily
 * 
 * Receives webhook events from Daily.co:
 * - recording.ready-to-download: Recording finished, ready to transfer to S3
 * - recording.started: Recording started
 * - recording.error: Recording failed
 * 
 * Setup: Register via Daily REST API:
 *   POST https://api.daily.co/v1/webhooks
 *   { "url": "https://vibrationfit.com/api/webhooks/daily", "eventTypes": [...] }
 * 
 * Signature verification: Daily sends X-Webhook-Signature and X-Webhook-Timestamp
 * headers. The hmac secret is BASE-64 encoded. Signature = HMAC-SHA256(
 *   base64decode(secret), timestamp + "." + body
 * )
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min — large recordings take time to transfer

function verifyWebhookSignature(
  body: string,
  signature: string | null,
  timestamp: string | null
): 'valid' | 'skipped' | 'invalid' {
  const secret = process.env.DAILY_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[daily-webhook] DAILY_WEBHOOK_SECRET not set — skipping verification')
    return 'skipped'
  }
  if (!signature) return 'invalid'

  try {
    const decodedSecret = Buffer.from(secret, 'base64')
    const signPayload = timestamp ? `${timestamp}.${body}` : body

    const hmac = crypto.createHmac('sha256', decodedSecret)
    hmac.update(signPayload)
    const expected = hmac.digest('hex')

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
    if (isValid) return 'valid'

    // Fallback: try without timestamp in case format differs
    if (timestamp) {
      const hmac2 = crypto.createHmac('sha256', decodedSecret)
      hmac2.update(body)
      const expected2 = hmac2.digest('hex')
      if (
        expected2.length === signature.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected2))
      ) {
        return 'valid'
      }
    }

    // Fallback: try raw secret (not base64-decoded) for backwards compat
    const hmac3 = crypto.createHmac('sha256', secret)
    hmac3.update(body)
    const expected3 = hmac3.digest('hex')
    if (
      expected3.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected3))
    ) {
      return 'valid'
    }

    return 'invalid'
  } catch {
    return 'invalid'
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  // Return 200 quickly — Daily requires fast responses and will FAIL the webhook
  // after 3 slow/non-200 responses. Parse and verify first, process after responding
  // only for the test/verification ping.
  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ received: true })
  }

  const eventType = (event.type || event.event) as string | undefined

  // Daily sends a test POST when creating/reactivating a webhook — return 200 fast
  if (!eventType) {
    console.log('[daily-webhook] Received verification ping — responding 200')
    return NextResponse.json({ received: true })
  }

  const signature = request.headers.get('x-webhook-signature')
  const timestamp = request.headers.get('x-webhook-timestamp')

  const verifyResult = verifyWebhookSignature(rawBody, signature, timestamp)
  if (verifyResult === 'invalid') {
    console.error(`[daily-webhook] Invalid signature for ${eventType}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  console.log(`[daily-webhook] ${eventType} (sig: ${verifyResult})`)

  try {
    switch (eventType) {
      case 'recording.started':
        await handleRecordingStarted(event)
        break

      case 'recording.ready-to-download':
        await handleRecordingReady(event)
        break

      case 'recording.error':
        await handleRecordingError(event)
        break

      default:
        console.log(`[daily-webhook] Unhandled event: ${eventType}`)
    }
  } catch (error) {
    console.error(`[daily-webhook] Processing error for ${eventType}:`, error)
  }

  return NextResponse.json({ received: true })
}

/**
 * Recording started — update session status
 */
async function handleRecordingStarted(event: Record<string, unknown>) {
  const payload = event.payload as Record<string, unknown> || event
  const roomName = payload.room_name as string
  const recordingId = payload.recording_id as string || payload.id as string

  if (!roomName) return

  const supabase = createServiceClient()

  await supabase
    .from('video_sessions')
    .update({
      recording_status: 'recording',
      daily_recording_id: recordingId,
    })
    .eq('daily_room_name', roomName)

  console.log(`🔴 Recording started for room ${roomName}`)
}

/**
 * Recording ready — handle both cloud and raw-tracks recordings.
 * 
 * Cloud: Downloads from Daily and re-uploads to our S3 (legacy flow).
 * Raw-tracks: Files are already in our S3 bucket — just record the metadata.
 */
async function handleRecordingReady(event: Record<string, unknown>) {
  const payload = event.payload as Record<string, unknown> || event
  const roomName = payload.room_name as string
  const recordingId = payload.recording_id as string || payload.id as string
  const duration = payload.duration as number
  const recordingType = payload.type as string

  if (!roomName || !recordingId) {
    console.error('Missing room_name or recording_id in webhook payload')
    return
  }

  const supabase = createServiceClient()

  if (recordingType === 'raw-tracks') {
    await handleRawTracksReady(supabase, { roomName, recordingId, duration, payload })
    return
  }

  // Legacy cloud recording flow — download from Daily, upload to our S3
  await supabase
    .from('video_sessions')
    .update({ recording_status: 'processing' })
    .eq('daily_room_name', roomName)

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'
    const response = await fetch(`${baseUrl}/api/video/recordings/process`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({
        recording_id: recordingId,
        room_name: roomName,
        duration,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Processing failed: ${JSON.stringify(errorData)}`)
    }

    console.log(`Recording ${recordingId} queued for S3 transfer`)
  } catch (error) {
    console.error(`Failed to process recording ${recordingId}:`, error)
    
    await supabase
      .from('video_sessions')
      .update({ recording_status: 'failed' })
      .eq('daily_room_name', roomName)
  }
}

const CDN_URL = 'https://media.vibrationfit.com'

/**
 * Raw-tracks recordings land directly in our S3 bucket.
 * Parse the tracks array and insert one row per track file.
 */
async function handleRawTracksReady(
  supabase: ReturnType<typeof createServiceClient>,
  opts: {
    roomName: string
    recordingId: string
    duration: number
    payload: Record<string, unknown>
  }
) {
  const { roomName, recordingId, duration, payload } = opts
  const tracks = payload.tracks as Array<Record<string, unknown>> | undefined
  const s3Key = payload.s3_key as string | undefined

  // Look up the session
  const { data: session } = await supabase
    .from('video_sessions')
    .select('id')
    .eq('daily_room_name', roomName)
    .single()

  if (!session) {
    console.error(`[raw-tracks] No session found for room ${roomName}`)
    return
  }

  await supabase
    .from('video_sessions')
    .update({
      recording_status: 'uploaded',
      daily_recording_id: recordingId,
      recording_duration_seconds: duration,
      recording_s3_key: s3Key || null,
      recording_url: s3Key ? `${CDN_URL}/${s3Key}` : null,
    })
    .eq('daily_room_name', roomName)

  if (tracks && tracks.length > 0) {
    const trackRows = tracks.map((track) => ({
      session_id: session.id,
      daily_recording_id: recordingId,
      recording_type: 'raw-tracks',
      track_type: track.type as string || null,
      participant_session_id: track.participantId as string || track.participant_id as string || null,
      s3_key: track.s3Key as string || track.s3_key as string || null,
      s3_url: (track.s3Key || track.s3_key)
        ? `${CDN_URL}/${track.s3Key || track.s3_key}`
        : null,
      s3_bucket: 'vibration-fit-client-storage',
      format: 'webm',
      duration_seconds: duration,
      status: 'uploaded' as const,
      recorded_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from('video_session_recordings')
      .insert(trackRows)

    if (insertError) {
      console.error('[raw-tracks] Failed to insert track rows:', insertError)
    } else {
      console.log(`[raw-tracks] Saved ${trackRows.length} tracks for recording ${recordingId}`)
    }
  } else {
    // No individual track info — still record the recording-level s3_key
    if (s3Key) {
      await supabase
        .from('video_session_recordings')
        .insert({
          session_id: session.id,
          daily_recording_id: recordingId,
          recording_type: 'raw-tracks',
          s3_key: s3Key,
          s3_url: `${CDN_URL}/${s3Key}`,
          s3_bucket: 'vibration-fit-client-storage',
          format: 'webm',
          duration_seconds: duration,
          status: 'uploaded',
          recorded_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
        })
    }
  }

  console.log(`[raw-tracks] Recording ${recordingId} processed for room ${roomName}`)
}

/**
 * Recording error — mark session as failed
 */
async function handleRecordingError(event: Record<string, unknown>) {
  const payload = event.payload as Record<string, unknown> || event
  const roomName = payload.room_name as string

  if (!roomName) return

  const supabase = createServiceClient()

  await supabase
    .from('video_sessions')
    .update({ recording_status: 'failed' })
    .eq('daily_room_name', roomName)

  console.error(`Recording error for room ${roomName}:`, payload)
}
