import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/video/sessions/[id]/participants
 * Host-only: add a member to the session by user_id so they can join via the link.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: session, error: sessionError } = await supabase
      .from('video_sessions')
      .select('id, host_user_id')
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    let isHost = session.host_user_id === user.id
    if (!isHost) {
      const { data: account } = await supabase
        .from('user_accounts')
        .select('role')
        .eq('id', user.id)
        .single()
      if (account?.role === 'super_admin') isHost = true
    }

    if (!isHost) {
      return NextResponse.json({ error: 'Only the host can add participants' }, { status: 403 })
    }

    const { userId: targetUserId } = await request.json()
    if (!targetUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('video_session_participants')
      .select('id')
      .eq('session_id', id)
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already a participant' }, { status: 409 })
    }

    const { data: account } = await admin
      .from('user_accounts')
      .select('full_name, first_name, email')
      .eq('id', targetUserId)
      .single()

    const name = account?.full_name || account?.first_name || account?.email || 'Member'

    const { data: participant, error: insertError } = await admin
      .from('video_session_participants')
      .insert({
        session_id: id,
        user_id: targetUserId,
        name,
        is_host: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[participants] Insert error:', insertError.message)
      return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 })
    }

    return NextResponse.json({ participant })
  } catch (error) {
    console.error('Error in POST /api/video/sessions/[id]/participants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
