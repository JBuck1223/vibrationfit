/**
 * Guest Join Video Session API
 * 
 * POST /api/video/sessions/[id]/guest-join
 * No auth required. The session link IS the credential.
 * 
 * For 1:1 sessions, matches the existing non-host participant record.
 * For group sessions, creates a new participant record.
 * 
 * Body: { name?: string }
 * 
 * GET /api/video/sessions/[id]/guest-join
 * Returns public session info for the guest landing/pre-call page.
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

    // Find or create the participant record
    let participant = session.participants?.find(
      (p: { is_host: boolean }) => !p.is_host
    )

    if (!participant) {
      // No existing participant — create one (group/open sessions)
      const { data: newParticipant, error: insertError } = await supabaseAdmin
        .from('video_session_participants')
        .insert({
          session_id: id,
          name: guestName || 'Guest',
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

    // Update participant name if a new name was provided
    if (guestName && guestName !== participant.name) {
      await supabaseAdmin
        .from('video_session_participants')
        .update({ name: guestName })
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
      participant.user_id || participant.id,
      participantName
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

    // Get invited participant name (for 1:1 pre-fill)
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
