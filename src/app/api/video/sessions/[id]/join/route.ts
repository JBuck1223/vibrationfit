/**
 * Join Video Session API
 * 
 * POST /api/video/sessions/[id]/join - Get a token to join the session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHostToken, createParticipantToken } from '@/lib/video/daily'
import type { JoinSessionResponse, VideoSession } from '@/lib/video/types'

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
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if user is authorized to join
    const isHost = session.host_user_id === user.id
    const participant = session.participants?.find(
      (p: { user_id?: string; email?: string }) => 
        p.user_id === user.id || p.email === user.email
    )

    if (!isHost && !participant) {
      return NextResponse.json(
        { error: 'You are not invited to this session' },
        { status: 403 }
      )
    }

    // Check session status (no strict time checks - hosts can start anytime)
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

    // Get user profile for display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const userName = profile?.full_name || user.email || 'Participant'

    // Create appropriate token
    let token
    if (isHost) {
      token = await createHostToken(session.daily_room_name, user.id, userName)
    } else {
      token = await createParticipantToken(session.daily_room_name, user.id, userName)
    }

    // Update participant record with user_id if they were invited by email
    if (participant && !participant.user_id) {
      await supabase
        .from('video_session_participants')
        .update({ user_id: user.id })
        .eq('id', participant.id)
    }

    const response: JoinSessionResponse = {
      session: session as VideoSession,
      token: token.token,
      room_url: session.daily_room_url,
      is_host: isHost,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in POST /api/video/sessions/[id]/join:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

