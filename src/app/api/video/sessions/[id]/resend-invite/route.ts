/**
 * Resend Session Invitation API
 * 
 * POST /api/video/sessions/[id]/resend-invite - Resend invitation email to participant
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OUTBOUND_URL } from '@/lib/urls'
import { sendAndLogEmail } from '@/lib/email/send'
import { generateSessionInvitationEmail } from '@/lib/email/templates'
import { formatDateInTimeZone, DEFAULT_DISPLAY_TIMEZONE } from '@/lib/format/timezone'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session with participants
    const { data: session, error: sessionError } = await supabase
      .from('video_sessions')
      .select(`
        *,
        participants:video_session_participants(*)
      `)
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Resolve timezone for display: staff's timezone if session has staff_id, else default
    let timeZone = DEFAULT_DISPLAY_TIMEZONE
    if (session.staff_id) {
      const { data: staff } = await supabase
        .from('staff')
        .select('timezone')
        .eq('id', session.staff_id)
        .single()
      if (staff?.timezone) timeZone = staff.timezone
    }

    // Check if user is the host
    if (session.host_user_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can resend invitations' }, { status: 403 })
    }

    // Find the participant (non-host)
    const participant = session.participants?.find((p: { is_host: boolean }) => !p.is_host)
    
    if (!participant?.email) {
      return NextResponse.json({ error: 'No participant email found' }, { status: 400 })
    }

    // Get host name
    const host = session.participants?.find((p: { is_host: boolean }) => p.is_host)
    const hostName = host?.name || 'Your Host'

    const scheduledAt = new Date(session.scheduled_at)
    const joinLink = `${OUTBOUND_URL}/session/${session.id}`

    const { date: scheduledDate, time: scheduledTime } = formatDateInTimeZone(scheduledAt, timeZone)

    // Generate email
    const emailData = await generateSessionInvitationEmail({
      participantName: participant.name || participant.email,
      participantEmail: participant.email,
      hostName,
      sessionTitle: session.title,
      sessionDescription: session.description,
      scheduledDate,
      scheduledTime,
      durationMinutes: session.scheduled_duration_minutes,
      joinLink,
    })

    await sendAndLogEmail({
      to: participant.email,
      subject: emailData.subject,
      htmlBody: emailData.htmlBody,
      textBody: emailData.textBody,
      context: { guestEmail: participant.email },
    })

    console.log('[video/resend-invite] Invitation resent to:', participant.email)

    return NextResponse.json({ 
      success: true, 
      message: `Invitation sent to ${participant.email}` 
    })
  } catch (error) {
    console.error('Error in POST /api/video/sessions/[id]/resend-invite:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

// GET - Preview the email without sending
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session with participants
    const { data: session, error: sessionError } = await supabase
      .from('video_sessions')
      .select(`
        *,
        participants:video_session_participants(*)
      `)
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Resolve timezone for display: staff's timezone if session has staff_id, else default
    let timeZone = DEFAULT_DISPLAY_TIMEZONE
    if (session.staff_id) {
      const { data: staff } = await supabase
        .from('staff')
        .select('timezone')
        .eq('id', session.staff_id)
        .single()
      if (staff?.timezone) timeZone = staff.timezone
    }

    // Check if user is the host
    if (session.host_user_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can view invitations' }, { status: 403 })
    }

    // Find the participant (non-host)
    const participant = session.participants?.find((p: { is_host: boolean }) => !p.is_host)
    
    if (!participant?.email) {
      return NextResponse.json({ error: 'No participant email found' }, { status: 400 })
    }

    // Get host name
    const host = session.participants?.find((p: { is_host: boolean }) => p.is_host)
    const hostName = host?.name || 'Your Host'

    const scheduledAt = new Date(session.scheduled_at)
    const joinLink = `${OUTBOUND_URL}/session/${session.id}`

    const { date: scheduledDate, time: scheduledTime } = formatDateInTimeZone(scheduledAt, timeZone)

    // Generate email preview
    const emailData = await generateSessionInvitationEmail({
      participantName: participant.name || participant.email,
      participantEmail: participant.email,
      hostName,
      sessionTitle: session.title,
      sessionDescription: session.description,
      scheduledDate,
      scheduledTime,
      durationMinutes: session.scheduled_duration_minutes,
      joinLink,
    })

    return NextResponse.json({
      to: participant.email,
      subject: emailData.subject,
      htmlBody: emailData.htmlBody,
      participantName: participant.name || participant.email,
    })
  } catch (error) {
    console.error('Error in GET /api/video/sessions/[id]/resend-invite:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}



