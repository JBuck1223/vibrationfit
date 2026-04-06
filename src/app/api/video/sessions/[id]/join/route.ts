/**
 * Join Video Session API
 * 
 * POST /api/video/sessions/[id]/join - Get a token to join the session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHostToken, createParticipantToken, ensureDailyRoom } from '@/lib/video/daily'
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
    let isHost = session.host_user_id === user.id
    let participant = session.participants?.find(
      (p: { user_id?: string; email?: string }) => 
        p.user_id === user.id || p.email === user.email
    )

    // Super admins can join any session as host
    if (!isHost && !participant) {
      const { data: account } = await supabase
        .from('user_accounts')
        .select('role')
        .eq('id', user.id)
        .single()

      if (account?.role === 'super_admin') {
        isHost = true
      }
    }

    // Alignment Gym sessions are open to all authenticated users.
    // Use admin client to bypass RLS — the RLS-bound client silently
    // drops insert errors, causing participants to get a 403 instead.
    if (!isHost && !participant && session.session_type === 'alignment_gym') {
      const { data: acct } = await supabase
        .from('user_accounts')
        .select('first_name, full_name')
        .eq('id', user.id)
        .single()

      const name = acct?.full_name || acct?.first_name || user.email || 'Member'

      const admin = createAdminClient()
      const { data: newParticipant, error: insertErr } = await admin
        .from('video_session_participants')
        .insert({
          session_id: id,
          user_id: user.id,
          name,
          is_host: false,
        })
        .select()
        .single()

      if (insertErr) {
        console.error('[join] Failed to auto-enroll alignment_gym participant:', insertErr.message)
      }

      participant = newParticipant
    }

    if (!isHost && !participant) {
      return NextResponse.json(
        { error: 'You are not invited to this session' },
        { status: 403 }
      )
    }

    // Check session status
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

    // Get user account for display name
    const { data: account } = await supabase
      .from('user_accounts')
      .select('first_name, last_name, full_name')
      .eq('id', user.id)
      .single()

    const userName = account?.full_name || account?.first_name || user.email || 'Participant'

    // Ensure a Daily.co room exists (created on demand if not yet provisioned)
    const room = await ensureDailyRoom(session)
    if (room.created) {
      const admin = createAdminClient()
      await admin
        .from('video_sessions')
        .update({ daily_room_name: room.name, daily_room_url: room.url })
        .eq('id', id)
    }

    // Create appropriate token
    let token
    if (isHost) {
      token = await createHostToken(room.name, user.id, userName, session.session_type)
    } else {
      token = await createParticipantToken(room.name, user.id, userName)
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
      room_url: room.url,
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

