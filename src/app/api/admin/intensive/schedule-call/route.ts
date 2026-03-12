/**
 * Admin Schedule Call API
 *
 * GET  - List intensive users eligible for call scheduling + staff availability
 * POST - Create a booking + video session on behalf of a user
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/admin'

const EVENT_TYPE = 'intensive_calibration'
const SLOT_DURATION = 45

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
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('email, first_name, last_name')
            .eq('user_id', item.user_id)
            .single()

          const { data: account } = await supabase
            .from('user_accounts')
            .select('email, phone')
            .eq('id', item.user_id)
            .single()

          return {
            ...item,
            email: profile?.email || account?.email || 'Unknown',
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            phone: account?.phone || '',
            display_name: profile
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown'
              : account?.email || 'Unknown',
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
      const dateObj = new Date(date + 'T00:00:00')
      const dayName = dayNames[dateObj.getDay()]

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
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('email, first_name, last_name')
            .eq('user_id', booking.user_id)
            .single()

          const { data: staffMember } = await supabase
            .from('staff')
            .select('display_name')
            .eq('id', booking.staff_id)
            .single()

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

          return {
            ...booking,
            user_name: profile
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
              : 'Unknown',
            user_email: profile?.email || booking.contact_email || 'Unknown',
            staff_name: staffMember?.display_name || 'Unassigned',
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

    const scheduledDateTime = new Date(`${date}T${time}:00`)
    if (isNaN(scheduledDateTime.getTime())) {
      return NextResponse.json({ error: 'Invalid date/time' }, { status: 400 })
    }

    const sessionTitle = staff_name
      ? `Calibration Call with ${staff_name}`
      : 'Activation Intensive - Calibration Call'

    // Create video session via the existing API (as the admin user)
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
        participant_email: contact_email,
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

    // Create booking using admin client (bypasses RLS)
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

    // Update intensive checklist if we have an intensive_id
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
