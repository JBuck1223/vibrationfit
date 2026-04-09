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

    // Verify user has access to this session (participant, host, or super_admin)
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
      const { data: account } = await supabase
        .from('user_accounts')
        .select('role')
        .eq('id', user.id)
        .single()
      if (account?.role !== 'super_admin') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
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

    // Batch-fetch profile pictures for all message authors
    const userIds = [...new Set((messages || []).map(m => m.user_id).filter(Boolean))]
    let profileMap: Record<string, string | null> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_accounts')
        .select('id, profile_picture_url')
        .in('id', userIds)
      if (profiles) {
        profileMap = Object.fromEntries(profiles.map(p => [p.id, p.profile_picture_url]))
      }
    }

    const enrichedMessages = (messages || []).map(m => ({
      ...m,
      profile_picture_url: m.user_id ? profileMap[m.user_id] || null : null,
    }))

    return NextResponse.json({ messages: enrichedMessages })
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

    let isHost = session?.host_user_id === user.id

    if (!participant && !isHost) {
      const { data: account } = await supabase
        .from('user_accounts')
        .select('role')
        .eq('id', user.id)
        .single()
      if (account?.role === 'super_admin') {
        isHost = true
      } else {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get sender name and profile picture
    let senderName = participant?.name
    let profilePictureUrl: string | null = null
    const { data: senderAccount } = await supabase
      .from('user_accounts')
      .select('first_name, full_name, profile_picture_url')
      .eq('id', user.id)
      .single()
    
    if (!senderName) {
      senderName = senderAccount?.full_name || senderAccount?.first_name || user.email || 'Participant'
    }
    profilePictureUrl = senderAccount?.profile_picture_url || null

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

    return NextResponse.json({ 
      message: { ...newMessage, profile_picture_url: profilePictureUrl }
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/video/sessions/[id]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
