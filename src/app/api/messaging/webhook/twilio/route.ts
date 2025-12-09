// /src/app/api/messaging/webhook/twilio/route.ts
// Webhook endpoint to receive inbound SMS from Twilio

import { NextRequest, NextResponse } from 'next/server'
import { storeInboundMessage, handleOptOut } from '@/lib/messaging'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Parse Twilio webhook data (application/x-www-form-urlencoded)
    const formData = await request.formData()

    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string

    console.log('📨 Inbound SMS received:', {
      from,
      to,
      body: body?.substring(0, 50),
      sid: messageSid,
    })

    // Handle opt-out keywords
    const bodyLower = body?.toLowerCase().trim()
    if (bodyLower === 'stop' || bodyLower === 'unsubscribe' || bodyLower === 'cancel') {
      await handleOptOut(from)

      // Twilio will automatically send their standard opt-out response
      return new NextResponse('', { status: 200 })
    }

    // Try to find related lead or user
    const supabase = await createClient()

    // Check if this phone number belongs to a lead
    const { data: lead } = await supabase
      .from('leads')
      .select('id, converted_to_user_id')
      .eq('phone', from)
      .single()

    // Check if there's an open support ticket from this user
    let ticketId: string | undefined

    if (lead?.converted_to_user_id) {
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('user_id', lead.converted_to_user_id)
        .in('status', ['open', 'in_progress', 'waiting_reply'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      ticketId = ticket?.id
    }

    // Store the inbound message
    await storeInboundMessage({
      from,
      to,
      body,
      twilioSid: messageSid,
      leadId: lead?.id,
      userId: lead?.converted_to_user_id,
      ticketId,
    })

    // TODO: Add logic to notify admin of new inbound message
    // Could be email, push notification, or real-time update

    // Return empty 200 response to Twilio
    return new NextResponse('', { status: 200 })
  } catch (error: any) {
    console.error('❌ Error processing Twilio webhook:', error)

    // Still return 200 to Twilio to prevent retries
    return new NextResponse('', { status: 200 })
  }
}

// Verify this endpoint doesn't require authentication
// Twilio will POST directly to this endpoint
export const dynamic = 'force-dynamic'







