// Twilio SMS webhook for receiving messages and status updates
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Twilio sends data as form-encoded
    const messageId = formData.get('MessageSid') as string
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string
    const status = formData.get('SmsStatus') as string
    const mediaUrls = formData.getAll('MediaUrl0') // For MMS
    
    console.log('📥 Twilio webhook received:', {
      messageId,
      from,
      to,
      body: body?.substring(0, 50),
      status,
    })

    const adminClient = createAdminClient()

    // Determine direction (inbound or outbound)
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER
    const direction = from === twilioNumber ? 'outbound' : 'inbound'

    // Find user by phone number
    let userId: string | null = null
    let leadId: string | null = null
    
    const userPhone = direction === 'inbound' ? from : to
    
    // Try to find user in user_profiles
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('user_id')
      .eq('phone', userPhone)
      .single()
    
    if (profile) {
      userId = profile.user_id
    } else {
      // Try to find lead
      const { data: lead } = await adminClient
        .from('leads')
        .select('id')
        .eq('phone', userPhone)
        .single()
      
      if (lead) {
        leadId = lead.id
      }
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

    // Twilio expects 200 response
    return new NextResponse('OK', { status: 200 })
  } catch (error: any) {
    console.error('❌ Twilio webhook error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

