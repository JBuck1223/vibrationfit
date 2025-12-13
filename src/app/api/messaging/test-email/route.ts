// Test AWS SES email configuration
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const testEmail = body.email || user.email

    console.log('🧪 Testing AWS SES with config:', {
      to: testEmail,
      from: process.env.AWS_SES_FROM_EMAIL,
      region: process.env.AWS_SES_REGION,
      hasAccessKey: !!process.env.AWS_SES_ACCESS_KEY_ID || !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SES_SECRET_ACCESS_KEY || !!process.env.AWS_SECRET_ACCESS_KEY,
    })

    await sendEmail({
      to: testEmail,
      subject: 'VibrationFit AWS SES Test Email',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #199D67;">✅ AWS SES is Working!</h2>
          <p style="color: #333; line-height: 1.6;">
            If you're reading this, your AWS SES email configuration is working correctly.
          </p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #666;">Configuration Details:</h3>
            <p style="margin: 5px 0; color: #333;"><strong>From:</strong> ${process.env.AWS_SES_FROM_EMAIL || 'team@vibrationfit.com'}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Region:</strong> ${process.env.AWS_SES_REGION || 'us-east-1'}</p>
            <p style="margin: 5px 0; color: #333;"><strong>To:</strong> ${testEmail}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best,<br>
            VibrationFit Team
          </p>
        </div>
      `,
      textBody: `AWS SES Test Email\n\nIf you're reading this, your AWS SES configuration is working!\n\nFrom: ${process.env.AWS_SES_FROM_EMAIL}\nRegion: ${process.env.AWS_SES_REGION}\nTo: ${testEmail}\n\nBest,\nVibrationFit Team`,
      replyTo: 'team@vibrationfit.com',
    })

    console.log('✅ Test email sent successfully to:', testEmail)

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testEmail}. Check your inbox!`,
      config: {
        from: process.env.AWS_SES_FROM_EMAIL,
        region: process.env.AWS_SES_REGION,
        to: testEmail,
      },
    })
  } catch (error: any) {
    console.error('❌ AWS SES test failed:', {
      error: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code || 'UNKNOWN',
        details: {
          from: process.env.AWS_SES_FROM_EMAIL,
          region: process.env.AWS_SES_REGION,
          hasAccessKey: !!(process.env.AWS_SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID),
          hasSecretKey: !!(process.env.AWS_SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY),
        },
      },
      { status: 500 }
    )
  }
}

