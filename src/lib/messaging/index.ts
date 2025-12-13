// /src/lib/messaging/index.ts
// Main messaging service - Twilio SMS integration

import { createClient } from '@/lib/supabase/server'
import { sendSMS, validatePhoneNumber, isTwilioConfigured } from './twilio'
import { fillTemplate, getTemplate } from './templates'

export interface SendMessageParams {
  to: string
  body?: string
  templateId?: string
  templateVariables?: Record<string, string>
  leadId?: string
  ticketId?: string
  userId?: string
}

export interface MessageResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send a message via Twilio SMS
 * Stores message in database and sends via Twilio
 */
export async function sendMessage(
  params: SendMessageParams
): Promise<MessageResult> {
  const { to, body, templateId, templateVariables, leadId, ticketId, userId } = params

  // Validate phone number
  const phoneValidation = validatePhoneNumber(to)
  if (!phoneValidation.valid) {
    return {
      success: false,
      error: phoneValidation.error || 'Invalid phone number',
    }
  }

  // Get message body
  let messageBody: string

  if (templateId && templateVariables) {
    try {
      messageBody = fillTemplate(templateId, templateVariables)
    } catch (error: any) {
      return {
        success: false,
        error: `Template error: ${error.message}`,
      }
    }
  } else if (body) {
    messageBody = body
  } else {
    return {
      success: false,
      error: 'Either body or templateId must be provided',
    }
  }

  // Check if Twilio is configured
  if (!isTwilioConfigured()) {
    console.warn('⚠️ Twilio not configured, skipping SMS send')
    return {
      success: false,
      error: 'SMS service not configured',
    }
  }

  // Send via Twilio
  const smsResult = await sendSMS({
    to: phoneValidation.formatted!,
    body: messageBody,
  })

  if (!smsResult.success) {
    return {
      success: false,
      error: smsResult.error,
    }
  }

  // Store message in database (use admin client to bypass RLS)
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { error: dbError } = await adminClient.from('sms_messages').insert({
      lead_id: leadId || null,
      ticket_id: ticketId || null,
      user_id: userId || null,
      direction: 'outbound',
      from_number: process.env.TWILIO_PHONE_NUMBER || '',
      to_number: phoneValidation.formatted!,
      body: messageBody,
      status: smsResult.status || 'sent',
      twilio_sid: smsResult.sid,
    })

    if (dbError) {
      console.error('❌ Failed to store SMS in database:', dbError)
      // Don't fail the send if DB storage fails
    } else {
      console.log('✅ SMS stored in database')
    }
  } catch (error) {
    console.error('❌ Error storing SMS:', error)
    // Don't fail the send if DB storage fails
  }

  return {
    success: true,
    messageId: smsResult.sid,
  }
}

/**
 * Store inbound SMS message
 * Called from webhook endpoint
 */
export async function storeInboundMessage(params: {
  from: string
  to: string
  body: string
  twilioSid: string
  leadId?: string
  ticketId?: string
  userId?: string
}): Promise<{ success: boolean; messageId?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('sms_messages')
      .insert({
        lead_id: params.leadId || null,
        ticket_id: params.ticketId || null,
        user_id: params.userId || null,
        direction: 'inbound',
        from_number: params.from,
        to_number: params.to,
        body: params.body,
        status: 'received',
        twilio_sid: params.twilioSid,
      })
      .select('id')
      .single()

    if (error) {
      console.error('❌ Failed to store inbound SMS:', error)
      return { success: false }
    }

    console.log('✅ Inbound SMS stored:', data.id)

    return {
      success: true,
      messageId: data.id,
    }
  } catch (error) {
    console.error('❌ Error storing inbound SMS:', error)
    return { success: false }
  }
}

/**
 * Get SMS conversation thread
 */
export async function getConversation(params: {
  leadId?: string
  ticketId?: string
  userId?: string
  phoneNumber?: string
}): Promise<any[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('sms_messages')
      .select('*')
      .order('created_at', { ascending: true })

    if (params.leadId) {
      query = query.eq('lead_id', params.leadId)
    } else if (params.ticketId) {
      query = query.eq('ticket_id', params.ticketId)
    } else if (params.userId) {
      query = query.eq('user_id', params.userId)
    } else if (params.phoneNumber) {
      query = query.or(`to_number.eq.${params.phoneNumber},from_number.eq.${params.phoneNumber}`)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Failed to fetch conversation:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('❌ Error fetching conversation:', error)
    return []
  }
}

/**
 * Handle SMS opt-out
 * Updates lead/user to mark as opted out
 */
export async function handleOptOut(phoneNumber: string): Promise<void> {
  try {
    const supabase = await createClient()

    // Update leads with this phone number
    await supabase
      .from('leads')
      .update({
        sms_opt_in: false,
        sms_opt_out_date: new Date().toISOString(),
      })
      .eq('phone', phoneNumber)

    console.log('✅ Opted out phone number:', phoneNumber)
  } catch (error) {
    console.error('❌ Error handling opt-out:', error)
  }
}

// Export everything
export * from './twilio'
export * from './templates'









