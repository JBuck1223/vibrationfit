/**
 * Video Sessions API
 * 
 * POST /api/video/sessions - Create a new session
 * GET /api/video/sessions - List user's sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOneOnOneRoom, createGroupRoom, createAlignmentGymRoom, createWebinarRoom, createHostToken, getRoomUrl } from '@/lib/video/daily'
import { sendEmail } from '@/lib/email/aws-ses'
import { generateSessionInvitationEmail } from '@/lib/email/templates'
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

    // Create Daily.co room based on session type
    let dailyRoom
    let maxParticipants = 2
    try {
      if (sessionType === 'one_on_one') {
        dailyRoom = await createOneOnOneRoom(scheduledAt, durationMinutes)
        maxParticipants = 2
      } else if (sessionType === 'group' || sessionType === 'workshop') {
        dailyRoom = await createGroupRoom(scheduledAt, 25, durationMinutes)
        maxParticipants = 25
      } else if (sessionType === 'alignment_gym') {
        dailyRoom = await createAlignmentGymRoom(scheduledAt, durationMinutes)
        maxParticipants = 0  // Unlimited — stored as 0 in DB
      } else if (sessionType === 'webinar') {
        dailyRoom = await createWebinarRoom(scheduledAt, durationMinutes)
        maxParticipants = 0  // Unlimited — stored as 0 in DB
      } else {
        dailyRoom = await createOneOnOneRoom(scheduledAt, durationMinutes)
        maxParticipants = 2
      }
    } catch (dailyError) {
      console.error('Daily.co API error:', dailyError)
      return NextResponse.json(
        { error: `Daily.co error: ${dailyError instanceof Error ? dailyError.message : 'Failed to create room'}` },
        { status: 500 }
      )
    }

    // Get user account for display name
    const { data: account } = await supabase
      .from('user_accounts')
      .select('first_name, last_name, full_name')
      .eq('id', user.id)
      .single()

    const hostName = account?.full_name || account?.first_name || user.email || 'Host'

    // Create host token
    const hostToken = await createHostToken(dailyRoom.name, user.id, hostName)

    // Create session in database
    const { data: session, error: sessionError } = await supabase
      .from('video_sessions')
      .insert({
        daily_room_name: dailyRoom.name,
        daily_room_url: dailyRoom.url,
        title: body.title,
        description: body.description,
        session_type: sessionType,
        status: 'scheduled',
        scheduled_at: body.scheduled_at,
        scheduled_duration_minutes: durationMinutes,
        host_user_id: user.id,
        enable_recording: body.enable_recording ?? true,
        enable_waiting_room: false,
        max_participants: maxParticipants,
        is_group_session: sessionType !== 'one_on_one',
        // Dynamic scheduling fields
        staff_id: body.staff_id || null,
        event_type: body.event_type || null,
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session in database:', sessionError)
      return NextResponse.json(
        { error: `Database error: ${sessionError.message}` },
        { status: 500 }
      )
    }

    // Add host as participant
    await supabase.from('video_session_participants').insert({
      session_id: session.id,
      user_id: user.id,
      name: hostName,
      is_host: true,
    })

    // Add invited participant if provided
    if (body.participant_email || body.participant_name) {
      // Check if user exists
      let existingUser = null
      if (body.participant_email) {
        const { data: foundUser } = await supabase
          .from('user_accounts')
          .select('id, first_name, last_name, full_name')
          .eq('email', body.participant_email)
          .single()
        existingUser = foundUser
      }

      const participantName = body.participant_name || existingUser?.full_name || body.participant_email || 'Guest'

      await supabase.from('video_session_participants').insert({
        session_id: session.id,
        user_id: existingUser?.id || null,
        email: body.participant_email || null,
        phone: body.participant_phone || null,
        name: participantName,
        is_host: false,
      })

      // Build join link
      const joinLink = body.participant_email
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'}/session/${session.id}?email=${encodeURIComponent(body.participant_email)}`
        : `${process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'}/session/${session.id}`

      // Send immediate invitation email
      if (body.participant_email) {
        try {
          const emailData = await generateSessionInvitationEmail({
            participantName,
            participantEmail: body.participant_email,
            hostName,
            sessionTitle: body.title,
            sessionDescription: body.description,
            scheduledDate: scheduledAt.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            scheduledTime: scheduledAt.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short',
            }),
            durationMinutes,
            joinLink,
          })

          await sendEmail({
            to: body.participant_email,
            subject: emailData.subject,
            htmlBody: emailData.htmlBody,
            textBody: emailData.textBody,
          })

          console.log('✅ Session invitation email sent to:', body.participant_email)
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
              recipient_user_id: existingUser?.id || null,
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
              recipient_user_id: existingUser?.id || null,
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

    const response: CreateSessionResponse = {
      session: session as VideoSession,
      host_token: hostToken.token,
      room_url: dailyRoom.url,
    }

    return NextResponse.json(response, { status: 201 })
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query - RLS policies handle access control
    // We fetch sessions where user is host, then separately check for participant sessions
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

