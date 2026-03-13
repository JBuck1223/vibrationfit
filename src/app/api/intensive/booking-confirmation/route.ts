/**
 * POST /api/intensive/booking-confirmation
 *
 * Called after a user self-books a calibration call (pending booking).
 * Sends confirmation email + SMS to the user and notifies admins via SMS.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAndLogEmail } from '@/lib/email/send'
import { sendSMS } from '@/lib/messaging/twilio'
import { notifyAdminSMS } from '@/lib/admin/notifications'
import { formatDateInTimeZone, DEFAULT_DISPLAY_TIMEZONE } from '@/lib/format/timezone'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { booking_id } = await request.json()
    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: booking, error: fetchError } = await admin
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const { data: profile } = await admin
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle()

    const firstName = profile?.first_name || user.email?.split('@')[0] || ''
    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || firstName

    const scheduledAt = new Date(booking.scheduled_at)
    const tz = booking.timezone || DEFAULT_DISPLAY_TIMEZONE
    const { date: scheduledDate, time: scheduledTime } = formatDateInTimeZone(scheduledAt, tz)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'

    // --- Confirmation email to user ---
    if (booking.contact_email) {
      const htmlBody = `
        <div style="background:#000;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;background:#1F1F1F;border:2px solid #39FF14;border-radius:16px;padding:40px;">
            <h1 style="color:#39FF14;font-size:24px;margin:0 0 8px;text-align:center;">Calibration Call Requested</h1>
            <p style="color:#999;font-size:14px;margin:0 0 32px;text-align:center;">Your request has been received</p>

            <p style="color:#E5E5E5;font-size:16px;line-height:1.6;margin:0 0 24px;">
              Hi ${firstName},
            </p>
            <p style="color:#E5E5E5;font-size:16px;line-height:1.6;margin:0 0 24px;">
              Your calibration call request has been submitted. A coach will be assigned and you will receive a confirmation with your join link.
            </p>

            <div style="background:rgba(57,255,20,0.05);border:1px solid #333;border-radius:12px;padding:20px;margin:0 0 24px;">
              <p style="color:#E5E5E5;margin:0 0 8px;font-size:15px;"><strong style="color:#39FF14;">Date:</strong> ${scheduledDate}</p>
              <p style="color:#E5E5E5;margin:0 0 8px;font-size:15px;"><strong style="color:#39FF14;">Time:</strong> ${scheduledTime}</p>
              <p style="color:#E5E5E5;margin:0;font-size:15px;"><strong style="color:#39FF14;">Duration:</strong> ${booking.duration_minutes || 45} minutes</p>
            </div>

            <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 24px;">
              We will send you another email with your video link once your coach is confirmed. If you need to make changes, visit your
              <a href="${appUrl}/intensive/schedule-call" style="color:#39FF14;text-decoration:none;font-weight:600;">booking page</a>.
            </p>

            <div style="text-align:center;padding:24px 0 0;border-top:1px solid #333;">
              <p style="color:#555;font-size:12px;margin:0;">Vibration Fit &middot; Above the Green Line</p>
            </div>
          </div>
        </div>`

      const textBody = `Hi ${firstName},\n\nYour calibration call request has been submitted.\n\nDate: ${scheduledDate}\nTime: ${scheduledTime}\nDuration: ${booking.duration_minutes || 45} minutes\n\nA coach will be assigned and you will receive a confirmation with your join link.\n\nVibration Fit`

      sendAndLogEmail({
        to: booking.contact_email,
        subject: `Calibration Call Requested - ${scheduledDate}`,
        htmlBody,
        textBody,
        context: { userId: user.id },
      }).catch(err => console.error('Booking confirmation email failed:', err))
    }

    // --- Confirmation SMS to user ---
    if (booking.contact_phone) {
      sendSMS({
        to: booking.contact_phone,
        body: `VibrationFit: Your calibration call is requested for ${scheduledDate} at ${scheduledTime}. We'll confirm your coach and send a join link soon.`,
      }).catch(err => console.error('Booking confirmation SMS failed:', err))
    }

    // --- Admin SMS ---
    notifyAdminSMS(
      `New Calibration Call Request: ${fullName} (${booking.contact_email || 'no email'}) for ${scheduledDate} at ${scheduledTime} - Status: Pending`
    ).catch(err => console.error('Admin SMS error:', err))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in booking-confirmation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
