// Send email to a specific lead
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 })
    }

    await sendEmail({
      to,
      subject,
      htmlBody: htmlBody || `<p>${textBody}</p>`,
      textBody: textBody || htmlBody?.replace(/<[^>]*>/g, ''),
      replyTo: 'team@vibrationfit.com',
    })

    const adminClient = createAdminClient()

    // Log to email_messages for conversation history
    // Note: leads don't have a user_id, so we use guest_email + to_email for matching
    const { error: logError } = await adminClient
      .from('email_messages')
      .insert({
        from_email: process.env.AWS_SES_FROM_EMAIL || 'team@vibrationfit.com',
        to_email: to,
        guest_email: to,
        subject,
        body_text: textBody || htmlBody?.replace(/<[^>]*>/g, ''),
        body_html: htmlBody,
        direction: 'outbound',
        status: 'sent',
        created_at: new Date().toISOString(),
      })

    if (logError) {
      console.error('Failed to log email:', logError)
    }

    // Update lead status to 'contacted' if currently 'new'
    const { data: lead } = await adminClient
      .from('leads')
      .select('status')
      .eq('id', id)
      .single()

    if (lead?.status === 'new') {
      await adminClient
        .from('leads')
        .update({ status: 'contacted' })
        .eq('id', id)
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    })
  } catch (error: unknown) {
    console.error('Error sending email to lead:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
