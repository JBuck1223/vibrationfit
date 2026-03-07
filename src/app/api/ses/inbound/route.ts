/**
 * SES Inbound Email Webhook
 *
 * POST /api/ses/inbound
 *
 * Receives inbound emails via SES Receipt Rules + SNS for real-time
 * reply detection. When someone replies to an email you sent, this
 * webhook fires within seconds and inserts the reply into email_messages.
 * Supabase Realtime then pushes the change to any subscribed CRM client.
 *
 * Setup:
 *   1. Add MX record: inbound.vibrationfit.com -> inbound-smtp.us-east-1.amazonaws.com (priority 10)
 *   2. Verify inbound.vibrationfit.com domain in SES
 *   3. Create SES Receipt Rule: match inbound.vibrationfit.com, action = SNS publish
 *   4. Create SNS subscription (HTTPS) pointing to this endpoint
 *   5. In Gmail, add auto-forwarding to team@inbound.vibrationfit.com
 */

import { NextRequest, NextResponse } from 'next/server'
import { simpleParser } from 'mailparser'
import { createAdminClient } from '@/lib/supabase/admin'
import { matchInboundEmail } from '@/lib/messaging/match-email'

const OWN_ADDRESSES = [
  'team@vibrationfit.com',
  'no-reply@vibrationfit.com',
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const payload = JSON.parse(body)

    // Auto-confirm SNS subscription
    if (payload.Type === 'SubscriptionConfirmation') {
      if (payload.SubscribeURL) {
        await fetch(payload.SubscribeURL)
        console.log('[SES Inbound] SNS subscription confirmed')
      }
      return NextResponse.json({ confirmed: true })
    }

    if (payload.Type !== 'Notification') {
      return NextResponse.json({ skipped: true })
    }

    const message = JSON.parse(payload.Message)

    const rawEmail = message.content
    if (!rawEmail) {
      console.log('[SES Inbound] No email content in notification')
      return NextResponse.json({ skipped: 'no content' })
    }

    const parsed = await simpleParser(rawEmail)

    const fromValue = Array.isArray(parsed.from) ? parsed.from[0] : parsed.from
    const toValue = Array.isArray(parsed.to) ? parsed.to[0] : parsed.to
    const fromEmail = fromValue?.value?.[0]?.address || ''
    const toEmail = toValue?.value?.[0]?.address || ''
    const subject = parsed.subject || '(No subject)'
    const bodyText = parsed.text || ''
    const bodyHtml = parsed.html || ''
    const messageId = parsed.messageId || ''

    // Skip emails from our own addresses to avoid loops
    if (OWN_ADDRESSES.includes(fromEmail.toLowerCase())) {
      return NextResponse.json({ skipped: 'own address' })
    }

    const supabase = createAdminClient()

    // Deduplication by Message-ID header
    if (messageId) {
      const { data: existing } = await supabase
        .from('email_messages')
        .select('id')
        .eq('imap_message_id', messageId)
        .maybeSingle()

      if (existing) {
        console.log(`[SES Inbound] Duplicate skipped: ${messageId}`)
        return NextResponse.json({ skipped: 'duplicate' })
      }
    }

    // Match reply to a user or lead
    const inReplyTo = (parsed.inReplyTo as string) || ''
    const references = parsed.references || []
    const { userId, guestEmail } = await matchInboundEmail(fromEmail, inReplyTo, references)

    // Find the original outbound message this is replying to
    let replyToMessageId: string | null = null
    if (inReplyTo) {
      const sesIdMatch = inReplyTo.match(/<([^@]+)@[^>]*amazonses\.com>/)
      if (sesIdMatch) {
        const { data: original } = await supabase
          .from('email_messages')
          .select('id')
          .eq('ses_message_id', sesIdMatch[1])
          .maybeSingle()
        if (original) replyToMessageId = original.id
      }
    }

    const { error: insertError } = await supabase
      .from('email_messages')
      .insert({
        user_id: userId,
        guest_email: guestEmail,
        from_email: fromEmail,
        to_email: toEmail,
        subject,
        body_text: bodyText,
        body_html: bodyHtml || '',
        direction: 'inbound',
        status: 'received',
        imap_message_id: messageId || null,
        is_reply: subject.toLowerCase().startsWith('re:'),
        reply_to_message_id: replyToMessageId,
        sent_at: parsed.date?.toISOString() || new Date().toISOString(),
      })

    if (insertError) {
      console.error('[SES Inbound] DB insert error:', insertError)
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
    }

    console.log(`[SES Inbound] Reply from ${fromEmail}: "${subject}" (user=${userId || guestEmail})`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[SES Inbound] Webhook error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
