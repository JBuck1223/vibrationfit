/**
 * Daily Webhook Health Check
 *
 * GET /api/admin/webhook-health
 *
 * Queries Daily.co for the current webhook status and returns
 * whether the recording pipeline is healthy.
 */

import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'

const DAILY_API_KEY = process.env.DAILY_API_KEY || ''
const EXPECTED_WEBHOOK_URL = 'https://vibrationfit.com/api/webhooks/daily'

export async function GET() {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    if (!DAILY_API_KEY) {
      return NextResponse.json({
        healthy: false,
        error: 'DAILY_API_KEY not configured',
      })
    }

    const response = await fetch('https://api.daily.co/v1/webhooks', {
      headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
    })

    if (!response.ok) {
      return NextResponse.json({
        healthy: false,
        error: `Daily API returned ${response.status}`,
      })
    }

    const webhooks = await response.json()

    const recordingWebhook = webhooks.find(
      (wh: Record<string, unknown>) =>
        wh.url === EXPECTED_WEBHOOK_URL &&
        Array.isArray(wh.eventTypes) &&
        (wh.eventTypes as string[]).includes('recording.ready-to-download')
    )

    if (!recordingWebhook) {
      return NextResponse.json({
        healthy: false,
        state: 'missing',
        message: 'No recording webhook registered with Daily',
        webhookCount: webhooks.length,
      })
    }

    const isActive = recordingWebhook.state === 'ACTIVE'

    return NextResponse.json({
      healthy: isActive,
      state: recordingWebhook.state,
      failedCount: recordingWebhook.failedCount || 0,
      url: recordingWebhook.url,
      eventTypes: recordingWebhook.eventTypes,
      createdAt: recordingWebhook.createdAt,
      updatedAt: recordingWebhook.updatedAt,
      webhookId: recordingWebhook.uuid,
      message: isActive
        ? 'Webhook is active — recordings will sync automatically'
        : `Webhook is ${recordingWebhook.state} — recordings will NOT sync automatically`,
    })
  } catch (error) {
    console.error('[webhook-health] Error:', error)
    return NextResponse.json(
      { healthy: false, error: 'Failed to check webhook health' },
      { status: 500 }
    )
  }
}
