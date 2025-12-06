// Test endpoint to verify Twilio configuration
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isTwilioConfigured } from '@/lib/messaging/twilio'

export async function GET(request: NextRequest) {
  try {
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

    // Check Twilio configuration
    const configured = isTwilioConfigured()

    return NextResponse.json({
      twilioConfigured: configured,
      accountSid: process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing',
      authToken: process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '❌ Missing',
      message: configured 
        ? '✅ Twilio is ready to send messages!' 
        : '⚠️ Add Twilio credentials to .env.local',
    })
  } catch (error: any) {
    console.error('❌ Error checking Twilio config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}






