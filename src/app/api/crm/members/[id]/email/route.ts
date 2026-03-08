// Send email to a specific member
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isUserAdmin } from '@/lib/supabase/admin'
import { sendAndLogEmail } from '@/lib/email/send'
import { getSenderById, DEFAULT_CRM_SENDER } from '@/lib/crm/senders'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { to, subject, htmlBody, textBody, senderId } = body
    const sender = getSenderById(senderId || DEFAULT_CRM_SENDER.id)

    if (!to || !subject || (!htmlBody && !textBody)) {
      return NextResponse.json(
        { error: 'Email address, subject, and body are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 })
    }

    await sendAndLogEmail({
      to,
      subject,
      from: sender.from,
      ...(htmlBody ? { htmlBody } : {}),
      textBody: textBody || htmlBody?.replace(/<[^>]*>/g, '') || '',
      replyTo: sender.email,
      context: { userId: id },
    })

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    })
  } catch (error: unknown) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
