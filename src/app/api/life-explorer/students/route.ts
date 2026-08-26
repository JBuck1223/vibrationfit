import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdContext } from '@/lib/household/context'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('le_students')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ students: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const household = await getHouseholdContext(user.id)

  const { data, error } = await supabase
    .from('le_students')
    .insert({
      created_by: user.id,
      household_id: household?.householdId || null,
      name: body.name,
      grade_level: body.grade_level || '1',
      current_age: body.current_age ?? null,
      interests: body.interests || [],
      strengths: body.strengths || [],
      skills_needing_support: body.skills_needing_support || [],
      active: body.active !== false,
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ student: data })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.life_i_choose === 'string') patch.life_i_choose = body.life_i_choose
  if (typeof body.life_i_choose_audio_url === 'string' || body.life_i_choose_audio_url === null) {
    patch.life_i_choose_audio_url = body.life_i_choose_audio_url
  }
  if (typeof body.name === 'string') patch.name = body.name
  if (typeof body.grade_level === 'string') patch.grade_level = body.grade_level
  if (typeof body.current_age === 'number' || body.current_age === null) {
    patch.current_age = body.current_age
  }
  if (Array.isArray(body.interests)) patch.interests = body.interests
  if (Array.isArray(body.strengths)) patch.strengths = body.strengths
  if (Array.isArray(body.skills_needing_support)) {
    patch.skills_needing_support = body.skills_needing_support
  }
  if (body.life_i_choose_source === 'profile_draft' || body.life_i_choose_source === 'child_edited') {
    patch.life_i_choose_source = body.life_i_choose_source
  }
  if (typeof body.notice_of_intent_date === 'string' || body.notice_of_intent_date === null) {
    patch.notice_of_intent_date = body.notice_of_intent_date
  }

  const { data, error } = await supabase
    .from('le_students')
    .update(patch)
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ student: data })
}
