export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { sendAndLogEmail } from '@/lib/email/send'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { user } = auth

    const { to, subject, htmlBody, textBody } = await request.json()

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Recipient email and subject are required' },
        { status: 400 }
      )
    }

    if (!htmlBody && !textBody) {
      return NextResponse.json(
        { error: 'Email body (HTML or text) is required' },
        { status: 400 }
      )
    }

    await sendAndLogEmail({
      to,
      subject: `[TEST] ${subject}`,
      ...(htmlBody ? { htmlBody } : {}),
      textBody: textBody || htmlBody?.replace(/<[^>]*>/g, '') || '',
      context: { userId: user.id },
    })

    return NextResponse.json({ success: true, message: `Test email sent to ${to}` })
  } catch (error: unknown) {
    console.error('Error sending test email:', error)
    const msg = error instanceof Error ? error.message : 'Failed to send test email'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
