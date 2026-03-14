/**
 * Admin Schedule Call API
 *
 * GET  - List intensive users eligible for call scheduling + staff availability
 * POST - Create a booking + video session on behalf of a user
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications/config'

const EVENT_TYPE = 'intensive_calibration'
const SLOT_DURATION = 45

function toEasternUTC(dateStr: string, timeStr: string): Date {
  const noonUtc = new Date(`${dateStr}T12:00:00Z`)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    hour12: false,
  })
  const etNoonHour = parseInt(formatter.format(noonUtc))
  const offsetHours = etNoonHour - 12
  const [h, m] = timeStr.split(':').map(Number)
  const result = new Date(`${dateStr}T00:00:00Z`)
  result.setUTCHours(h - offsetHours, m, 0, 0)
  return result
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    if (section === 'users') {
      const { data: users, error } = await supabase
        .from('intensive_checklist')
        .select(`
          id,
          user_id,
          intensive_id,
          call_scheduled,
          call_scheduled_time,
          call_scheduled_at,
          status
        `)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const usersWithProfiles = await Promise.all(
        (users || []).map(async (item) => {
          const { data: account } = await supabase
            .from('user_accounts')
            .select('email, phone, first_name, last_name')
            .eq('id', item.user_id)
            .single()

          const fullName = [account?.first_name, account?.last_name].filter(Boolean).join(' ')
          return {
            ...item,
            email: account?.email || 'Unknown',
            first_name: account?.first_name || '',
            last_name: account?.last_name || '',
            phone: account?.phone || '',
            display_name: fullName || account?.email || 'Unknown',
          }
        })
      )

      return NextResponse.json({ users: usersWithProfiles })
    }

    if (section === 'staff') {
      const { data: staffData, error } = await supabase
        .from('staff')
        .select('id, display_name, default_buffer_minutes, availability, event_types, timezone')
        .eq('is_active', true)
        .contains('event_types', [EVENT_TYPE])

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ staff: staffData || [] })
    }

    if (section === 'slots') {
      const date = searchParams.get('date')
      if (!date) {
        return NextResponse.json({ error: 'date parameter required' }, { status: 400 })
      }

      const { data: staffData } = await supabase
        .from('staff')
        .select('id, display_name, default_buffer_minutes, availability, event_types')
        .eq('is_active', true)
        .contains('event_types', [EVENT_TYPE])

      const { data: blockingEvents } = await supabase
        .from('calendar_events')
        .select('staff_id, scheduled_at, end_at')
        .gte('scheduled_at', `${date}T00:00:00`)
        .lt('end_at', `${date}T23:59:59`)
        .eq('blocks_availability', true)
        .neq('status', 'cancelled')

      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dateObj = new Date(date + 'T12:00:00Z')
      const dayName = dayNames[dateObj.getUTCDay()]

      const blockedByStaff = new Map<string, Array<{ start: number; end: number }>>()
      blockingEvents?.forEach((event: any) => {
        if (!event.staff_id) return
        const startTime = new Date(event.scheduled_at)
        const endTime = new Date(event.end_at)
        if (startTime.toISOString().split('T')[0] !== date) return

        const startMinutes = startTime.getHours() * 60 + startTime.getMinutes()
        const endMinutes = endTime.getHours() * 60 + endTime.getMinutes()

        if (!blockedByStaff.has(event.staff_id)) {
          blockedByStaff.set(event.staff_id, [])
        }
        blockedByStaff.get(event.staff_id)!.push({ start: startMinutes, end: endMinutes })
      })

      const slots: Array<{ staff_id: string; staff_name: string; time: string; date: string }> = []

      for (const staff of (staffData || [])) {
        const dayAvail = (staff.availability as any)?.[dayName]
        if (!dayAvail?.enabled) continue

        const [startH, startM] = dayAvail.start.split(':').map(Number)
        const [endH, endM] = dayAvail.end.split(':').map(Number)

        let currentMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM
        const staffBlocked = blockedByStaff.get(staff.id) || []
        const buffer = staff.default_buffer_minutes || 15

        while (currentMinutes + SLOT_DURATION <= endMinutes) {
          const slotEnd = currentMinutes + SLOT_DURATION
          const hasConflict = staffBlocked.some(
            (blocked) => currentMinutes < blocked.end && slotEnd > blocked.start
          )

          if (!hasConflict) {
            const hours = Math.floor(currentMinutes / 60)
            const mins = currentMinutes % 60
            const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
            slots.push({ staff_id: staff.id, staff_name: staff.display_name, time: timeStr, date })
          }

          currentMinutes += SLOT_DURATION + buffer
        }
      }

      slots.sort((a, b) => a.time.localeCompare(b.time))
      return NextResponse.json({ slots })
    }

    if (section === 'bookings') {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id, staff_id, user_id, event_type, title, description,
          scheduled_at, duration_minutes, timezone, meeting_type,
          video_session_id, contact_email, contact_phone,
          status, staff_notes, client_notes, created_at
        `)
        .eq('event_type', EVENT_TYPE)
        .order('scheduled_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const bookingsWithDetails = await Promise.all(
        (bookings || []).map(async (booking) => {
          const { data: account } = await supabase
            .from('user_accounts')
            .select('email, full_name, first_name, last_name')
            .eq('id', booking.user_id)
            .single()

          let staffName = 'Unassigned'
          if (booking.staff_id) {
            const { data: staffMember } = await supabase
              .from('staff')
              .select('display_name')
              .eq('id', booking.staff_id)
              .single()
            staffName = staffMember?.display_name || 'Unassigned'
          }

          let recordingUrl: string | null = null
          let sessionStatus: string | null = null
          if (booking.video_session_id) {
            const { data: session } = await supabase
              .from('video_sessions')
              .select('recording_url, recording_status, status')
              .eq('id', booking.video_session_id)
              .single()
            recordingUrl = session?.recording_url || null
            sessionStatus = session?.status || null
          }

          const userName = account?.full_name
            || account?.email
            || booking.contact_email
            || 'Unknown'

          return {
            ...booking,
            user_name: userName,
            user_email: account?.email || booking.contact_email || 'Unknown',
            staff_name: staffName,
            recording_url: recordingUrl,
            session_status: sessionStatus,
          }
        })
      )

      return NextResponse.json({ bookings: bookingsWithDetails })
    }

    return NextResponse.json({ error: 'Invalid section parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error in admin schedule-call GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST - Admin creates a new booking directly (already confirmed with staff)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const {
      user_id,
      intensive_id,
      staff_id,
      date,
      time,
      contact_email,
      contact_phone,
      staff_name,
    } = body

    if (!user_id || !staff_id || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, staff_id, date, time' },
        { status: 400 }
      )
    }

    const scheduledDateTime = toEasternUTC(date, time)
    if (isNaN(scheduledDateTime.getTime())) {
      return NextResponse.json({ error: 'Invalid date/time' }, { status: 400 })
    }

    const sessionTitle = staff_name
      ? `Calibration Call with ${staff_name}`
      : 'Activation Intensive - Calibration Call'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'
    const sessionResponse = await fetch(`${baseUrl}/api/video/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        title: sessionTitle,
        description: 'Your personalized 1-on-1 vision calibration session',
        session_type: 'one_on_one',
        scheduled_at: scheduledDateTime.toISOString(),
        scheduled_duration_minutes: SLOT_DURATION,
        participant_user_id: user_id,
        participant_email: contact_email,
        participant_phone: contact_phone || undefined,
        enable_recording: true,
        enable_waiting_room: true,
        staff_id,
        event_type: EVENT_TYPE,
      }),
    })

    if (!sessionResponse.ok) {
      const sessionError = await sessionResponse.json()
      return NextResponse.json(
        { error: `Video session creation failed: ${sessionError.error || 'Unknown error'}` },
        { status: 500 }
      )
    }

    const sessionData = await sessionResponse.json()
    const videoSessionId = sessionData.session.id

    const supabase = createAdminClient()

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        staff_id,
        user_id,
        event_type: EVENT_TYPE,
        title: sessionTitle,
        description: 'Your personalized 1-on-1 vision calibration session',
        scheduled_at: scheduledDateTime.toISOString(),
        duration_minutes: SLOT_DURATION,
        timezone: 'America/New_York',
        meeting_type: 'video',
        video_session_id: videoSessionId,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        status: 'confirmed',
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Booking insert error:', bookingError)
      return NextResponse.json(
        { error: `Booking failed: ${bookingError.message}` },
        { status: 500 }
      )
    }

    if (intensive_id) {
      const { error: checklistError } = await supabase
        .from('intensive_checklist')
        .update({
          call_scheduled: true,
          call_scheduled_at: new Date().toISOString(),
          call_scheduled_time: scheduledDateTime.toISOString(),
        })
        .eq('intensive_id', intensive_id)

      if (checklistError) {
        console.error('Checklist update error:', checklistError)
      }
    }

    const { data: userAccount } = await supabase
      .from('user_accounts')
      .select('first_name, last_name')
      .eq('id', user_id)
      .maybeSingle()
    const userName = [userAccount?.first_name, userAccount?.last_name].filter(Boolean).join(' ')
      || contact_email || user_id
    const dateStr = new Date(scheduledDateTime).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    })
    const timeStr = new Date(scheduledDateTime).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
    })
    const joinLink = `${baseUrl}/session/${videoSessionId}`
    sendNotification({
      slug: 'calibration_call_booked',
      variables: {
        userName,
        email: contact_email || '',
        scheduledDate: dateStr,
        scheduledTime: timeStr,
        coach: staff_name || 'TBD',
        joinLink,
      },
    }).catch(err => console.error('Notification error:', err))

    return NextResponse.json({
      success: true,
      booking,
      video_session_id: videoSessionId,
      session_join_url: `${baseUrl}/session/${videoSessionId}`,
    })
  } catch (error) {
    console.error('Error in admin schedule-call POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH - Two actions:
 *   1. action=confirm  -> Assign staff, create video session, set status = confirmed
 *   2. action=reschedule -> Change the scheduled date/time on a pending or confirmed booking
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const action = body.action || 'confirm'

    // ── Reschedule action ──
    if (action === 'reschedule') {
      const { booking_id, scheduled_at } = body

      if (!booking_id || !scheduled_at) {
        return NextResponse.json(
          { error: 'Missing required fields: booking_id, scheduled_at' },
          { status: 400 }
        )
      }

      const supabase = createAdminClient()

      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking_id)
        .single()

      if (fetchError || !booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      if (booking.status === 'completed' || booking.status === 'cancelled') {
        return NextResponse.json(
          { error: `Cannot reschedule a ${booking.status} booking` },
          { status: 400 }
        )
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ scheduled_at })
        .eq('id', booking_id)

      if (updateError) {
        return NextResponse.json({ error: `Update failed: ${updateError.message}` }, { status: 500 })
      }

      // Update intensive checklist scheduled time
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('intensive_id')
        .eq('user_id', booking.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (checklist) {
        await supabase
          .from('intensive_checklist')
          .update({ call_scheduled_time: scheduled_at })
          .eq('intensive_id', checklist.intensive_id)
      }

      // Notify the user about the reschedule
      const newDateTime = new Date(scheduled_at)
      const newDate = newDateTime.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      })
      const newTime = newDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
      })

      const { data: account } = await supabase
        .from('user_accounts')
        .select('first_name, last_name')
        .eq('id', booking.user_id)
        .maybeSingle()

      const firstName = account?.first_name || booking.contact_email?.split('@')[0] || ''
      const userName = [account?.first_name, account?.last_name].filter(Boolean).join(' ')
        || booking.contact_email || ''

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'
      const joinLink = booking.video_session_id
        ? `${baseUrl}/session/${booking.video_session_id}`
        : `${baseUrl}/intensive/call-prep`

      sendNotification({
        slug: 'calibration_call_rescheduled',
        variables: {
          firstName,
          userName,
          email: booking.contact_email || '',
          newDate,
          newTime,
          joinLink,
        },
        recipientEmail: booking.contact_email || undefined,
        recipientPhone: booking.contact_phone || undefined,
        userId: booking.user_id,
      }).catch(err => console.error('Reschedule notification error:', err))

      return NextResponse.json({ success: true })
    }

    // ── Confirm action (default) ──
    const { booking_id, staff_id } = body

    if (!booking_id || !staff_id) {
      return NextResponse.json(
        { error: 'Missing required fields: booking_id, staff_id' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch the pending booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: `Booking is already ${booking.status}` },
        { status: 400 }
      )
    }

    // Look up staff name
    const { data: staffMember } = await supabase
      .from('staff')
      .select('display_name')
      .eq('id', staff_id)
      .single()

    const staffName = staffMember?.display_name || ''
    const sessionTitle = staffName
      ? `Calibration Call with ${staffName}`
      : 'Activation Intensive - Calibration Call'

    // Create video session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'
    const sessionResponse = await fetch(`${baseUrl}/api/video/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        title: sessionTitle,
        description: 'Your personalized 1-on-1 vision calibration session',
        session_type: 'one_on_one',
        scheduled_at: booking.scheduled_at,
        scheduled_duration_minutes: booking.duration_minutes || SLOT_DURATION,
        participant_user_id: booking.user_id,
        participant_email: booking.contact_email,
        participant_phone: booking.contact_phone || undefined,
        enable_recording: true,
        enable_waiting_room: true,
        staff_id,
        event_type: EVENT_TYPE,
      }),
    })

    if (!sessionResponse.ok) {
      const sessionError = await sessionResponse.json()
      return NextResponse.json(
        { error: `Video session creation failed: ${sessionError.error || 'Unknown error'}` },
        { status: 500 }
      )
    }

    const sessionData = await sessionResponse.json()
    const videoSessionId = sessionData.session.id

    // Update booking: assign staff, link video session, set confirmed
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        staff_id,
        video_session_id: videoSessionId,
        title: sessionTitle,
        status: 'confirmed',
      })
      .eq('id', booking_id)
      .select()
      .single()

    if (updateError) {
      console.error('Booking update error:', updateError)
      return NextResponse.json(
        { error: `Failed to confirm booking: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      video_session_id: videoSessionId,
      session_join_url: `${baseUrl}/session/${videoSessionId}`,
      staff_name: staffName,
    })
  } catch (error) {
    console.error('Error in admin schedule-call PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE - Remove a booking entirely. Also resets the user's intensive checklist
 * call_scheduled fields so they can rebook if needed.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('booking_id')

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, user_id, video_session_id')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Delete the booking row
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId)

    if (deleteError) {
      return NextResponse.json({ error: `Delete failed: ${deleteError.message}` }, { status: 500 })
    }

    // Reset the user's intensive checklist so they can rebook
    const { data: checklist } = await supabase
      .from('intensive_checklist')
      .select('intensive_id')
      .eq('user_id', booking.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (checklist) {
      await supabase
        .from('intensive_checklist')
        .update({
          call_scheduled: false,
          call_scheduled_at: null,
          call_scheduled_time: null,
        })
        .eq('intensive_id', checklist.intensive_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in admin schedule-call DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT - Mark a booking as completed (call already happened outside the system)
 * Also updates the user's intensive checklist so the step is marked done.
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { booking_id } = body

    if (!booking_id) {
      return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status === 'completed') {
      return NextResponse.json({ error: 'Booking is already completed' }, { status: 400 })
    }

    // Mark booking as completed
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', booking_id)

    if (updateError) {
      return NextResponse.json({ error: `Update failed: ${updateError.message}` }, { status: 500 })
    }

    // Find and update the user's intensive checklist
    const { data: checklist } = await supabase
      .from('intensive_checklist')
      .select('intensive_id')
      .eq('user_id', booking.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (checklist) {
      await supabase
        .from('intensive_checklist')
        .update({
          call_scheduled: true,
          call_scheduled_at: new Date().toISOString(),
          call_scheduled_time: booking.scheduled_at,
        })
        .eq('intensive_id', checklist.intensive_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in admin schedule-call PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
