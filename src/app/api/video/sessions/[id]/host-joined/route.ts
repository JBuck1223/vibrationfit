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

    // Allow actual host or super_admin to trigger
    let canTrigger = session.host_user_id === user.id
    if (!canTrigger) {
      const { data: account } = await supabase
        .from('user_accounts')
        .select('role')
        .eq('id', user.id)
        .single()
      canTrigger = account?.role === 'super_admin'
    }
    if (!canTrigger) {
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
      // Resolve contact info: participant row may be sparse, so fall back to user_accounts
      let email = participant.email as string | null
      let phone = participant.phone as string | null
      let name = participant.name || 'there'

      if (participant.user_id && (!email || !phone)) {
        const { data: account } = await supabase
          .from('user_accounts')
          .select('email, phone, first_name, full_name')
          .eq('id', participant.user_id)
          .single()
        if (account) {
          if (!email) email = account.email || null
          if (!phone) phone = account.phone || null
          if (name === 'there') name = account.full_name || account.first_name || name
        }
      }

      const joinLink = email
        ? `${baseUrl}/session/${sessionId}?email=${encodeURIComponent(email)}`
        : `${baseUrl}/session/${sessionId}`

      if (!config) continue

      console.log(`[host-joined] Notifying participant: email=${email}, phone=${phone}, name=${name}`)

      try {
        await sendNotification({
          slug: 'host_joined_session',
          variables: {
            hostName,
            participantName: name,
            sessionTitle: session.title || 'Your Session',
            joinLink,
          },
          recipientEmail: email || undefined,
          recipientPhone: phone || undefined,
          userId: participant.user_id || undefined,
        })

        if (email && config.email_enabled) results.emailsSent++
        if (phone && config.sms_enabled) results.smsSent++
      } catch (err) {
        const error = `Participant ${email || phone}: ${err instanceof Error ? err.message : 'Failed'}`
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
