// /src/lib/email/aws-ses.ts
// Low-level AWS SES client. Prefer importing from '@/lib/email/send' for
// send-and-log in one call. Use this module directly only for test/admin
// sends that don't need database logging.

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export interface SendEmailParams {
  to: string | string[]
  subject: string
  htmlBody: string
  textBody?: string
  from?: string
  replyTo?: string
}

export interface SendEmailResult {
  messageId: string
  to: string[]
}

export interface BulkSendResult {
  email: string
  messageId: string
}

export interface BulkSendError {
  email: string
  error: string
}

export interface BulkEmailResults {
  sent: BulkSendResult[]
  failed: BulkSendError[]
}

const DEFAULT_FROM = () =>
  process.env.AWS_SES_FROM_EMAIL || '"Vibration Fit" <team@vibrationfit.com>'

const CONFIGURATION_SET = () =>
  process.env.AWS_SES_CONFIGURATION_SET || undefined

/**
 * Send a single email via SES. Returns the SES MessageId so callers can
 * store it for delivery tracking.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const {
    to,
    subject,
    htmlBody,
    textBody,
    from = DEFAULT_FROM(),
    replyTo,
  } = params

  const recipients = Array.isArray(to) ? to : [to]

  const command = new SendEmailCommand({
    Source: from,
    Destination: { ToAddresses: recipients },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: htmlBody, Charset: 'UTF-8' },
        ...(textBody && { Text: { Data: textBody, Charset: 'UTF-8' } }),
      },
    },
    ...(replyTo && { ReplyToAddresses: [replyTo] }),
    ...(CONFIGURATION_SET() && { ConfigurationSetName: CONFIGURATION_SET() }),
  })

  const response = await sesClient.send(command)
  const messageId = response.MessageId || ''

  console.log('[SES] sent', { messageId, to: recipients, subject })

  return { messageId, to: recipients }
}

/**
 * Send individual emails to each recipient (one SES call per address).
 * This ensures per-recipient MessageId tracking and prevents recipients
 * from seeing each other's addresses.
 *
 * Sends are parallelized in batches of 25 to respect SES rate limits.
 */
export async function sendBulkEmail(
  params: Omit<SendEmailParams, 'to'> & { recipients: string[] }
): Promise<BulkEmailResults> {
  const { recipients, ...emailParams } = params
  const results: BulkEmailResults = { sent: [], failed: [] }

  const CONCURRENCY = 25
  for (let i = 0; i < recipients.length; i += CONCURRENCY) {
    const batch = recipients.slice(i, i + CONCURRENCY)
    const settled = await Promise.allSettled(
      batch.map(async (email) => {
        const { messageId } = await sendEmail({ ...emailParams, to: email })
        return { email, messageId }
      })
    )

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.sent.push(result.value)
      } else {
        const email = batch[settled.indexOf(result)]
        results.failed.push({
          email,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        })
      }
    }
  }

  console.log(
    `[SES] bulk complete: ${results.sent.length} sent, ${results.failed.length} failed`
  )

  return results
}

