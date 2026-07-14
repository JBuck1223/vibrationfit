import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAlignmentGymDirectorySession } from '@/lib/video/alignment-gym-directory'
import {
  ALIGNMENT_GYM_GRADUATION_REQUIRED_MESSAGE,
  isAlignmentGymSessionsLocked,
} from '@/lib/intensive/alignment-gym-access'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: sessionId } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (await isAlignmentGymSessionsLocked(supabase, user.id)) {
      return NextResponse.json(
        { error: ALIGNMENT_GYM_GRADUATION_REQUIRED_MESSAGE },
        { status: 403 },
      )
    }

    const admin = createAdminClient()

    const { data: session, error: sessionError } = await admin
      .from('video_sessions')
      .select('id, status, session_type, title')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (!isAlignmentGymDirectorySession(session)) {
      return NextResponse.json(
        { error: 'Only Alignment Gym sessions support replay tracking' },
        { status: 400 }
      )
    }

    if (session.status !== 'completed') {
      return NextResponse.json(
        { error: 'Session is not completed yet' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const { data: existing } = await admin
      .from('video_session_participants')
      .select('id, replay_viewed_at')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      if (!existing.replay_viewed_at) {
        const { error: updateError } = await admin
          .from('video_session_participants')
          .update({ replay_viewed_at: now })
          .eq('id', existing.id)
        if (updateError) {
          console.error('Error updating replay_viewed_at:', updateError)
          return NextResponse.json(
            { error: 'Failed to record replay view' },
            { status: 500 }
          )
        }
      }
    } else {
      const { error: insertError } = await admin
        .from('video_session_participants')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          replay_viewed_at: now,
        })
      if (insertError) {
        console.error('Error inserting replay view participant:', insertError)
        return NextResponse.json(
          { error: 'Failed to record replay view' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in POST replay-viewed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
