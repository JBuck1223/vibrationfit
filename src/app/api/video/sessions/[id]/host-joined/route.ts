/**
 * Host Joined Notification API
 *
 * POST /api/video/sessions/[id]/host-joined
 *
 * Triggered when the host joins the video session.
 * - For alignment_gym sessions: broadcasts "going live" to ALL opted-in members
 * - For other sessions: notifies registered participants only
 * Template and channel toggles driven by notification_configs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OUTBOUND_URL } from '@/lib/urls'
import { sendNotification, sendBulkNotification, getNotificationConfig, resolveNotificationRecipients } from '@/lib/notifications/config'

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

    const results = {
      emailsSent: 0,
      smsSent: 0,
      errors: [] as string[],
    }

    // --- Alignment Gym: broadcast "going live" ---
    if (session.session_type === 'alignment_gym') {
      if (session.test_mode) {
        // Test mode: send going-live only to the host/admin
        const liveResults = await broadcastAlignmentGymLiveTestMode(
          sessionId,
          session.title || 'Alignment Gym',
          hostName,
          user.id,
          user.email || '',
          OUTBOUND_URL
        )
        results.emailsSent += liveResults.emailsSent
        results.smsSent += liveResults.smsSent
        results.errors.push(...liveResults.errors)
      } else {
        const liveResults = await broadcastAlignmentGymLive(
          sessionId,
          session.title || 'Alignment Gym',
          hostName,
          OUTBOUND_URL
        )
        results.emailsSent += liveResults.emailsSent
        results.smsSent += liveResults.smsSent
        results.errors.push(...liveResults.errors)
      }
    } else {
      // --- Other sessions: notify registered participants only ---
      const config = await getNotificationConfig('host_joined_session')
      if (!config) {
        console.warn('[host-joined] No notification config found, skipping participant notifications')
      }

      const participants = session.participants?.filter((p: any) => !p.is_host) || []

      for (const participant of participants) {
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
          ? `${OUTBOUND_URL}/session/${sessionId}?email=${encodeURIComponent(email)}`
          : `${OUTBOUND_URL}/session/${sessionId}`

        if (!config) continue

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

async function broadcastAlignmentGymLive(
  sessionId: string,
  sessionTitle: string,
  hostName: string,
  baseUrl: string
): Promise<{ emailsSent: number; smsSent: number; errors: string[] }> {
  const joinLink = `${baseUrl}/alignment-gym`

  const config = await getNotificationConfig('alignment_gym_going_live')
  if (!config) {
    console.warn('[host-joined:alignment-gym] No alignment_gym_going_live config')
    return { emailsSent: 0, smsSent: 0, errors: ['No alignment_gym_going_live config found'] }
  }

  try {
    // Audience resolved dynamically from the config's linked segment
    await sendBulkNotification({
      slug: 'alignment_gym_going_live',
      variables: { hostName, sessionTitle, joinLink },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bulk notification failed'
    console.error('[host-joined:alignment-gym] Broadcast error:', msg)
    return { emailsSent: 0, smsSent: 0, errors: [msg] }
  }

  // Estimate counts from resolved recipients for the response
  const recipients = await resolveNotificationRecipients('alignment_gym_going_live')
  const emailCount = recipients.filter(r => r.email).length
  const smsCount = recipients.filter(r => r.phone).length

  console.log(`[host-joined:alignment-gym] Broadcast sent: ~${emailCount} emails, ~${smsCount} SMS`)
  return { emailsSent: emailCount, smsSent: smsCount, errors: [] }
}

async function broadcastAlignmentGymLiveTestMode(
  sessionId: string,
  sessionTitle: string,
  hostName: string,
  adminUserId: string,
  adminEmail: string,
  baseUrl: string
): Promise<{ emailsSent: number; smsSent: number; errors: string[] }> {
  const joinLink = `${baseUrl}/alignment-gym`

  try {
    await sendBulkNotification({
      slug: 'alignment_gym_going_live',
      variables: { hostName, sessionTitle, joinLink },
      recipients: [{ email: adminEmail, userId: adminUserId }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Test broadcast failed'
    console.error('[host-joined:alignment-gym:test] Broadcast error:', msg)
    return { emailsSent: 0, smsSent: 0, errors: [msg] }
  }

  console.log(`[host-joined:alignment-gym:test] Going-live sent to admin only (${adminEmail})`)
  return { emailsSent: adminEmail ? 1 : 0, smsSent: 0, errors: [] }
}
