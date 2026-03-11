// /src/app/api/messaging/send/route.ts
// API endpoint to send SMS messages via Twilio

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { sendMessage } from '@/lib/messaging'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Parse request body
    const body = await request.json()
    const { to, message, templateId, templateVariables, leadId, ticketId, userId } = body

    if (!to) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    if (!message && !templateId) {
      return NextResponse.json(
        { error: 'Either message or templateId required' },
        { status: 400 }
      )
    }

    // Send message
    const result = await sendMessage({
      to,
      body: message,
      templateId,
      templateVariables,
      leadId,
      ticketId,
      userId,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error: any) {
    console.error('❌ Error in send message API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}












