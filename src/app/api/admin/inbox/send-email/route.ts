export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { sendAndLogEmail } from '@/lib/email/send'
import { getSenderById, DEFAULT_CRM_SENDER } from '@/lib/crm/senders'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { to, subject, textBody, htmlBody, senderId, userId } = body

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Recipient email and subject are required' },
        { status: 400 }
      )
    }

    const sender = senderId ? getSenderById(senderId) : DEFAULT_CRM_SENDER

    const result = await sendAndLogEmail({
      to: [to],
      subject,
      textBody: textBody || '',
      htmlBody: htmlBody || textBody || '',
      from: sender.from,
      context: {
        userId: userId || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error: unknown) {
    console.error('Error sending email from inbox:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
