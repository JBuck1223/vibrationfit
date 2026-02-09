// Send bulk SMS or email to multiple members
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isUserAdmin } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/messaging/twilio'
import { sendBulkEmail } from '@/lib/email/aws-ses'

const MAX_RECIPIENTS = 500

export async function POST(request: NextRequest) {
  try {
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
    const { userIds, type, message, subject } = body

    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ error: 'No recipients selected' }, { status: 400 })
    }

    if (userIds.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Too many recipients. Maximum is ${MAX_RECIPIENTS}.` },
        { status: 400 }
      )
    }

    if (!type || !['sms', 'email'].includes(type)) {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 })
    }

    if (!message) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (type === 'email' && !subject) {
      return NextResponse.json({ error: 'Email subject is required' }, { status: 400 })
    }

    // Use admin client for ALL queries to bypass RLS
    const adminClient = createAdminClient()

    // Get member details
    const { data: profiles, error: profileError } = await adminClient
      .from('user_profiles')
      .select('user_id, email, phone, first_name, last_name, sms_opt_in')
      .in('user_id', userIds)
      .eq('is_active', true)

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      throw new Error(`Failed to fetch member details: ${profileError.message}`)
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: 'No valid members found' }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    if (type === 'sms') {
      // Send SMS to each member
      for (const profile of profiles) {
        if (!profile.phone) {
          results.failed++
          results.errors.push(`${profile.email}: No phone number`)
          continue
        }

        // Check SMS opt-in (A2P/TCPA compliance)
        if (!profile.sms_opt_in) {
          results.failed++
          results.errors.push(`${profile.email}: User has not opted in to SMS notifications`)
          continue
        }

        try {
          const result = await sendSMS({
            to: profile.phone,
            body: message,
          })

          if (result.success) {
            // Log to sms_messages table using admin client
            await adminClient.from('sms_messages').insert({
              user_id: profile.user_id,
              from_number: process.env.TWILIO_PHONE_NUMBER,
              to_number: profile.phone,
              body: message,
              direction: 'outbound',
              status: 'sent',
              twilio_sid: result.sid,
            })
            results.success++
          } else {
            results.failed++
            results.errors.push(`${profile.email}: ${result.error}`)
          }
        } catch (error: unknown) {
          results.failed++
          const errMsg = error instanceof Error ? error.message : 'Unknown error'
          results.errors.push(`${profile.email}: ${errMsg}`)
        }
      }
    } else if (type === 'email') {
      const recipients = profiles.map((p) => p.email).filter(Boolean)

      if (recipients.length === 0) {
        return NextResponse.json({ error: 'No valid email addresses found' }, { status: 400 })
      }

      try {
        await sendBulkEmail({
          recipients,
          subject,
          htmlBody: `<p>Hi there,</p><p>${message.replace(/\n/g, '<br>')}</p>`,
          textBody: `Hi there,\n\n${message}`,
          replyTo: 'team@vibrationfit.com',
        })
        
        results.success = recipients.length
        results.failed = profiles.length - recipients.length
        results.errors = []

        // Log successful emails to database
        const emailLogs = profiles
          .filter((p) => p.email)
          .map((p) => ({
            user_id: p.user_id,
            from_email: process.env.AWS_SES_FROM_EMAIL || 'no-reply@vibrationfit.com',
            to_email: p.email,
            subject,
            body_text: `Hi ${p.first_name || 'there'},\n\n${message}`,
            body_html: `<p>Hi ${p.first_name || 'there'},</p><p>${message.replace(/\n/g, '<br>')}</p>`,
            direction: 'outbound',
            status: 'sent',
            created_at: new Date().toISOString(),
          }))

        const { error: insertError } = await adminClient.from('email_messages').insert(emailLogs)
        if (insertError) {
          console.error('Failed to log emails to database:', insertError)
        }
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Failed to send bulk email'
        console.error('Bulk email error:', error)
        throw new Error(errMsg)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Failed to send bulk message'
    console.error('Error sending bulk message:', error)
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    )
  }
}
