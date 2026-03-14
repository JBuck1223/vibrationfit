/**
 * Host Joined Notification API
 *
 * POST /api/video/sessions/[id]/host-joined
 *
 * Triggered when the host joins the video session.
 * Sends notification to participants that the session is starting.
 * Template and channel toggles driven by notification_configs (slug: host_joined_session).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNotification, getNotificationConfig } from '@/lib/notifications/config'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await context.params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: session, error: sessionError } = await supabase
      .from('video_sessions')
      .select(`
        *,
        participants:video_session_participants(*)
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.host_user_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can trigger this notification' }, { status: 403 })
    }

    // Mark session as LIVE
    await supabase
      .from('video_sessions')
      .update({
        status: 'live',
        started_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    const { data: hostAccount } = await supabase
      .from('user_accounts')
      .select('first_name, last_name, full_name')
      .eq('id', user.id)
      .single()

    const hostName = hostAccount?.full_name || hostAccount?.first_name || 'Your host'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'

    // Check if notifications are configured before looping
    const config = await getNotificationConfig('host_joined_session')
    if (!config) {
      console.warn('[host-joined] No notification config found, skipping participant notifications')
    }

    const participants = session.participants?.filter((p: any) => !p.is_host) || []

    const results = {
      emailsSent: 0,
      smsSent: 0,
      errors: [] as string[],
    }

    for (const participant of participants) {
      const joinLink = participant.email
        ? `${baseUrl}/session/${sessionId}?email=${encodeURIComponent(participant.email)}`
        : `${baseUrl}/session/${sessionId}`

      if (!config) continue

      try {
        await sendNotification({
          slug: 'host_joined_session',
          variables: {
            hostName,
            participantName: participant.name || 'there',
            sessionTitle: session.title || 'Your Session',
            joinLink,
          },
          recipientEmail: participant.email || undefined,
          recipientPhone: participant.phone || undefined,
          userId: participant.user_id || undefined,
        })

        if (participant.email && config.email_enabled) results.emailsSent++
        if (participant.phone && config.sms_enabled) results.smsSent++
      } catch (err) {
        const error = `Participant ${participant.email || participant.phone}: ${err instanceof Error ? err.message : 'Failed'}`
        results.errors.push(error)
        console.error(`[host-joined] ${error}`)
      }
    }

    // Cancel any pending reminder messages for this session
    await supabase
      .from('scheduled_messages')
      .update({ status: 'cancelled' })
      .eq('related_entity_type', 'video_session')
      .eq('related_entity_id', sessionId)
      .eq('status', 'pending')

    return NextResponse.json({
      message: 'Host joined notifications sent',
      ...results,
    })
  } catch (error) {
    console.error('Error in host-joined notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
