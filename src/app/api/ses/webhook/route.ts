/**
 * SES Event Webhook
 *
 * POST /api/ses/webhook
 *
 * Receives SNS notifications from the SES Configuration Set and updates
 * email_messages with delivery status (delivered, bounced, opened, etc.).
 *
 * SNS sends two kinds of POST:
 *   1. SubscriptionConfirmation — auto-confirmed by fetching the SubscribeURL
 *   2. Notification — contains the SES event payload
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const EXPECTED_TOPIC_ARN = process.env.AWS_SES_SNS_TOPIC_ARN || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const message = JSON.parse(body)

    // Validate TopicArn if configured
    if (EXPECTED_TOPIC_ARN && message.TopicArn && message.TopicArn !== EXPECTED_TOPIC_ARN) {
      console.error('[ses/webhook] TopicArn mismatch:', message.TopicArn)
      return NextResponse.json({ error: 'Invalid topic' }, { status: 403 })
    }

    // Handle SNS subscription confirmation
    if (message.Type === 'SubscriptionConfirmation') {
      const subscribeUrl = message.SubscribeURL
      if (subscribeUrl) {
        console.log('[ses/webhook] Confirming SNS subscription...')
        await fetch(subscribeUrl)
        console.log('[ses/webhook] SNS subscription confirmed')
      }
      return NextResponse.json({ status: 'subscription_confirmed' })
    }

    // Handle notification
    if (message.Type === 'Notification') {
      const sesEvent = JSON.parse(message.Message)
      await processSesEvent(sesEvent)
      return NextResponse.json({ status: 'processed' })
    }

    return NextResponse.json({ status: 'ignored' })
  } catch (error) {
    console.error('[ses/webhook] Error processing webhook:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

type SesEventType = 'Delivery' | 'Bounce' | 'Complaint' | 'Open' | 'Click' | 'Send' | 'Reject'

interface SesEvent {
  eventType: SesEventType
  mail: { messageId: string; timestamp: string }
  delivery?: { timestamp: string }
  bounce?: { bounceType: string; timestamp: string }
  complaint?: { timestamp: string }
  open?: { timestamp: string }
  click?: { timestamp: string }
}

const STATUS_RANK: Record<string, number> = {
  sent: 1,
  delivered: 2,
  opened: 3,
  bounced: 0,
  failed: 0,
}

async function processSesEvent(event: SesEvent) {
  const sesMessageId = event.mail?.messageId
  if (!sesMessageId) return

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('email_messages')
    .select('id, status')
    .eq('ses_message_id', sesMessageId)
    .maybeSingle()

  if (!existing) {
    console.log('[ses/webhook] No matching email_messages row for', sesMessageId)
    return
  }

  const currentRank = STATUS_RANK[existing.status] ?? 0

  switch (event.eventType) {
    case 'Delivery': {
      if (currentRank < STATUS_RANK.delivered) {
        await supabase
          .from('email_messages')
          .update({
            status: 'delivered',
            delivered_at: event.delivery?.timestamp || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      }
      break
    }

    case 'Bounce': {
      await supabase
        .from('email_messages')
        .update({
          status: 'bounced',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      console.log('[ses/webhook] Bounce recorded for', sesMessageId, event.bounce?.bounceType)
      break
    }

    case 'Complaint': {
      await supabase
        .from('email_messages')
        .update({
          status: 'bounced',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      console.log('[ses/webhook] Complaint recorded for', sesMessageId)
      break
    }

    case 'Open': {
      if (currentRank < STATUS_RANK.opened) {
        await supabase
          .from('email_messages')
          .update({
            status: 'opened',
            opened_at: event.open?.timestamp || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      }
      break
    }

    case 'Reject': {
      await supabase
        .from('email_messages')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      console.log('[ses/webhook] Reject recorded for', sesMessageId)
      break
    }

    default:
      break
  }
}
