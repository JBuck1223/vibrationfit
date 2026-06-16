import { createAdminClient } from '@/lib/supabase/admin'
import { autoVerifyOccurrenceByActivityType } from '@/lib/map/auto-verify'

const JORDAN_EMAIL = 'jordan@vibrationfit.com'
const VANESSA_EMAIL = 'vanessa@vibrationfit.com'

type CoHostKey = 'jordan' | 'vanessa'

interface CoHostAccount {
  key: CoHostKey
  id: string
  name: string
}

interface CoHostPair {
  jordan: CoHostAccount | null
  vanessa: CoHostAccount | null
}

async function loadCoHostPair(
  admin: ReturnType<typeof createAdminClient>,
): Promise<CoHostPair> {
  const { data: accounts } = await admin
    .from('user_accounts')
    .select('id, email, first_name, full_name')
    .in('email', [JORDAN_EMAIL, VANESSA_EMAIL])

  const byEmail = new Map(
    (accounts ?? []).map(account => [account.email?.toLowerCase(), account]),
  )

  const jordanRow = byEmail.get(JORDAN_EMAIL)
  const vanessaRow = byEmail.get(VANESSA_EMAIL)

  return {
    jordan: jordanRow?.id
      ? {
          key: 'jordan',
          id: jordanRow.id,
          name: jordanRow.full_name || jordanRow.first_name || 'Jordan Buckingham',
        }
      : null,
    vanessa: vanessaRow?.id
      ? {
          key: 'vanessa',
          id: vanessaRow.id,
          name: vanessaRow.full_name || vanessaRow.first_name || 'Vanessa Buckingham',
        }
      : null,
  }
}

function resolveJoiningCoHost(
  joiningUserEmail: string | null | undefined,
  joiningUserId: string | null | undefined,
  pair: CoHostPair,
): CoHostKey | null {
  if (joiningUserEmail?.toLowerCase() === JORDAN_EMAIL) return 'jordan'
  if (joiningUserEmail?.toLowerCase() === VANESSA_EMAIL) return 'vanessa'
  if (pair.jordan && joiningUserId === pair.jordan.id) return 'jordan'
  if (pair.vanessa && joiningUserId === pair.vanessa.id) return 'vanessa'
  return null
}

function getMirrorTarget(joining: CoHostKey, pair: CoHostPair): CoHostAccount | null {
  if (joining === 'jordan') return pair.vanessa
  if (joining === 'vanessa') return pair.jordan
  return null
}

async function markCoHostAttendance(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
  target: CoHostAccount,
  joinedAt: string,
): Promise<boolean> {
  const { data: existingParticipant } = await admin
    .from('video_session_participants')
    .select('id, attended')
    .eq('session_id', sessionId)
    .eq('user_id', target.id)
    .maybeSingle()

  if (existingParticipant?.attended) {
    return false
  }

  if (existingParticipant) {
    const { error: updateError } = await admin
      .from('video_session_participants')
      .update({
        attended: true,
        joined_at: joinedAt,
        updated_at: joinedAt,
      })
      .eq('id', existingParticipant.id)

    if (updateError) {
      console.error(
        `[alignment-gym-co-attendance] Failed to update ${target.key}:`,
        updateError,
      )
      return false
    }
  } else {
    const { error: insertError } = await admin.from('video_session_participants').insert({
      session_id: sessionId,
      user_id: target.id,
      name: target.name,
      is_host: false,
      attended: true,
      joined_at: joinedAt,
      updated_at: joinedAt,
    })

    if (insertError) {
      console.error(
        `[alignment-gym-co-attendance] Failed to insert ${target.key}:`,
        insertError,
      )
      return false
    }
  }

  const joinedDate = joinedAt.split('T')[0]
  autoVerifyOccurrenceByActivityType(target.id, 'alignment_gym', joinedDate).catch(() => {})
  return true
}

/**
 * Jordan and Vanessa co-host Alignment Gym from one device. When either joins,
 * mirror attendance to the other so MAP/stats stay accurate without a second join.
 */
export async function mirrorAlignmentGymCoHostAttendance(
  sessionId: string,
  joiningUserEmail: string | null | undefined,
  joinedAt: string,
  joiningUserId?: string | null,
): Promise<void> {
  const admin = createAdminClient()
  const pair = await loadCoHostPair(admin)
  const joining = resolveJoiningCoHost(joiningUserEmail, joiningUserId, pair)
  if (!joining) return

  const target = getMirrorTarget(joining, pair)
  if (!target) {
    console.warn(`[alignment-gym-co-attendance] Mirror target for ${joining} not found`)
    return
  }

  await markCoHostAttendance(admin, sessionId, target, joinedAt)
}

export interface BackfillAlignmentGymCoHostResult {
  sessionsChecked: number
  mirroredSessions: number
  vanessaBackfilled: number
  jordanBackfilled: number
}

/**
 * Backfill missing co-host attendance for past Alignment Gym sessions.
 */
export async function backfillAlignmentGymCoHostAttendance(): Promise<BackfillAlignmentGymCoHostResult> {
  const admin = createAdminClient()
  const pair = await loadCoHostPair(admin)

  const result: BackfillAlignmentGymCoHostResult = {
    sessionsChecked: 0,
    mirroredSessions: 0,
    vanessaBackfilled: 0,
    jordanBackfilled: 0,
  }

  if (!pair.jordan || !pair.vanessa) {
    console.warn('[alignment-gym-co-attendance] Missing co-host account(s); skipping backfill')
    return result
  }

  const { data: attendedRows, error } = await admin
    .from('video_session_participants')
    .select(`
      session_id,
      user_id,
      joined_at,
      video_sessions!inner(id, session_type, title)
    `)
    .in('user_id', [pair.jordan.id, pair.vanessa.id])
    .eq('attended', true)
    .not('joined_at', 'is', null)

  if (error) {
    throw new Error(`Failed to load co-host attendance: ${error.message}`)
  }

  const alignmentGymAttendance = (attendedRows ?? []).filter(row => {
    const session = row.video_sessions as { session_type?: string; title?: string } | null
    if (!session) return false
    if (session.session_type === 'alignment_gym') return true
    return typeof session.title === 'string' && /alignment gym/i.test(session.title)
  })

  const attendanceBySession = new Map<
    string,
    { jordan?: string; vanessa?: string }
  >()

  for (const row of alignmentGymAttendance) {
    const joinedAt = row.joined_at as string
    const existing = attendanceBySession.get(row.session_id) ?? {}

    if (row.user_id === pair.jordan.id) {
      existing.jordan = existing.jordan ?? joinedAt
    } else if (row.user_id === pair.vanessa.id) {
      existing.vanessa = existing.vanessa ?? joinedAt
    }

    attendanceBySession.set(row.session_id, existing)
  }

  result.sessionsChecked = attendanceBySession.size

  for (const [sessionId, attendance] of attendanceBySession) {
    let mirroredThisSession = false

    if (attendance.jordan && !attendance.vanessa) {
      const updated = await markCoHostAttendance(
        admin,
        sessionId,
        pair.vanessa,
        attendance.jordan,
      )
      if (updated) {
        result.vanessaBackfilled++
        mirroredThisSession = true
      }
    }

    if (attendance.vanessa && !attendance.jordan) {
      const updated = await markCoHostAttendance(
        admin,
        sessionId,
        pair.jordan,
        attendance.vanessa,
      )
      if (updated) {
        result.jordanBackfilled++
        mirroredThisSession = true
      }
    }

    if (mirroredThisSession) {
      result.mirroredSessions++
    }
  }

  return result
}
