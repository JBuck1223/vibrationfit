/**
 * Daily Webhook Health Check & Re-registration
 *
 * GET  /api/admin/webhook-health  — Check webhook status
 * POST /api/admin/webhook-health  — Re-activate or re-create a failed webhook
 */

import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'

const DAILY_API_KEY = process.env.DAILY_API_KEY || ''
const EXPECTED_WEBHOOK_URL = 'https://vibrationfit.com/api/webhooks/daily'
const WEBHOOK_EVENT_TYPES = [
  'recording.started',
  'recording.ready-to-download',
  'recording.error',
]

async function findRecordingWebhook() {
  const response = await fetch('https://api.daily.co/v1/webhooks', {
    headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
  })
  if (!response.ok) return { error: response.status, webhooks: [] }

  const webhooks = (await response.json()) as Record<string, unknown>[]
  const match = webhooks.find(
    (wh) =>
      wh.url === EXPECTED_WEBHOOK_URL &&
      Array.isArray(wh.eventTypes) &&
      (wh.eventTypes as string[]).includes('recording.ready-to-download')
  )
  return { webhook: match, webhooks }
}

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

    const { error, webhook: recordingWebhook, webhooks } = await findRecordingWebhook()
    if (error) {
      return NextResponse.json({
        healthy: false,
        error: `Daily API returned ${error}`,
      })
    }

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

/**
 * Re-activate a FAILED webhook or create one if missing.
 * Daily verifies the endpoint with a test POST — our handler already returns 200.
 */
export async function POST() {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    if (!DAILY_API_KEY) {
      return NextResponse.json({ error: 'DAILY_API_KEY not configured' }, { status: 500 })
    }

    const { webhook: existing } = await findRecordingWebhook()

    // If webhook exists but is FAILED, try to re-activate it via update
    if (existing && existing.state !== 'ACTIVE') {
      const uuid = existing.uuid as string
      console.log(`[webhook-health] Re-activating webhook ${uuid} (state: ${existing.state})`)

      const updateRes = await fetch(`https://api.daily.co/v1/webhooks/${uuid}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: EXPECTED_WEBHOOK_URL }),
      })

      if (updateRes.ok) {
        const updated = await updateRes.json()
        return NextResponse.json({
          action: 'reactivated',
          state: updated.state,
          webhookId: updated.uuid,
          message: `Webhook re-activated (state: ${updated.state})`,
        })
      }

      // Update failed — delete and re-create
      console.warn(`[webhook-health] Re-activation failed (${updateRes.status}), deleting and re-creating`)
      await fetch(`https://api.daily.co/v1/webhooks/${uuid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
      })
    }

    // No webhook or deleted a broken one — create fresh
    if (!existing || existing.state !== 'ACTIVE') {
      console.log('[webhook-health] Creating new webhook')
      const createRes = await fetch('https://api.daily.co/v1/webhooks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: EXPECTED_WEBHOOK_URL,
          eventTypes: WEBHOOK_EVENT_TYPES,
        }),
      })

      if (!createRes.ok) {
        const err = await createRes.text()
        console.error('[webhook-health] Create failed:', err)
        return NextResponse.json(
          { error: `Failed to create webhook: ${createRes.status}`, detail: err },
          { status: 502 }
        )
      }

      const created = await createRes.json()
      return NextResponse.json({
        action: 'created',
        state: created.state,
        webhookId: created.uuid,
        message: 'New webhook created and verified',
      })
    }

    return NextResponse.json({
      action: 'none',
      message: 'Webhook is already active',
    })
  } catch (error) {
    console.error('[webhook-health] Fix error:', error)
    return NextResponse.json(
      { error: 'Failed to fix webhook' },
      { status: 500 }
    )
  }
}
