/**
 * Participant Stats API
 *
 * POST /api/video/sessions/[id]/participant-stats - Update participant join/leave stats
 *
 * Used by VideoCall component to track attendance analytics:
 * - When participant joins: set joined_at, attended = true
 * - When participant leaves: set left_at, calculate duration_seconds
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { autoVerifyOccurrenceByActivityType } from '@/lib/map/auto-verify'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, camera_on_percent, mic_on_percent } = body

    if (!action || !['join', 'leave'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "join" or "leave"' },
        { status: 400 },
      )
    }

    const { data: participant, error: findError } = await supabase
      .from('video_session_participants')
      .select('id, joined_at')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (findError || !participant) {
      const { data: session } = await supabase
        .from('video_sessions')
        .select('host_user_id')
        .eq('id', sessionId)
        .single()

      if (session?.host_user_id === user.id) {
        const { data: hostParticipant } = await supabase
          .from('video_session_participants')
          .select('id, joined_at')
          .eq('session_id', sessionId)
          .eq('is_host', true)
          .single()

        if (!hostParticipant) {
          return NextResponse.json(
            { error: 'Participant record not found' },
            { status: 404 },
          )
        }

        return await updateParticipantStats(
          supabase,
          hostParticipant.id,
          hostParticipant.joined_at,
          action,
          user.id,
          sessionId,
          camera_on_percent,
          mic_on_percent,
        )
      }

      return NextResponse.json(
        { error: 'Participant record not found' },
        { status: 404 },
      )
    }

    return await updateParticipantStats(
      supabase,
      participant.id,
      participant.joined_at,
      action,
      user.id,
      sessionId,
      camera_on_percent,
      mic_on_percent,
    )
  } catch (error) {
    console.error('Error in POST /api/video/sessions/[id]/participant-stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateParticipantStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  participantId: string,
  existingJoinedAt: string | null,
  action: string,
  userId: string,
  sessionId: string,
  camera_on_percent?: number,
  mic_on_percent?: number,
) {
  const now = new Date().toISOString()

  if (action === 'join') {
    const { error: updateError } = await supabase
      .from('video_session_participants')
      .update({
        joined_at: now,
        attended: true,
        updated_at: now,
      })
      .eq('id', participantId)

    if (updateError) {
      console.error('Error updating participant join stats:', updateError)
      return NextResponse.json(
        { error: 'Failed to update participant stats' },
        { status: 500 },
      )
    }

    const { data: session } = await supabase
      .from('video_sessions')
      .select('session_type, title')
      .eq('id', sessionId)
      .single()

    const isAlignmentGym =
      session?.session_type === 'alignment_gym' ||
      (session?.title?.toLowerCase().includes('alignment gym') ?? false)

    if (isAlignmentGym) {
      const joinedDate = now.split('T')[0]
      autoVerifyOccurrenceByActivityType(userId, 'alignment_gym', joinedDate).catch(
        () => {},
      )
    }

    return NextResponse.json({
      success: true,
      action: 'join',
      joined_at: now,
    })
  }

  if (action === 'leave') {
    let durationSeconds: number | null = null
    if (existingJoinedAt) {
      const joinedAt = new Date(existingJoinedAt)
      const leftAt = new Date(now)
      durationSeconds = Math.round((leftAt.getTime() - joinedAt.getTime()) / 1000)
    }

    const updateData: Record<string, unknown> = {
      left_at: now,
      updated_at: now,
    }

    if (durationSeconds !== null) {
      updateData.duration_seconds = durationSeconds
    }

    if (typeof camera_on_percent === 'number') {
      updateData.camera_on_percent = camera_on_percent
    }
    if (typeof mic_on_percent === 'number') {
      updateData.mic_on_percent = mic_on_percent
    }

    const { error: updateError } = await supabase
      .from('video_session_participants')
      .update(updateData)
      .eq('id', participantId)

    if (updateError) {
      console.error('Error updating participant leave stats:', updateError)
      return NextResponse.json(
        { error: 'Failed to update participant stats' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      action: 'leave',
      left_at: now,
      duration_seconds: durationSeconds,
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
