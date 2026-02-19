/**
 * Video Session Detail API
 * 
 * GET /api/video/sessions/[id] - Get session details
 * PATCH /api/video/sessions/[id] - Update session
 * DELETE /api/video/sessions/[id] - Cancel/delete session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteRoom } from '@/lib/video/daily'
import type { UpdateSessionRequest, VideoSession } from '@/lib/video/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

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
    const { data: session, error } = await supabase
      .from('video_sessions')
      .select(`
        *,
        participants:video_session_participants(*)
      `)
      .eq('id', id)
      .single()

    if (error || !session) {
      console.error('Error fetching session:', error?.message, 'id:', id)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check access - must be host, participant, admin, or alignment_gym (open to all)
    const isHost = session.host_user_id === user.id
    const isParticipant = session.participants?.some(
      (p: { user_id: string }) => p.user_id === user.id
    )
    const isOpenSession = session.session_type === 'alignment_gym'

    let isAdmin = false
    if (!isHost && !isParticipant && !isOpenSession) {
      const { data: account } = await supabase
        .from('user_accounts')
        .select('role')
        .eq('id', user.id)
        .single()
      isAdmin = account?.role === 'super_admin'
    }

    if (!isHost && !isParticipant && !isOpenSession && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({ session, is_host: isHost })
  } catch (error) {
    console.error('Error in GET /api/video/sessions/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    // Get session to verify ownership
    const { data: existingSession, error: fetchError } = await supabase
      .from('video_sessions')
      .select('host_user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (existingSession.host_user_id !== user.id) {
      const { data: account } = await supabase
        .from('user_accounts')
        .select('role')
        .eq('id', user.id)
        .single()
      if (account?.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Only the host can update this session' },
          { status: 403 }
        )
      }
    }

    const body: UpdateSessionRequest = await request.json()

    // Build update object
    const updates: Partial<VideoSession> = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.scheduled_at !== undefined) updates.scheduled_at = body.scheduled_at
    if (body.scheduled_duration_minutes !== undefined) {
      updates.scheduled_duration_minutes = body.scheduled_duration_minutes
    }
    if (body.status !== undefined) updates.status = body.status
    if (body.ended_at !== undefined) updates.ended_at = body.ended_at
    if (body.actual_duration_seconds !== undefined) updates.actual_duration_seconds = body.actual_duration_seconds
    if (body.host_notes !== undefined) updates.host_notes = body.host_notes
    if (body.session_summary !== undefined) updates.session_summary = body.session_summary

    // Update session
    const { data: session, error: updateError } = await supabase
      .from('video_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating session:', updateError)
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error in PATCH /api/video/sessions/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Get session to verify ownership and get room name
    const { data: session, error: fetchError } = await supabase
      .from('video_sessions')
      .select('host_user_id, daily_room_name, status')
      .eq('id', id)
      .single()

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (session.host_user_id !== user.id) {
      const { data: account } = await supabase
        .from('user_accounts')
        .select('role')
        .eq('id', user.id)
        .single()
      if (account?.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Only the host can delete this session' },
          { status: 403 }
        )
      }
    }

    // Can't delete live sessions
    if (session.status === 'live') {
      return NextResponse.json(
        { error: 'Cannot delete a live session' },
        { status: 400 }
      )
    }

    // Delete Daily.co room
    try {
      await deleteRoom(session.daily_room_name)
    } catch (dailyError) {
      console.warn('Failed to delete Daily.co room:', dailyError)
      // Continue anyway - the room might have already expired
    }

    // Delete session (cascades to participants, messages, recordings)
    const { error: deleteError } = await supabase
      .from('video_sessions')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting session:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Error in DELETE /api/video/sessions/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

