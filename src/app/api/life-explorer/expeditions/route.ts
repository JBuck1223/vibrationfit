import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdContext } from '@/lib/household/context'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const studentId = request.nextUrl.searchParams.get('student_id')
  let query = supabase.from('le_expeditions').select('*').order('created_at', { ascending: false })
  if (studentId) query = query.eq('student_id', studentId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expeditions: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.student_id || !body.life_category || !body.title) {
    return NextResponse.json(
      { error: 'student_id, life_category, and title are required' },
      { status: 400 }
    )
  }

  const household = await getHouseholdContext(user.id)

  // Pause any currently active expedition for this student
  await supabase
    .from('le_expeditions')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .eq('student_id', body.student_id)
    .eq('status', 'active')

  const { data, error } = await supabase
    .from('le_expeditions')
    .insert({
      student_id: body.student_id,
      created_by: user.id,
      household_id: household?.householdId || null,
      life_category: body.life_category,
      title: body.title,
      status: 'active',
      start_date: body.start_date || new Date().toISOString().slice(0, 10),
      essential_questions: body.essential_questions || [],
      core_resources: body.core_resources || [],
      notes: body.notes || null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expedition: data })
}
