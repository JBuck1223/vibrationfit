/**
 * Video Sessions API
 * 
 * POST /api/video/sessions - Create a new session
 * GET /api/video/sessions - List user's sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OUTBOUND_URL } from '@/lib/urls'
import { getRoomUrl } from '@/lib/video/daily'
import { sendAndLogEmail } from '@/lib/email/send'
import { generateSessionInvitationEmail } from '@/lib/email/templates'
import { formatDateInTimeZone, DEFAULT_DISPLAY_TIMEZONE } from '@/lib/format/timezone'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CreateSessionRequest, CreateSessionResponse, VideoSession, VideoSessionType } from '@/lib/video/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateSessionRequest = await request.json()
    
    // Validate required fields
    if (!body.title || !body.scheduled_at) {
      return NextResponse.json(
        { error: 'Missing required fields: title, scheduled_at' },
        { status: 400 }
      )
    }

    const sessionType: VideoSessionType = body.session_type || 'one_on_one'
    const scheduledAt = new Date(body.scheduled_at)
    const durationMinutes = body.scheduled_duration_minutes || 60

    // Determine max participants by session type
    let maxParticipants = 2
    if (sessionType === 'group' || sessionType === 'workshop') {
      maxParticipants = 25
    } else if (sessionType === 'alignment_gym' || sessionType === 'webinar') {
      maxParticipants = 0
    }

    // Determine host: use staff member when staff_id is provided (e.g. calibration calls),
    // otherwise fall back to the authenticated user who created the session.
    let hostUserId = user.id
    let hostName = ''

    if (body.staff_id) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('user_id, display_name')
        .eq('id', body.staff_id)
        .single()

      if (staffData) {
        hostName = staffData.display_name || 'Vibration Fit Team'
        if (staffData.user_id) hostUserId = staffData.user_id
      }
    }

    if (!hostName) {
      const { data: account } = await supabase
        .from('user_accounts')
        .select('first_name, last_name, full_name')
        .eq('id', user.id)
        .single()

      hostName = account?.full_name || account?.first_name || user.email || 'Host'
    }

    // Build rows for all sessions (1 base + N-1 weekly repeats)
    const repeatCount = Math.min(Math.max(body.repeat_weekly_count ?? 1, 1), 52)
    const sessionRows = Array.from({ length: repeatCount }, (_, i) => {
      const date = new Date(scheduledAt)
      date.setDate(date.getDate() + i * 7)
      return {
        title: body.title,
        description: body.description,
        session_type: sessionType,
        status: 'scheduled' as const,
        scheduled_at: date.toISOString(),
        scheduled_duration_minutes: durationMinutes,
        host_user_id: hostUserId,
        enable_recording: body.enable_recording ?? true,
        enable_waiting_room: false,
        max_participants: maxParticipants,
        is_group_session: sessionType !== 'one_on_one',
        staff_id: body.staff_id || null,
        event_type: body.event_type || null,
        test_mode: body.test_mode ?? false,
      }
    })

    // Create session(s) in database (no Daily.co room yet -- created on demand at join time)
    const { data: sessions, error: sessionError } = await supabase
      .from('video_sessions')
      .insert(sessionRows)
      .select()

    if (sessionError || !sessions?.length) {
      console.error('Error creating session in database:', sessionError)
      return NextResponse.json(
        { error: `Database error: ${sessionError?.message ?? 'No rows returned'}` },
        { status: 500 }
      )
    }

    const session = sessions[0]

    // Add host as participant for every created session
    await supabase.from('video_session_participants').insert(
      sessions.map(s => ({
        session_id: s.id,
        user_id: hostUserId,
        name: hostName,
        is_host: true,
      }))
    )

    // Add invited participant if provided
    if (body.participant_user_id || body.participant_email || body.participant_name) {
      let participantUserId: string | null = body.participant_user_id || null
      let participantEmail: string | null = body.participant_email || null
      let participantFullName: string | null = body.participant_name || null

      let participantPhone: string | null = body.participant_phone || null

      // If user_id is provided directly, look up their details
      if (participantUserId) {
        const { data: userAccount } = await supabase
          .from('user_accounts')
          .select('id, first_name, last_name, full_name, email, phone')
          .eq('id', participantUserId)
          .single()
        if (userAccount) {
          if (!participantFullName) participantFullName = userAccount.full_name || null
          if (!participantEmail) participantEmail = userAccount.email || null
          if (!participantPhone) participantPhone = userAccount.phone || null
        }
      } else if (participantEmail) {
        // Fall back to email lookup for backwards compatibility
        const { data: foundUser } = await supabase
          .from('user_accounts')
          .select('id, first_name, last_name, full_name')
          .eq('email', participantEmail)
          .single()
        if (foundUser) {
          participantUserId = foundUser.id
          if (!participantFullName) participantFullName = foundUser.full_name || null
        }
      }

      const participantName = participantFullName || participantEmail || 'Guest'

      await supabase.from('video_session_participants').insert({
        session_id: session.id,
        user_id: participantUserId,
        email: participantEmail,
        phone: participantPhone,
        name: participantName,
        is_host: false,
      })

      // Session link — no login required, the link is the credential
      const joinLink = `${OUTBOUND_URL}/session/${session.id}`

      // Resolve timezone for email: staff's timezone if provided, else default
      let timeZone = DEFAULT_DISPLAY_TIMEZONE
      if (body.staff_id) {
        const { data: staff } = await supabase
          .from('staff')
          .select('timezone')
          .eq('id', body.staff_id)
          .single()
        if (staff?.timezone) timeZone = staff.timezone
      }
      const { date: scheduledDate, time: scheduledTime } = formatDateInTimeZone(scheduledAt, timeZone)

      // Send immediate invitation email
      if (body.participant_email) {
        try {
          const emailData = await generateSessionInvitationEmail({
            participantName,
            participantEmail: body.participant_email,
            hostName,
            sessionTitle: body.title,
            sessionDescription: body.description,
            scheduledDate,
            scheduledTime,
            durationMinutes,
            joinLink,
          })

          await sendAndLogEmail({
            to: body.participant_email,
            subject: emailData.subject,
            htmlBody: emailData.htmlBody,
            textBody: emailData.textBody,
            context: { guestEmail: body.participant_email },
          })

          console.log('[video/sessions] Invitation sent to:', body.participant_email)
        } catch (emailError) {
          console.error('⚠️ Failed to send invitation email:', emailError)
        }
      }

      // Schedule reminder messages (15 minutes before)
      const reminderTime = new Date(scheduledAt.getTime() - 15 * 60 * 1000) // 15 min before
      
      // Only schedule if the reminder time is in the future
      if (reminderTime > new Date()) {
        // Schedule email reminder
        if (body.participant_email) {
          try {
            await supabase.from('scheduled_messages').insert({
              message_type: 'email',
              recipient_email: body.participant_email,
              recipient_name: participantName,
              recipient_user_id: participantUserId,
              related_entity_type: 'video_session',
              related_entity_id: session.id,
              subject: `Your session with ${hostName} starts in 15 minutes!`,
              body: `<p>Hi ${participantName},</p>
                <p>Your session "<strong>${body.title}</strong>" with ${hostName} starts in 15 minutes.</p>
                <p><a href="${joinLink}" style="display:inline-block;padding:12px 24px;background:#199D67;color:white;text-decoration:none;border-radius:9999px;">Join Now</a></p>`,
              text_body: `Hi ${participantName}, Your session "${body.title}" with ${hostName} starts in 15 minutes. Join here: ${joinLink}`,
              scheduled_for: reminderTime.toISOString(),
              status: 'pending',
              created_by: user.id,
            })
            console.log('✅ Email reminder scheduled for:', reminderTime.toISOString())
          } catch (err) {
            console.error('⚠️ Failed to schedule email reminder:', err)
          }
        }

        // Schedule SMS reminder
        if (body.participant_phone) {
          try {
            await supabase.from('scheduled_messages').insert({
              message_type: 'sms',
              recipient_phone: body.participant_phone,
              recipient_name: participantName,
              recipient_user_id: participantUserId,
              related_entity_type: 'video_session',
              related_entity_id: session.id,
              body: `Hi ${participantName}! Your session with ${hostName} starts in 15 mins. Join: ${joinLink}`,
              scheduled_for: reminderTime.toISOString(),
              status: 'pending',
              created_by: user.id,
            })
            console.log('✅ SMS reminder scheduled for:', reminderTime.toISOString())
          } catch (err) {
            console.error('⚠️ Failed to schedule SMS reminder:', err)
          }
        }
      }
    }

    // --- Alignment Gym: schedule reminders (immediate notification intentionally skipped) ---
    if (sessionType === 'alignment_gym') {
      const testMode = body.test_mode ?? false
      scheduleAlignmentGymReminders(session, hostName, user.id, testMode, user.email || '').catch(err =>
        console.error('Alignment gym reminder scheduling error:', err)
      )
    }

    const response: CreateSessionResponse = {
      session: session as VideoSession,
      host_token: '',
      room_url: '',
    }

    return NextResponse.json({ ...response, created_count: sessions.length }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/video/sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Housekeeping: auto-resolve stale sessions so the list stays accurate
    const admin = createAdminClient()

    // 1) "live" sessions where started_at > 4 hours ago -> mark completed
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    const { data: staleLive } = await admin
      .from('video_sessions')
      .select('id')
      .eq('status', 'live')
      .lt('started_at', fourHoursAgo)

    if (staleLive && staleLive.length > 0) {
      await admin
        .from('video_sessions')
        .update({ status: 'completed', ended_at: fourHoursAgo })
        .in('id', staleLive.map(s => s.id))
      console.log(`[video/sessions] Auto-completed ${staleLive.length} stale live session(s)`)
    }

    // 2) "scheduled"/"waiting" sessions whose time passed > 24h ago -> mark no_show
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: staleScheduled } = await admin
      .from('video_sessions')
      .select('id')
      .in('status', ['scheduled', 'waiting'])
      .lt('scheduled_at', oneDayAgo)

    if (staleScheduled && staleScheduled.length > 0) {
      await admin
        .from('video_sessions')
        .update({ status: 'no_show' })
        .in('id', staleScheduled.map(s => s.id))
      console.log(`[video/sessions] Marked ${staleScheduled.length} stale scheduled session(s) as no_show`)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('video_sessions')
      .select(`
        *,
        participants:video_session_participants(*)
      `)
      .order('scheduled_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('session_type', type)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error in GET /api/video/sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ── Alignment Gym: segment-driven notifications ──

async function scheduleAlignmentGymReminders(
  session: Record<string, any>,
  hostName: string,
  createdByUserId: string,
  testMode: boolean,
  adminEmail: string
) {
  const admin = createAdminClient()
  const joinLink = `${OUTBOUND_URL}/alignment-gym`

  const scheduledAt = new Date(session.scheduled_at)
  const oneHourBefore = new Date(scheduledAt.getTime() - 60 * 60 * 1000)
  const fifteenMinBefore = new Date(scheduledAt.getTime() - 15 * 60 * 1000)
  const now = new Date()

  if (testMode) {
    // Test mode: send reminders directly to the creating admin only
    let adminPhone: string | null = null
    const { data: adminAccount } = await admin
      .from('user_accounts')
      .select('phone')
      .eq('id', createdByUserId)
      .single()
    if (adminAccount?.phone) adminPhone = adminAccount.phone

    const jobs: Record<string, unknown>[] = []

    if (oneHourBefore > now && adminEmail) {
      jobs.push({
        message_type: 'email',
        recipient_email: adminEmail,
        recipient_user_id: createdByUserId,
        subject: `[TEST] Alignment Gym Reminder - 1 Hour`,
        body: `[TEST MODE] Reminder: "${session.title}" starts in 1 hour.\n\nJoin: ${joinLink}\n\nThis is a test — only you received this.`,
        related_entity_type: 'video_session',
        related_entity_id: session.id,
        scheduled_for: oneHourBefore.toISOString(),
        status: 'pending',
        created_by: createdByUserId,
      })
    }

    if (fifteenMinBefore > now && adminPhone) {
      jobs.push({
        message_type: 'sms',
        recipient_phone: adminPhone,
        recipient_user_id: createdByUserId,
        body: `[TEST] "${session.title}" starts in 15 min! Join: ${joinLink}`,
        related_entity_type: 'video_session',
        related_entity_id: session.id,
        scheduled_for: fifteenMinBefore.toISOString(),
        status: 'pending',
        created_by: createdByUserId,
      })
    }

    if (jobs.length > 0) {
      const { error } = await admin.from('scheduled_messages').insert(jobs)
      if (error) console.error('[alignment-gym:test] reminder insert error:', error.message)
      else console.log(`[alignment-gym:test] Scheduled ${jobs.length} test reminder(s) to admin only`)
    }
    return
  }

  // Normal mode: notification jobs (segment resolved fresh when they fire)
  const reminderVars = {
    firstName: '',
    sessionTitle: session.title || 'Alignment Gym Session',
    hostName,
    joinLink,
  }

  const jobs: Record<string, unknown>[] = []

  if (oneHourBefore > now) {
    jobs.push({
      message_type: 'email',
      notification_config_slug: 'alignment_gym_reminder_1hr',
      notification_variables: reminderVars,
      related_entity_type: 'video_session',
      related_entity_id: session.id,
      scheduled_for: oneHourBefore.toISOString(),
      status: 'pending',
      created_by: createdByUserId,
      body: 'notification-job',
    })
  }

  if (fifteenMinBefore > now) {
    jobs.push({
      message_type: 'sms',
      notification_config_slug: 'alignment_gym_reminder_15min',
      notification_variables: reminderVars,
      related_entity_type: 'video_session',
      related_entity_id: session.id,
      scheduled_for: fifteenMinBefore.toISOString(),
      status: 'pending',
      created_by: createdByUserId,
      body: 'notification-job',
    })
  }

  if (jobs.length > 0) {
    const { error } = await admin.from('scheduled_messages').insert(jobs)
    if (error) console.error('[alignment-gym] reminder job insert error:', error.message)
    else console.log(`[alignment-gym] Scheduled ${jobs.length} notification reminder jobs`)
  }
}

