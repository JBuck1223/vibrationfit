import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/life-explorer/activity-log?student_id=…&month=YYYY-MM
// or ?student_id=…&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = request.nextUrl.searchParams
  const studentId = params.get('student_id')
  const month = params.get('month')
  let from = params.get('from')
  let to = params.get('to')

  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'month must be YYYY-MM' }, { status: 400 })
    }
    const [y, m] = month.split('-').map(Number)
    from = `${month}-01`
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
    to = `${month}-${String(lastDay).padStart(2, '0')}`
  }

  let query = supabase
    .from('le_activity_logs')
    .select('*, media:le_activity_media(*)')
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (studentId) query = query.eq('student_id', studentId)
  if (from) query = query.gte('entry_date', from)
  if (to) query = query.lte('entry_date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data || [] })
}

// POST /api/life-explorer/activity-log
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.student_id || !body.title || !body.entry_date) {
    return NextResponse.json(
      { error: 'student_id, title, and entry_date required' },
      { status: 400 }
    )
  }

  const { data: student } = await supabase
    .from('le_students')
    .select('household_id')
    .eq('id', body.student_id)
    .single()

  const { data: entry, error } = await supabase
    .from('le_activity_logs')
    .insert({
      student_id: body.student_id,
      expedition_id: body.expedition_id || null,
      created_by: user.id,
      household_id: student?.household_id || null,
      entry_date: body.entry_date,
      title: body.title,
      description: body.description || null,
      duration_minutes: body.duration_minutes ?? 0,
      reading_materials: body.reading_materials || [],
      subjects: body.subjects || [],
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let media: unknown[] = []
  if (Array.isArray(body.media) && body.media.length > 0) {
    const { data: inserted, error: mediaError } = await supabase
      .from('le_activity_media')
      .insert(
        body.media.map((m: { media_type?: string; url: string; caption?: string }) => ({
          activity_log_id: entry.id,
          student_id: body.student_id,
          created_by: user.id,
          household_id: student?.household_id || null,
          media_type: m.media_type || 'photo',
          url: m.url,
          caption: m.caption || null,
        }))
      )
      .select('*')
    if (mediaError) {
      return NextResponse.json({ error: mediaError.message }, { status: 500 })
    }
    media = inserted || []
  }

  return NextResponse.json({ entry: { ...entry, media } })
}
