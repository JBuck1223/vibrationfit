/**
 * Sync Participants from Daily.co
 *
 * POST /api/admin/sessions/sync-participants
 *
 * Pulls actual participant data from the Daily.co meetings API for a
 * given video session and upserts rows into video_session_participants.
 * This backfills attendance data that was missed when participants joined
 * the Daily room without going through the app's join endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createServiceClient } from '@/lib/supabase/service'
import { listMeetings, getMeeting } from '@/lib/video/daily'

export const runtime = 'nodejs'
export const maxDuration = 60

interface SyncStep {
  label: string
  status: 'ok' | 'error' | 'info'
  detail?: string
}

export async function POST(request: NextRequest) {
  const steps: SyncStep[] = []

  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // 1. Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('video_sessions')
      .select('id, daily_room_name, session_type, host_user_id, scheduled_at')
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      steps.push({ label: 'Fetch session', status: 'error', detail: sessionError?.message || 'Not found' })
      return NextResponse.json({ steps, error: 'Session not found' }, { status: 404 })
    }

    steps.push({ label: 'Fetch session', status: 'ok', detail: `Room: ${session.daily_room_name}` })

    if (!session.daily_room_name) {
      steps.push({ label: 'Check room', status: 'error', detail: 'No Daily room name on session' })
      return NextResponse.json({ steps, error: 'Session has no Daily room' }, { status: 400 })
    }

    // 2. List meetings from Daily.co for this room
    steps.push({ label: 'Querying Daily.co meetings', status: 'info' })

    const meetingsResp = await listMeetings(session.daily_room_name)
    const meetings = meetingsResp.data || []

    if (meetings.length === 0) {
      steps.push({
        label: 'Find meetings',
        status: 'error',
        detail: `No meetings found for room "${session.daily_room_name}"`,
      })
      return NextResponse.json({ steps, error: 'No meetings found' }, { status: 404 })
    }

    steps.push({
      label: 'Find meetings',
      status: 'ok',
      detail: `Found ${meetings.length} meeting(s) for room`,
    })

    // 3. Pick the best meeting — the one closest to scheduled_at, or the longest
    const scheduledTime = new Date(session.scheduled_at).getTime() / 1000
    const sorted = [...meetings].sort((a, b) => {
      const diffA = Math.abs(a.start_time - scheduledTime)
      const diffB = Math.abs(b.start_time - scheduledTime)
      return diffA - diffB
    })
    let meeting = sorted[0]

    // If the list endpoint didn't include full participant data, fetch it
    if (!meeting.participants || meeting.participants.length === 0) {
      steps.push({ label: 'Fetching full meeting details', status: 'info', detail: meeting.id })
      meeting = await getMeeting(meeting.id)
    }

    const dailyParticipants = meeting.participants || []

    steps.push({
      label: 'Selected meeting',
      status: 'ok',
      detail: `ID: ${meeting.id}, ${dailyParticipants.length} participant(s), duration: ${Math.round(meeting.duration / 60)}m`,
    })

    if (dailyParticipants.length === 0) {
      steps.push({ label: 'Sync', status: 'info', detail: 'No participants in meeting data' })
      return NextResponse.json({ steps, synced: 0 })
    }

    // 4. Load existing participant rows for this session
    const { data: existingRows } = await supabase
      .from('video_session_participants')
      .select('id, user_id, name, is_host')
      .eq('session_id', session_id)

    const existingByUserId = new Map(
      (existingRows || [])
        .filter(r => r.user_id)
        .map(r => [r.user_id, r])
    )

    // 5. Load all user_accounts to match Daily user_ids and names
    const { data: allUsers } = await supabase
      .from('user_accounts')
      .select('id, first_name, last_name, full_name, email')

    const userById = new Map((allUsers || []).map(u => [u.id, u]))
    const userByName = new Map(
      (allUsers || [])
        .filter(u => u.full_name)
        .map(u => [u.full_name!.toLowerCase(), u])
    )

    // 6. Process each Daily participant
    let synced = 0
    let skipped = 0

    for (const dp of dailyParticipants) {
      // Skip the host
      if (dp.user_id === session.host_user_id) {
        // Update host attendance data
        const hostRow = (existingRows || []).find(r => r.is_host)
        if (hostRow) {
          await supabase
            .from('video_session_participants')
            .update({
              attended: true,
              joined_at: new Date(dp.join_time * 1000).toISOString(),
              duration_seconds: dp.duration,
            })
            .eq('id', hostRow.id)
        }
        skipped++
        continue
      }

      // Try to match to an existing participant row
      const existingRow = dp.user_id ? existingByUserId.get(dp.user_id) : null

      if (existingRow) {
        // Update attendance data on existing row
        await supabase
          .from('video_session_participants')
          .update({
            attended: true,
            joined_at: new Date(dp.join_time * 1000).toISOString(),
            duration_seconds: dp.duration,
          })
          .eq('id', existingRow.id)
        synced++
        continue
      }

      // Try to resolve user_id from Daily's user_id or user_name
      let resolvedUserId = dp.user_id && userById.has(dp.user_id) ? dp.user_id : null
      let resolvedName = dp.user_name || 'Unknown'

      if (!resolvedUserId && dp.user_name) {
        const match = userByName.get(dp.user_name.toLowerCase())
        if (match) {
          resolvedUserId = match.id
          resolvedName = match.full_name || dp.user_name
        }
      }

      if (resolvedUserId) {
        const account = userById.get(resolvedUserId)
        if (account?.full_name) resolvedName = account.full_name
      }

      // Check if this user_id already has a row (might have been matched differently)
      if (resolvedUserId && existingByUserId.has(resolvedUserId)) {
        const row = existingByUserId.get(resolvedUserId)!
        await supabase
          .from('video_session_participants')
          .update({
            attended: true,
            joined_at: new Date(dp.join_time * 1000).toISOString(),
            duration_seconds: dp.duration,
          })
          .eq('id', row.id)
        synced++
        continue
      }

      // Insert new participant row
      const { error: insertError } = await supabase
        .from('video_session_participants')
        .insert({
          session_id,
          user_id: resolvedUserId,
          name: resolvedName,
          is_host: false,
          attended: true,
          joined_at: new Date(dp.join_time * 1000).toISOString(),
          duration_seconds: dp.duration,
        })

      if (insertError) {
        steps.push({
          label: `Insert participant "${resolvedName}"`,
          status: 'error',
          detail: insertError.message,
        })
      } else {
        synced++
      }
    }

    steps.push({
      label: 'Sync complete',
      status: 'ok',
      detail: `Synced ${synced} participant(s), skipped ${skipped} (host)`,
    })

    return NextResponse.json({ steps, synced, total: dailyParticipants.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    steps.push({ label: 'Unexpected error', status: 'error', detail: msg })
    return NextResponse.json({ steps, error: msg }, { status: 500 })
  }
}
