/**
 * Video Session Messages API
 * 
 * GET /api/video/sessions/[id]/messages - Fetch chat messages for a session
 * POST /api/video/sessions/[id]/messages - Send a new chat message
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
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this session (participant or host)
    const { data: participant } = await supabase
      .from('video_session_participants')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single()

    const { data: session } = await supabase
      .from('video_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('host_user_id', user.id)
      .single()

    if (!participant && !session) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse query params for pagination
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const before = searchParams.get('before') // For loading older messages

    // Fetch messages
    let query = supabase
      .from('video_session_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('sent_at', { ascending: true })
      .limit(limit)

    if (before) {
      query = query.lt('sent_at', before)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error in GET /api/video/sessions/[id]/messages:', error)
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
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, message_type = 'chat' } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Verify user has access to this session
    const { data: participant } = await supabase
      .from('video_session_participants')
      .select('id, name')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single()

    const { data: session } = await supabase
      .from('video_sessions')
      .select('id, host_user_id')
      .eq('id', sessionId)
      .single()

    const isHost = session?.host_user_id === user.id

    if (!participant && !isHost) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get sender name
    let senderName = participant?.name
    if (!senderName) {
      const { data: account } = await supabase
        .from('user_accounts')
        .select('first_name, full_name')
        .eq('id', user.id)
        .single()
      senderName = account?.full_name || account?.first_name || user.email || 'Participant'
    }

    // Insert message
    const { data: newMessage, error: insertError } = await supabase
      .from('video_session_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        sender_name: senderName,
        message: message.trim(),
        message_type,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting message:', insertError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/video/sessions/[id]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
