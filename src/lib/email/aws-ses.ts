// /src/lib/email/aws-ses.ts
// AWS SES Email Service for VibrationFit

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || 'us-east-1', // SES is in us-east-1
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

/**
 * Send an email using AWS SES
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const {
    to,
    subject,
    htmlBody,
    textBody,
    from = process.env.AWS_SES_FROM_EMAIL || '"Vibration Fit" <team@vibrationfit.com>',
    replyTo,
  } = params

  const recipients = Array.isArray(to) ? to : [to]

  try {
    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: recipients,
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          ...(textBody && {
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          }),
        },
      },
      ...(replyTo && {
        ReplyToAddresses: [replyTo],
      }),
    })

    const response = await sesClient.send(command)
    console.log('✅ Email sent successfully:', {
      messageId: response.MessageId,
      to: recipients,
      subject,
    })
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    throw error
  }
}

/**
 * Send a batch of emails (up to 50 recipients per batch)
 */
export async function sendBulkEmail(
  params: Omit<SendEmailParams, 'to'> & { recipients: string[] }
): Promise<void> {
  const { recipients, ...emailParams } = params

  // SES allows up to 50 recipients per call
  const batchSize = 50
  const batches = []

  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize))
  }

  try {
    await Promise.all(
      batches.map((batch) =>
        sendEmail({
          ...emailParams,
          to: batch,
        })
      )
    )
    console.log('✅ Bulk email sent successfully to', recipients.length, 'recipients')
  } catch (error) {
    console.error('❌ Failed to send bulk email:', error)
    throw error
  }
}

/**
 * Verify if an email address is verified in SES
 * (Only needed in SES Sandbox mode)
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  // In production mode, this check isn't needed
  // In sandbox mode, you need to verify recipient emails
  
  // For now, we'll assume production mode
  // If you're in sandbox, you'll need to implement verification check
  return true
}

