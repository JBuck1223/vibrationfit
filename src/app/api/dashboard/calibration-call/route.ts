/**
 * GET /api/dashboard/calibration-call
 *
 * Returns upcoming Calibration Call for the dashboard (post-intensive).
 * Show card when: user has a checklist with call_scheduled and !calibration_call_completed.
 * Card goes away when calibration_call_completed is true.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Checklist where user has call booked but not yet completed
    const { data: checklist } = await supabase
      .from('intensive_checklist')
      .select('id, call_scheduled, calibration_call_completed, call_scheduled_time')
      .eq('user_id', user.id)
      .eq('call_scheduled', true)
      .eq('calibration_call_completed', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!checklist) {
      return NextResponse.json({ show: false })
    }

    // Get participant sessions for this user to find the calibration session (by user_id or email)
    let sessionIds: string[] = []
    const { data: byUserId } = await supabase
      .from('video_session_participants')
      .select('session_id')
      .eq('user_id', user.id)
    if (byUserId?.length) {
      sessionIds = byUserId.map((p: { session_id: string }) => p.session_id)
    }
    if (sessionIds.length === 0 && user.email) {
      const { data: byEmail } = await supabase
        .from('video_session_participants')
        .select('session_id')
        .eq('email', user.email)
      if (byEmail?.length) {
        sessionIds = byEmail.map((p: { session_id: string }) => p.session_id)
      }
    }
    if (sessionIds.length === 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'
      return NextResponse.json({
        show: true,
        session: {
          id: null,
          title: 'Calibration Call',
          scheduled_at: checklist.call_scheduled_time,
          join_link: `${appUrl}/intensive/call-prep`,
        },
      })
    }

    const { data: session } = await supabase
      .from('video_sessions')
      .select('id, title, scheduled_at')
      .in('id', sessionIds)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'
    if (!session) {
      return NextResponse.json({
        show: true,
        session: {
          id: null,
          title: 'Calibration Call',
          scheduled_at: checklist.call_scheduled_time,
          join_link: `${appUrl}/intensive/call-prep`,
        },
      })
    }

    const joinLink = `${appUrl}/session/${session.id}${user.email ? `?email=${encodeURIComponent(user.email)}` : ''}`

    return NextResponse.json({
      show: true,
      session: {
        id: session.id,
        title: session.title,
        scheduled_at: session.scheduled_at,
        join_link: joinLink,
      },
    })
  } catch (e) {
    console.error('Error in GET /api/dashboard/calibration-call:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
