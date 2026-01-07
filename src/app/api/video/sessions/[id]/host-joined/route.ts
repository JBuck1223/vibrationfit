/**
 * Host Joined Notification API
 * 
 * POST /api/video/sessions/[id]/host-joined
 * 
 * Triggered when the host joins the video session.
 * Sends notification to participants that the session is starting.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/aws-ses'
import { sendSMS } from '@/lib/messaging/twilio'

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

    // Get session details
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

    // Verify user is the host
    if (session.host_user_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can trigger this notification' }, { status: 403 })
    }

    // Get host info
    const { data: hostAccount } = await supabase
      .from('user_accounts')
      .select('first_name, last_name, full_name')
      .eq('id', user.id)
      .single()

    const hostName = hostAccount?.full_name || hostAccount?.first_name || 'Your host'

    // Build join link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'
    
    // Find participants who are not the host
    const participants = session.participants?.filter((p: any) => !p.is_host) || []
    
    const results = {
      emailsSent: 0,
      smsSent: 0,
      errors: [] as string[]
    }

    for (const participant of participants) {
      const joinLink = participant.email
        ? `${baseUrl}/session/${sessionId}?email=${encodeURIComponent(participant.email)}`
        : `${baseUrl}/session/${sessionId}`

      // Send email notification
      if (participant.email) {
        try {
          await sendEmail({
            to: participant.email,
            subject: `${hostName} is in the room - Join now!`,
            htmlBody: `
              <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #199D67;">Your Session is Starting!</h2>
                <p>Hi ${participant.name || 'there'},</p>
                <p><strong>${hostName}</strong> has joined the room for your session "<strong>${session.title}</strong>".</p>
                <p>Click below to join now:</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${joinLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #199D67, #14B8A6); color: white; text-decoration: none; border-radius: 9999px; font-weight: 600;">
                    Join Session Now
                  </a>
                </p>
                <p style="color: #666; font-size: 14px;">See you in there!</p>
              </div>
            `,
            textBody: `${hostName} is in the room! Your session "${session.title}" is starting. Join now: ${joinLink}`,
          })
          results.emailsSent++
          console.log(`✅ Host-joined email sent to ${participant.email}`)
        } catch (err) {
          const error = `Email to ${participant.email}: ${err instanceof Error ? err.message : 'Failed'}`
          results.errors.push(error)
          console.error(`❌ ${error}`)
        }
      }

      // Send SMS notification
      if (participant.phone) {
        try {
          await sendSMS({
            to: participant.phone,
            body: `${hostName} is in the room! Your VibrationFit session is starting. Join now: ${joinLink}`,
          })
          results.smsSent++
          console.log(`✅ Host-joined SMS sent to ${participant.phone}`)
        } catch (err) {
          const error = `SMS to ${participant.phone}: ${err instanceof Error ? err.message : 'Failed'}`
          results.errors.push(error)
          console.error(`❌ ${error}`)
        }
      }
    }

    // Cancel any pending reminder messages for this session
    // (since the session is now starting)
    await supabase
      .from('scheduled_messages')
      .update({ status: 'cancelled' })
      .eq('related_entity_type', 'video_session')
      .eq('related_entity_id', sessionId)
      .eq('status', 'pending')

    return NextResponse.json({
      message: 'Host joined notifications sent',
      ...results
    })

  } catch (error) {
    console.error('Error in host-joined notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


