import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveStudent, getActiveExpedition } from '@/lib/life-explorer/context'

export const dynamic = 'force-dynamic'

const TITLE_PREFIX = 'Morning Appreciation'

function todayTitle(): string {
  return `${TITLE_PREFIX} — ${new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`
}

// GET — today's appreciation entry (if captured), for the Today card state.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const student = await getActiveStudent(
    supabase,
    request.nextUrl.searchParams.get('student_id') || undefined
  )
  if (!student) return NextResponse.json({ entry: null })

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('le_learning_evidence')
    .select('id, title, photo_url, student_explanation, created_at')
    .eq('student_id', student.id)
    .like('title', `${TITLE_PREFIX}%`)
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ entry: data || null })
}

/**
 * POST — capture the morning Appreciation journal page (the kids' version
 * of the Vibration Fit appreciation practice: a drawing on top, a couple
 * of sentences below). The photo files as journal evidence (Journey Feed +
 * Florida portfolio) and writes the daily activity log automatically.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.photo_url) {
    return NextResponse.json({ error: 'photo_url required' }, { status: 400 })
  }

  const student = await getActiveStudent(supabase, body.student_id)
  if (!student) return NextResponse.json({ error: 'No active student' }, { status: 400 })
  const expedition = await getActiveExpedition(supabase, student.id)

  const whatTheyWrote =
    typeof body.what_they_wrote === 'string' && body.what_they_wrote.trim()
      ? body.what_they_wrote.trim()
      : null

  const { data: evidence, error } = await supabase
    .from('le_learning_evidence')
    .insert({
      student_id: student.id,
      expedition_id: expedition?.id || null,
      created_by: user.id,
      household_id: student.household_id,
      type: 'journal',
      title: todayTitle(),
      photo_url: body.photo_url,
      student_explanation: whatTheyWrote,
      academic_tags: ['writing', 'social-emotional'],
    })
    .select('*')
    .single()

  if (error || !evidence) {
    return NextResponse.json({ error: error?.message || 'Failed to save' }, { status: 500 })
  }

  // Daily activity log — appreciation journaling is real writing practice.
  // Idempotent per day: only the first capture writes the log entry.
  const today = new Date().toISOString().slice(0, 10)
  const logTitle = 'Morning Appreciation journal'
  const { data: existingLog } = await supabase
    .from('le_activity_logs')
    .select('id')
    .eq('student_id', student.id)
    .eq('entry_date', today)
    .eq('title', logTitle)
    .maybeSingle()

  if (!existingLog) {
    await supabase.from('le_activity_logs').insert({
      student_id: student.id,
      expedition_id: expedition?.id || null,
      created_by: user.id,
      household_id: student.household_id,
      entry_date: today,
      title: logTitle,
      description: whatTheyWrote
        ? `Student wrote: "${whatTheyWrote}"`
        : 'Drew and wrote a morning appreciation journal entry.',
      duration_minutes: 10,
      reading_materials: [],
      subjects: ['writing', 'social-emotional'],
    })
  }

  return NextResponse.json({ entry: evidence })
}
