/**
 * SES Event Webhook
 *
 * POST /api/ses/webhook
 *
 * Receives SNS notifications from the SES Configuration Set and updates
 * email_messages with delivery status (delivered, bounced, opened, etc.).
 *
 * SNS sends two kinds of POST:
 *   1. SubscriptionConfirmation -- auto-confirmed by fetching the SubscribeURL
 *   2. Notification -- contains the SES event payload
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addSuppression } from '@/lib/messaging/suppressions'

const EXPECTED_TOPIC_ARN = process.env.AWS_SES_SNS_TOPIC_ARN || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const message = JSON.parse(body)

    if (EXPECTED_TOPIC_ARN && message.TopicArn && message.TopicArn !== EXPECTED_TOPIC_ARN) {
      console.error('[ses/webhook] TopicArn mismatch:', message.TopicArn)
      return NextResponse.json({ error: 'Invalid topic' }, { status: 403 })
    }

    if (message.Type === 'SubscriptionConfirmation') {
      const subscribeUrl = message.SubscribeURL
      if (subscribeUrl) {
        console.log('[ses/webhook] Confirming SNS subscription...')
        await fetch(subscribeUrl)
        console.log('[ses/webhook] SNS subscription confirmed')
      }
      return NextResponse.json({ status: 'subscription_confirmed' })
    }

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
  mail: { messageId: string; timestamp: string; destination?: string[] }
  delivery?: { timestamp: string }
  bounce?: { bounceType: string; timestamp: string; bouncedRecipients?: { emailAddress: string }[] }
  complaint?: { timestamp: string; complainedRecipients?: { emailAddress: string }[] }
  open?: { timestamp: string }
  click?: { timestamp: string }
}

const TERMINAL_STATUSES = new Set(['bounced', 'complaint', 'failed'])

async function processSesEvent(event: SesEvent) {
  const sesMessageId = event.mail?.messageId
  if (!sesMessageId) return

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('email_messages')
    .select('id, status, to_email')
    .eq('ses_message_id', sesMessageId)
    .maybeSingle()

  if (!existing) {
    console.log('[ses/webhook] No matching email_messages row for', sesMessageId)
    return
  }

  const isTerminal = TERMINAL_STATUSES.has(existing.status)

  switch (event.eventType) {
    case 'Delivery': {
      if (!isTerminal && existing.status !== 'delivered' && existing.status !== 'opened' && existing.status !== 'clicked') {
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
      const bounceType = event.bounce?.bounceType || 'Undetermined'
      await supabase
        .from('email_messages')
        .update({
          status: 'bounced',
          bounce_type: bounceType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (bounceType === 'Permanent') {
        const recipients = event.bounce?.bouncedRecipients?.map((r) => r.emailAddress) || []
        const email = recipients[0] || existing.to_email
        if (email) {
          await addSuppression({
            email,
            reason: 'hard_bounce',
            sourceMessageId: existing.id,
            notes: `Permanent bounce: ${bounceType}`,
          })
        }
      }
      console.log('[ses/webhook] Bounce recorded for', sesMessageId, bounceType)
      break
    }

    case 'Complaint': {
      await supabase
        .from('email_messages')
        .update({
          status: 'complaint',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      const recipients = event.complaint?.complainedRecipients?.map((r) => r.emailAddress) || []
      const email = recipients[0] || existing.to_email
      if (email) {
        await addSuppression({
          email,
          reason: 'complaint',
          sourceMessageId: existing.id,
          notes: 'SES complaint feedback',
        })
      }
      console.log('[ses/webhook] Complaint recorded for', sesMessageId)
      break
    }

    case 'Open': {
      if (!isTerminal && existing.status !== 'opened' && existing.status !== 'clicked') {
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

    case 'Click': {
      if (!isTerminal && existing.status !== 'clicked') {
        await supabase
          .from('email_messages')
          .update({
            status: 'clicked',
            clicked_at: event.click?.timestamp || new Date().toISOString(),
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
