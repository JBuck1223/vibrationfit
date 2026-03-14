/**
 * POST /api/intensive/booking-confirmation
 *
 * Called after a user self-books a calibration call (pending booking).
 * Sends confirmation email + SMS to the user and notifies admins via SMS.
 * All templates and channel toggles are driven by the notification_configs table.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications/config'
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

    const { data: account } = await admin
      .from('user_accounts')
      .select('first_name, last_name')
      .eq('id', user.id)
      .maybeSingle()

    const firstName = account?.first_name || user.email?.split('@')[0] || ''
    const fullName = [account?.first_name, account?.last_name].filter(Boolean).join(' ')
      || booking.contact_email || ''

    const scheduledAt = new Date(booking.scheduled_at)
    const tz = booking.timezone || DEFAULT_DISPLAY_TIMEZONE
    const { date: scheduledDate, time: scheduledTime } = formatDateInTimeZone(scheduledAt, tz)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'
    const joinLink = `${appUrl}/intensive/call-prep`

    sendNotification({
      slug: 'calibration_call_requested',
      variables: {
        firstName,
        userName: fullName,
        email: booking.contact_email || 'no email',
        phone: booking.contact_phone || '',
        scheduledDate,
        scheduledTime,
        duration: String(booking.duration_minutes || 45),
        joinLink,
      },
      recipientEmail: booking.contact_email || undefined,
      recipientPhone: booking.contact_phone || undefined,
      userId: user.id,
    }).catch(err => console.error('Notification error:', err))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in booking-confirmation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
