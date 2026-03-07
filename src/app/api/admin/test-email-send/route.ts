// Quick test endpoint to verify email sending works
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAndLogEmail } from '@/lib/email/send'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[test-email] Testing email send...')
    console.log('AWS_SES_FROM_EMAIL:', process.env.AWS_SES_FROM_EMAIL)
    console.log('AWS_SES_REGION:', process.env.AWS_SES_REGION)
    console.log('Has AWS_SES_ACCESS_KEY_ID:', !!process.env.AWS_SES_ACCESS_KEY_ID)
    console.log('Has AWS_SES_SECRET_ACCESS_KEY:', !!process.env.AWS_SES_SECRET_ACCESS_KEY)

    const { to } = await request.json()

    const { messageId } = await sendAndLogEmail({
      to: to || user.email,
      subject: 'Test Email from VibrationFit',
      htmlBody: '<p>This is a test email. If you received this, AWS SES is working!</p>',
      textBody: 'This is a test email. If you received this, AWS SES is working!',
      replyTo: 'team@vibrationfit.com',
      context: { userId: user.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Email sent and logged successfully!',
      to: to || user.email,
      messageId,
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Failed to send test email'
    console.error('[test-email] Failed:', error)
    return NextResponse.json({
      success: false,
      error: errMsg,
    }, { status: 500 })
  }
}

