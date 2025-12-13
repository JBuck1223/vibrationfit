// Twilio SMS webhook for receiving messages and status updates
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Helper function to normalize phone numbers for comparison
function normalizePhone(phone: string): string {
  // Strip all non-numeric characters
  const digits = phone.replace(/\D/g, '')
  
  // If it's 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`
  }
  
  // If it's 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  
  // If it already starts with +, return as is
  if (phone.startsWith('+')) {
    return digits.startsWith('1') ? `+${digits}` : phone
  }
  
  // Otherwise just return cleaned digits with +
  return `+${digits}`
}

export async function POST(request: NextRequest) {
  console.log('🔔 Twilio webhook called at:', new Date().toISOString())
  
  try {
    const formData = await request.formData()
    
    // Twilio sends data as form-encoded
    const messageId = formData.get('MessageSid') as string
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string
    const status = formData.get('SmsStatus') as string
    const mediaUrls = formData.getAll('MediaUrl0') // For MMS
    
    console.log('📥 Twilio webhook data:', {
      messageId,
      from,
      to,
      body: body?.substring(0, 50),
      status,
      timestamp: new Date().toISOString()
    })

    const adminClient = createAdminClient()

    // Determine direction (inbound or outbound)
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER
    const direction = from === twilioNumber ? 'outbound' : 'inbound'

    // Find user by phone number
    let userId: string | null = null
    let leadId: string | null = null
    
    const userPhone = direction === 'inbound' ? from : to
    const normalizedUserPhone = normalizePhone(userPhone)
    
    console.log('🔍 Looking for user with phone:', { original: userPhone, normalized: normalizedUserPhone })
    
    // Try to find user in user_profiles by normalizing all phone numbers
    const { data: profiles } = await adminClient
      .from('user_profiles')
      .select('user_id, phone')
      .not('phone', 'is', null)
    
    if (profiles) {
      const matchedProfile = profiles.find(p => 
        normalizePhone(p.phone || '') === normalizedUserPhone
      )
      
      if (matchedProfile) {
        userId = matchedProfile.user_id
        console.log('✅ Found user:', userId)
      }
    }
    
    // If no user found, try to find lead
    if (!userId) {
      const { data: leads } = await adminClient
        .from('leads')
        .select('id, phone')
        .not('phone', 'is', null)
      
      if (leads) {
        const matchedLead = leads.find(l => 
          normalizePhone(l.phone || '') === normalizedUserPhone
        )
        
        if (matchedLead) {
          leadId = matchedLead.id
          console.log('✅ Found lead:', leadId)
        }
      }
    }
    
    if (!userId && !leadId) {
      console.log('⚠️ No user or lead found for phone:', normalizedUserPhone)
    }

    // Check if message already exists
    const { data: existing } = await adminClient
      .from('sms_messages')
      .select('id')
      .eq('twilio_sid', messageId)
      .single()

    if (existing) {
      // Update status if it's a status update webhook
      if (status) {
        await adminClient
          .from('sms_messages')
          .update({ status: status.toLowerCase() })
          .eq('twilio_sid', messageId)
        
        console.log(`✅ Updated SMS status: ${messageId} → ${status}`)
      }
    } else {
      // Insert new message
      const { error: insertError } = await adminClient
        .from('sms_messages')
        .insert({
          user_id: userId,
          lead_id: leadId,
          from_number: from,
          to_number: to,
          body: body || '',
          direction,
          status: status?.toLowerCase() || 'received',
          twilio_sid: messageId,
          media_urls: mediaUrls.length > 0 ? mediaUrls as string[] : null,
        })

      if (insertError) {
        console.error('❌ Failed to insert SMS:', insertError)
        throw insertError
      }

      console.log(`✅ Logged ${direction} SMS: ${messageId}`)
    }

    // Return empty TwiML response (no auto-reply)
    console.log('📤 Returning empty TwiML (no auto-reply)')
    const twimlResponse = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
    console.log('TwiML:', twimlResponse)
    
    return new NextResponse(twimlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error: any) {
    console.error('❌ Twilio webhook error:', error)
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}

