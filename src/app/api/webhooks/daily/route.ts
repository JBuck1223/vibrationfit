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
 * Recording ready — download from Daily.co and upload to our S3
 */
async function handleRecordingReady(event: Record<string, unknown>) {
  const payload = event.payload as Record<string, unknown> || event
  const roomName = payload.room_name as string
  const recordingId = payload.recording_id as string || payload.id as string
  const duration = payload.duration as number

  if (!roomName || !recordingId) {
    console.error('Missing room_name or recording_id in webhook payload')
    return
  }

  const supabase = createServiceClient()

  // Mark as processing
  await supabase
    .from('video_sessions')
    .update({ recording_status: 'processing' })
    .eq('daily_room_name', roomName)

  try {
    // Trigger the S3 transfer in our processing endpoint
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

    console.log(`✅ Recording ${recordingId} queued for S3 transfer`)
  } catch (error) {
    console.error(`Failed to process recording ${recordingId}:`, error)
    
    await supabase
      .from('video_sessions')
      .update({ recording_status: 'failed' })
      .eq('daily_room_name', roomName)
  }
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
