// Send email to a specific member
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isUserAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/aws-ses'

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
    const { to, subject, htmlBody, textBody } = body

    if (!to || !subject || (!htmlBody && !textBody)) {
      return NextResponse.json(
        { error: 'Email address, subject, and body are required' },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 })
    }

    // Send email via AWS SES
    await sendEmail({
      to,
      subject,
      htmlBody: htmlBody || `<p>${textBody}</p>`,
      textBody: textBody || htmlBody?.replace(/<[^>]*>/g, ''),
      replyTo: 'team@vibrationfit.com',
    })

    // Log to database for conversation history (use admin client to bypass RLS)
    const adminClient = createAdminClient()
    const { error: logError } = await adminClient
      .from('email_messages')
      .insert({
        user_id: id,
        from_email: process.env.AWS_SES_FROM_EMAIL || 'no-reply@vibrationfit.com',
        to_email: to,
        subject,
        body_text: textBody || htmlBody?.replace(/<[^>]*>/g, ''),
        body_html: htmlBody,
        direction: 'outbound',
        status: 'sent',
        created_at: new Date().toISOString(),
      })

    if (logError) {
      console.error('Failed to log email:', logError)
      // Continue anyway - email was sent
    }

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
