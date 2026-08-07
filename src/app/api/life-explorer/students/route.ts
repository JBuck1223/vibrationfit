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
