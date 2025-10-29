import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch user's conversation sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all conversation sessions for user, ordered by most recent
    const { data: sessions, error } = await supabase
      .from('conversation_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error: any) {
    console.error('Error in GET /api/viva/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new conversation session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, mode = 'master', preview_message } = body

    // Create new conversation session
    const { data: session, error } = await supabase
      .from('conversation_sessions')
      .insert({
        user_id: user.id,
        title: title || `Conversation ${new Date().toLocaleDateString()}`,
        mode,
        preview_message: preview_message || '',
        message_count: 0,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    return NextResponse.json({ session })
  } catch (error: any) {
    console.error('Error in POST /api/viva/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a conversation session and all its messages
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('id')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    // Delete all messages in the conversation first (CASCADE should handle this, but being explicit)
    const { error: messagesError } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)

    if (messagesError) {
      console.error('Error deleting messages:', messagesError)
    }

    // Delete the conversation session
    const { error } = await supabase
      .from('conversation_sessions')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting conversation:', error)
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/viva/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

