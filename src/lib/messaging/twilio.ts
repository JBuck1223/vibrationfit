// /src/lib/messaging/twilio.ts
// Twilio SMS client for VibrationFit CRM

import { Twilio } from 'twilio'

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  : null

const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

export interface SendSMSParams {
  to: string
  body: string
  mediaUrls?: string[]
}

export interface SMSResponse {
  success: boolean
  sid?: string
  status?: string
  error?: string
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(params: SendSMSParams): Promise<SMSResponse> {
  if (!twilioClient || !twilioPhoneNumber) {
    console.error('❌ Twilio not configured - missing credentials')
    return {
      success: false,
      error: 'SMS service not configured',
    }
  }

  const { to, body, mediaUrls } = params

  try {
    const message = await twilioClient.messages.create({
      from: twilioPhoneNumber,
      to,
      body,
      ...(mediaUrls && mediaUrls.length > 0 && { mediaUrl: mediaUrls }),
    })

    console.log('✅ SMS sent successfully:', {
      sid: message.sid,
      to,
      status: message.status,
    })

    return {
      success: true,
      sid: message.sid,
      status: message.status,
    }
  } catch (error: any) {
    console.error('❌ Failed to send SMS:', error)
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    }
  }
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









