/**
 * Guest Join Video Session API
 * 
 * POST /api/video/sessions/[id]/guest-join
 * No auth required. The session link IS the credential.
 * 
 * For 1:1 sessions, matches the existing non-host participant record.
 * For group sessions, creates a new participant record.
 * 
 * Accepts { name?, email? }. If email is provided, the participant record
 * is updated and we attempt to match to an existing user_accounts row
 * so attendance can be tracked.
 * 
 * GET /api/video/sessions/[id]/guest-join
 * Returns public session info for the guest lobby page, including the
 * invited participant's name and email for pre-fill.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createParticipantToken, ensureDailyRoom } from '@/lib/video/daily'
import type { JoinSessionResponse, VideoSession } from '@/lib/video/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const guestName = body.name || undefined
    const guestEmail = body.email?.trim()?.toLowerCase() || undefined

    // Get session with participants
    const { data: session, error: sessionError } = await supabaseAdmin
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

    if (session.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This session was cancelled' },
        { status: 400 }
      )
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'This session has already ended' },
        { status: 400 }
      )
    }

    // Try to match guest email to an existing user account
    let matchedUserId: string | null = null
    if (guestEmail) {
      const { data: account } = await supabaseAdmin
        .from('user_accounts')
        .select('id, full_name, first_name')
        .eq('email', guestEmail)
        .single()
      if (account) {
        matchedUserId = account.id
      }
    }

    // Find or create the participant record.
    // For 1:1 sessions, prefer matching by email or user_id first,
    // then fall back to the first non-host participant.
    let participant = null as any
    const nonHostParticipants = session.participants?.filter(
      (p: { is_host: boolean }) => !p.is_host
    ) || []

    if (guestEmail) {
      participant = nonHostParticipants.find(
        (p: { email?: string }) => p.email?.toLowerCase() === guestEmail
      )
    }
    if (!participant && matchedUserId) {
      participant = nonHostParticipants.find(
        (p: { user_id?: string }) => p.user_id === matchedUserId
      )
    }
    if (!participant && nonHostParticipants.length > 0) {
      participant = nonHostParticipants[0]
    }

    if (!participant) {
      // No existing participant — create one (group/open sessions)
      const { data: newParticipant, error: insertError } = await supabaseAdmin
        .from('video_session_participants')
        .insert({
          session_id: id,
          name: guestName || 'Guest',
          email: guestEmail || null,
          user_id: matchedUserId,
          is_host: false,
        })
        .select()
        .single()

      if (insertError || !newParticipant) {
        console.error('Error creating guest participant:', insertError)
        return NextResponse.json(
          { error: 'Failed to join session' },
          { status: 500 }
        )
      }

      participant = newParticipant
    }

    const participantName = guestName || participant.name || participant.email || 'Guest'

    // Update participant record with any new info from the guest
    const updates: Record<string, unknown> = {}
    if (guestName && guestName !== participant.name) updates.name = guestName
    if (guestEmail && !participant.email) updates.email = guestEmail
    if (matchedUserId && !participant.user_id) updates.user_id = matchedUserId

    if (Object.keys(updates).length > 0) {
      await supabaseAdmin
        .from('video_session_participants')
        .update(updates)
        .eq('id', participant.id)
    }

    // Ensure a Daily.co room exists (created on demand if not yet provisioned)
    const room = await ensureDailyRoom(session)
    if (room.created) {
      await supabaseAdmin
        .from('video_sessions')
        .update({ daily_room_name: room.name, daily_room_url: room.url })
        .eq('id', id)
    }

    const dailyToken = await createParticipantToken(
      room.name,
      matchedUserId || participant.user_id || participant.id,
      participantName,
      session.session_type
    )

    const response: JoinSessionResponse = {
      session: session as VideoSession,
      token: dailyToken.token,
      room_url: room.url,
      is_host: false,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in POST /api/video/sessions/[id]/guest-join:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // Get session info
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('video_sessions')
      .select('id, title, description, scheduled_at, scheduled_duration_minutes, status, session_type')
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This session has been cancelled' },
        { status: 410 }
      )
    }

    // Get host name
    const { data: host } = await supabaseAdmin
      .from('video_session_participants')
      .select('name')
      .eq('session_id', id)
      .eq('is_host', true)
      .single()

    // Get invited participant (for pre-fill in lobby)
    const { data: participant } = await supabaseAdmin
      .from('video_session_participants')
      .select('name, email')
      .eq('session_id', id)
      .eq('is_host', false)
      .limit(1)
      .single()

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        scheduled_at: session.scheduled_at,
        scheduled_duration_minutes: session.scheduled_duration_minutes,
        status: session.status,
        session_type: session.session_type,
        host_name: host?.name || 'Your Host',
      },
      participant: participant ? {
        name: participant.name,
        email: participant.email,
      } : null,
    })
  } catch (error) {
    console.error('Error in GET /api/video/sessions/[id]/guest-join:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
