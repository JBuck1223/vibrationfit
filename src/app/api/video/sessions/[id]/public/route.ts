/**
 * Public Session Info API
 * 
 * GET /api/video/sessions/[id]/public - Get basic session info (no auth required)
 * 
 * Returns limited info for the join page landing when user isn't logged in.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Use service role to bypass RLS for public session lookup
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // Get basic session info (limited fields for security)
    const { data: session, error } = await supabaseAdmin
      .from('video_sessions')
      .select(`
        id,
        title,
        description,
        scheduled_at,
        scheduled_duration_minutes,
        status,
        session_type
      `)
      .eq('id', id)
      .single()

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Don't expose cancelled sessions
    if (session.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This session has been cancelled' },
        { status: 410 }
      )
    }

    // Get host name (but not ID for privacy)
    const { data: hostParticipant } = await supabaseAdmin
      .from('video_session_participants')
      .select('name')
      .eq('session_id', id)
      .eq('is_host', true)
      .single()

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        scheduled_at: session.scheduled_at,
        scheduled_duration_minutes: session.scheduled_duration_minutes,
        status: session.status,
        session_type: session.session_type,
        host_name: hostParticipant?.name || 'Your Host',
      }
    })
  } catch (error) {
    console.error('Error in GET /api/video/sessions/[id]/public:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

