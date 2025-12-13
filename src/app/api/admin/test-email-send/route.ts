// Quick test endpoint to verify email sending works
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/aws-ses'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Testing email send...')
    console.log('AWS_SES_FROM_EMAIL:', process.env.AWS_SES_FROM_EMAIL)
    console.log('AWS_SES_REGION:', process.env.AWS_SES_REGION)
    console.log('Has AWS_SES_ACCESS_KEY_ID:', !!process.env.AWS_SES_ACCESS_KEY_ID)
    console.log('Has AWS_SES_SECRET_ACCESS_KEY:', !!process.env.AWS_SES_SECRET_ACCESS_KEY)

    const { to } = await request.json()

    // Try to send email
    await sendEmail({
      to: to || user.email,
      subject: 'Test Email from VibrationFit',
      htmlBody: '<p>This is a test email. If you received this, AWS SES is working!</p>',
      textBody: 'This is a test email. If you received this, AWS SES is working!',
      replyTo: 'team@vibrationfit.com',
    })

    console.log('✅ Email sent successfully!')

    // Try to log to database
    const adminClient = createAdminClient()
    const { error: logError } = await adminClient.from('email_messages').insert({
      user_id: user.id,
      from_email: process.env.AWS_SES_FROM_EMAIL || 'team@vibrationfit.com',
      to_email: to || user.email,
      subject: 'Test Email from VibrationFit',
      body_text: 'This is a test email.',
      body_html: '<p>This is a test email. If you received this, AWS SES is working!</p>',
      direction: 'outbound',
      status: 'sent',
    })

    if (logError) {
      console.error('❌ Failed to log email to database:', logError)
      return NextResponse.json({
        success: true,
        warning: 'Email sent but not logged to database',
        error: logError.message,
      })
    }

    console.log('✅ Email logged to database!')

    return NextResponse.json({
      success: true,
      message: 'Email sent and logged successfully!',
      to: to || user.email,
    })
  } catch (error: any) {
    console.error('❌ Test email failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send test email',
    }, { status: 500 })
  }
}

