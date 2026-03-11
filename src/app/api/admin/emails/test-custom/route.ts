export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/aws-ses'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { to, subject, htmlBody, textBody } = await request.json()

    if (!to || !subject || !htmlBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await sendEmail({
      to,
      subject,
      htmlBody,
      textBody,
      replyTo: 'team@vibrationfit.com',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}
