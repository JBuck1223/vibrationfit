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
 * Setup: Configure this URL in Daily.co dashboard → Developers → Webhooks
 * URL: https://vibrationfit.com/api/webhooks/daily
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min — large recordings take time to transfer

// Verify the webhook is from Daily.co using their signing secret
function verifyWebhookSignature(body: string, signature: string | null): boolean {
  const secret = process.env.DAILY_WEBHOOK_SECRET
  if (!secret) {
    // If no secret configured, log warning but allow (for initial setup)
    console.warn('⚠️ DAILY_WEBHOOK_SECRET not set — skipping signature verification')
    return true
  }
  if (!signature) return false

  try {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(body)
    const expectedSignature = hmac.digest('hex')
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-webhook-signature')

    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    const eventType = event.type || event.event

    console.log(`📡 Daily.co webhook: ${eventType}`)

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
        console.log(`Unhandled Daily.co event: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
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
