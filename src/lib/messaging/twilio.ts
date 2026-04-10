// /src/lib/messaging/twilio.ts
// Twilio SMS client for VibrationFit CRM

import { Twilio } from 'twilio'

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  : null

const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

function getStatusCallbackUrl(): string | undefined {
  if (process.env.TWILIO_STATUS_CALLBACK_URL) return process.env.TWILIO_STATUS_CALLBACK_URL
  const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ?? process.env.VERCEL_URL
  if (base) return `https://${base}/api/webhooks/twilio-sms`
  return undefined
}

export interface SendSMSParams {
  to: string
  body: string
  mediaUrls?: string[]
  userId?: string
  leadId?: string
  ticketId?: string
}

export interface SMSResponse {
  success: boolean
  sid?: string
  status?: string
  error?: string
}

/**
 * Send SMS via Twilio and log to sms_messages.
 * DB logging is best-effort -- never blocks or fails the send.
 */
export async function sendSMS(params: SendSMSParams): Promise<SMSResponse> {
  if (!twilioClient || !twilioPhoneNumber) {
    console.error('Twilio not configured - missing credentials')
    return {
      success: false,
      error: 'SMS service not configured',
    }
  }

  const { to, body, mediaUrls, userId, leadId, ticketId } = params

  try {
    const statusCallback = getStatusCallbackUrl()
    const message = await twilioClient.messages.create({
      from: twilioPhoneNumber,
      to,
      body,
      ...(mediaUrls && mediaUrls.length > 0 && { mediaUrl: mediaUrls }),
      ...(statusCallback && { statusCallback }),
    })

    console.log('SMS sent:', { sid: message.sid, to, status: message.status })

    logOutboundSMS({
      twilioSid: message.sid,
      from: twilioPhoneNumber,
      to,
      body,
      status: message.status,
      mediaUrls,
      userId,
      leadId,
      ticketId,
    })

    return {
      success: true,
      sid: message.sid,
      status: message.status,
    }
  } catch (error: any) {
    console.error('Failed to send SMS:', error)
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    }
  }
}

/**
 * Best-effort DB logging. Fire-and-forget so it never delays the caller.
 * Uses twilio_sid unique index to silently skip duplicates.
 */
function logOutboundSMS(params: {
  twilioSid: string
  from: string
  to: string
  body: string
  status: string
  mediaUrls?: string[]
  userId?: string
  leadId?: string
  ticketId?: string
}): void {
  import('@/lib/supabase/admin')
    .then(({ createAdminClient }) => {
      const supabase = createAdminClient()
      return supabase.from('sms_messages').insert({
        twilio_sid: params.twilioSid,
        direction: 'outbound',
        from_number: params.from,
        to_number: params.to,
        body: params.body,
        status: params.status || 'sent',
        media_urls: params.mediaUrls?.length ? params.mediaUrls : null,
        user_id: params.userId || null,
        lead_id: params.leadId || null,
        ticket_id: params.ticketId || null,
      })
    })
    .then(({ error }) => {
      if (error) {
        if (error.code === '23505') return // duplicate twilio_sid, already logged
        console.error('Failed to log outbound SMS:', error.message)
      }
    })
    .catch((err) => {
      console.error('SMS DB logging error:', err)
    })
}

/**
 * Get SMS delivery status
 */
export async function getSMSStatus(sid: string): Promise<{
  status: string
  error?: string
}> {
  if (!twilioClient) {
    return {
      status: 'unknown',
      error: 'Twilio not configured',
    }
  }

  try {
    const message = await twilioClient.messages(sid).fetch()
    return {
      status: message.status,
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch SMS status:', error)
    return {
      status: 'unknown',
      error: error.message,
    }
  }
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): {
  valid: boolean
  formatted?: string
  error?: string
} {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Check length
  if (digits.length < 10) {
    return {
      valid: false,
      error: 'Phone number too short',
    }
  }

  if (digits.length > 11) {
    return {
      valid: false,
      error: 'Phone number too long',
    }
  }

  // Format as E.164 (international format)
  let formatted: string

  if (digits.length === 10) {
    // Assume US number, add +1
    formatted = `+1${digits}`
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // US number with country code
    formatted = `+${digits}`
  } else {
    formatted = `+${digits}`
  }

  return {
    valid: true,
    formatted,
  }
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return !!(twilioClient && twilioPhoneNumber)
}












