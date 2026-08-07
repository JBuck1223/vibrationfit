import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const studentId = request.nextUrl.searchParams.get('student_id')
  const type = request.nextUrl.searchParams.get('type')

  let query = supabase
    .from('le_learning_evidence')
    .select('*')
    .order('created_at', { ascending: false })

  if (studentId) query = query.eq('student_id', studentId)
  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ evidence: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.student_id || !body.title) {
    return NextResponse.json({ error: 'student_id and title required' }, { status: 400 })
  }

  const { data: student } = await supabase
    .from('le_students')
    .select('household_id')
    .eq('id', body.student_id)
    .single()

  const { data, error } = await supabase
    .from('le_learning_evidence')
    .insert({
      student_id: body.student_id,
      expedition_id: body.expedition_id || null,
      lesson_id: body.lesson_id || null,
      created_by: user.id,
      household_id: student?.household_id || null,
      type: body.type || 'other',
      title: body.title,
      file_url: body.file_url || null,
      photo_url: body.photo_url || null,
      student_explanation: body.student_explanation || null,
      parent_observation: body.parent_observation || null,
      academic_tags: body.academic_tags || [],
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ evidence: data })
}
