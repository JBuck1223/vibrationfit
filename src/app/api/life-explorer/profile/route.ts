import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdContext } from '@/lib/household/context'
import { PROFILE_STATE_FIELDS } from '@/lib/life-explorer/life-profile'

export const dynamic = 'force-dynamic'

// GET /api/life-explorer/profile?student_id=...
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const studentId = request.nextUrl.searchParams.get('student_id')
  if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('le_student_profiles')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

// PUT /api/life-explorer/profile — upsert the current-state profile
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.student_id) {
    return NextResponse.json({ error: 'student_id required' }, { status: 400 })
  }

  const values: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const field of PROFILE_STATE_FIELDS) {
    if (typeof body[field] === 'string' || body[field] === null) values[field] = body[field]
  }
  if (typeof body.parent_hopes === 'string' || body.parent_hopes === null) {
    values.parent_hopes = body.parent_hopes
  }

  const { data: existing } = await supabase
    .from('le_student_profiles')
    .select('id')
    .eq('student_id', body.student_id)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('le_student_profiles')
      .update(values)
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile: data })
  }

  const household = await getHouseholdContext(user.id)
  const { data, error } = await supabase
    .from('le_student_profiles')
    .insert({
      ...values,
      student_id: body.student_id,
      created_by: user.id,
      household_id: household?.householdId || null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
