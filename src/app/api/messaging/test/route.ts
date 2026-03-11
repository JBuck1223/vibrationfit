// Test endpoint to verify Twilio configuration
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { isTwilioConfigured } from '@/lib/messaging/twilio'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
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












