import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildMaterialsForecast } from '@/lib/life-explorer/forecast'

export const dynamic = 'force-dynamic'

// GET /api/life-explorer/forecast?student_id=…
// Weekly Materials Forecast — the parent's 5-minute Sunday review.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let studentId = request.nextUrl.searchParams.get('student_id')
  if (!studentId) {
    const { data: student } = await supabase
      .from('le_students')
      .select('id')
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    studentId = student?.id || null
  }
  if (!studentId) {
    return NextResponse.json({
      forecast: { expedition_title: null, plan_ahead: [], pantry: [], tonight: [] },
    })
  }

  const forecast = await buildMaterialsForecast(supabase, studentId)
  return NextResponse.json({ forecast })
}
