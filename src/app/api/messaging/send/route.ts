// /src/app/api/messaging/send/route.ts
// API endpoint to send SMS messages via Twilio

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendMessage } from '@/lib/messaging'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

