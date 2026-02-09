/**
 * Recording Status API
 * 
 * POST /api/video/sessions/[id]/recording-status
 * 
 * Updates the recording_status field on a video session.
 * Called from the VideoCall component when recording starts/stops.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await context.params
    const supabase = await createClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()

    // Validate status
    const validStatuses = ['none', 'recording', 'processing', 'ready', 'uploaded', 'failed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Verify user is the host
    const { data: session } = await supabase
      .from('video_sessions')
      .select('host_user_id')
      .eq('id', sessionId)
      .single()

    if (!session || session.host_user_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can update recording status' }, { status: 403 })
    }

    // Update status
    const { error: updateError } = await supabase
      .from('video_sessions')
      .update({ recording_status: status })
      .eq('id', sessionId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Error updating recording status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
