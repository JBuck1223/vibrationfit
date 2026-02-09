/**
 * Chat Highlight API
 * 
 * POST /api/video/sessions/[id]/highlight - Set or clear the highlighted message
 * GET /api/video/sessions/[id]/highlight - Get the current highlighted message
 * 
 * Host-only: Allows pinning a chat message so it displays prominently to all viewers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session with highlighted message
    const { data: session, error } = await supabase
      .from('video_sessions')
      .select('highlighted_message_id')
      .eq('id', sessionId)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (!session.highlighted_message_id) {
      return NextResponse.json({ highlighted_message: null })
    }

    // Fetch the actual message
    const { data: message } = await supabase
      .from('video_session_messages')
      .select('*')
      .eq('id', session.highlighted_message_id)
      .single()

    return NextResponse.json({ highlighted_message: message || null })
  } catch (error) {
    console.error('Error in GET /api/video/sessions/[id]/highlight:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is the host
    const { data: session } = await supabase
      .from('video_sessions')
      .select('host_user_id')
      .eq('id', sessionId)
      .single()

    if (!session || session.host_user_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can highlight messages' }, { status: 403 })
    }

    const body = await request.json()
    const { message_id } = body // null to clear

    // If setting a message, verify it belongs to this session
    if (message_id) {
      const { data: message } = await supabase
        .from('video_session_messages')
        .select('id, session_id')
        .eq('id', message_id)
        .eq('session_id', sessionId)
        .single()

      if (!message) {
        return NextResponse.json({ error: 'Message not found in this session' }, { status: 404 })
      }
    }

    // Update the session's highlighted message
    const { error: updateError } = await supabase
      .from('video_sessions')
      .update({ highlighted_message_id: message_id || null })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating highlight:', updateError)
      return NextResponse.json({ error: 'Failed to update highlight' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      highlighted_message_id: message_id || null 
    })
  } catch (error) {
    console.error('Error in POST /api/video/sessions/[id]/highlight:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
