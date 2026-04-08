import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/video/sessions/[id]/notes
 * Get the current user's private notes for a session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: note } = await supabase
      .from('session_notes')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({ note: note || null })
  } catch (error: any) {
    console.error('SESSION NOTES GET ERROR:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch notes' }, { status: 500 })
  }
}

/**
 * PUT /api/video/sessions/[id]/notes
 * Create or update the current user's private notes for a session (upsert)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content must be a string' }, { status: 400 })
    }

    const { data: note, error } = await supabase
      .from('session_notes')
      .upsert(
        { session_id: sessionId, user_id: user.id, content },
        { onConflict: 'session_id,user_id' }
      )
      .select('*')
      .single()

    if (error) {
      console.error('Error upserting note:', error)
      return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
    }

    return NextResponse.json({ success: true, note })
  } catch (error: any) {
    console.error('SESSION NOTES PUT ERROR:', error)
    return NextResponse.json({ error: error.message || 'Failed to save note' }, { status: 500 })
  }
}
