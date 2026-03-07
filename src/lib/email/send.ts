// /src/lib/email/send.ts
// High-level email service: send via SES and log to email_messages in one call.
// This is the primary import for all routes that send email.

import { sendEmail, sendBulkEmail } from '@/lib/email/aws-ses'
import type { SendEmailParams, BulkEmailResults } from '@/lib/email/aws-ses'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Types ──

export interface EmailContext {
  userId?: string
  guestEmail?: string
  threadId?: string
  isReply?: boolean
  replyToMessageId?: string
}

export interface SendAndLogEmailParams extends SendEmailParams {
  context?: EmailContext
}

export interface SendAndLogBulkParams extends Omit<SendEmailParams, 'to'> {
  recipients: Array<{ email: string; userId?: string }>
}

export interface BulkSendAndLogResults extends BulkEmailResults {
  logged: number
}

// ── Helpers ──

const DEFAULT_FROM = () =>
  process.env.AWS_SES_FROM_EMAIL || '"Vibration Fit" <team@vibrationfit.com>'

/**
 * Insert a row into email_messages. Best-effort: never throws.
 */
async function logEmail(params: {
  sesMessageId: string
  from: string
  to: string
  subject: string
  bodyText?: string
  bodyHtml?: string
  context?: EmailContext
}): Promise<void> {
  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    await supabase.from('email_messages').insert({
      ses_message_id: params.sesMessageId,
      from_email: params.from,
      to_email: params.to,
      subject: params.subject,
      body_text: params.bodyText || null,
      body_html: params.bodyHtml || null,
      direction: 'outbound',
      status: 'sent',
      sent_at: now,
      created_at: now,
      user_id: params.context?.userId || null,
      guest_email: params.context?.guestEmail || null,
      thread_id: params.context?.threadId || null,
      is_reply: params.context?.isReply || false,
      reply_to_message_id: params.context?.replyToMessageId || null,
    })
  } catch (err) {
    console.error('[email/send] Failed to log email to database:', err)
  }
}

// ── Public API ──

/**
 * Send a single email and log it to email_messages.
 * Returns the SES MessageId. Throws if SES rejects the send.
 * DB logging is best-effort (never throws).
 */
export async function sendAndLogEmail(
  params: SendAndLogEmailParams
): Promise<{ messageId: string }> {
  const { context, ...emailParams } = params
  const from = emailParams.from || DEFAULT_FROM()

  const { messageId, to } = await sendEmail({ ...emailParams, from })

  await logEmail({
    sesMessageId: messageId,
    from,
    to: to[0],
    subject: emailParams.subject,
    bodyText: emailParams.textBody,
    bodyHtml: emailParams.htmlBody,
    context,
  })

  return { messageId }
}

/**
 * Send individual emails to a list of recipients and log each one.
 * Returns per-recipient results. Never throws for partial failures.
 */
export async function sendAndLogBulkEmail(
  params: SendAndLogBulkParams
): Promise<BulkSendAndLogResults> {
  const { recipients, ...emailParams } = params
  const from = emailParams.from || DEFAULT_FROM()

  const emails = recipients.map((r) => r.email)
  const results = await sendBulkEmail({ ...emailParams, from, recipients: emails })

  let logged = 0
  for (const item of results.sent) {
    const recipient = recipients.find((r) => r.email === item.email)
    await logEmail({
      sesMessageId: item.messageId,
      from,
      to: item.email,
      subject: emailParams.subject,
      bodyText: emailParams.textBody,
      bodyHtml: emailParams.htmlBody,
      context: {
        userId: recipient?.userId,
      },
    })
    logged++
  }

  console.log(
    `[email/send] bulk: ${results.sent.length} sent, ${results.failed.length} failed, ${logged} logged`
  )

  return { ...results, logged }
}
