import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadActiveContext } from '@/lib/life-explorer/context'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const studentId = request.nextUrl.searchParams.get('student_id') || undefined
  const ctx = await loadActiveContext(supabase, studentId)

  if (!ctx) {
    return NextResponse.json({
      student: null,
      expedition: null,
      lesson: null,
      wonder_wall: { know: [], wonder: [], learned: [] },
      needs_seed: true,
    })
  }

  return NextResponse.json({
    student: ctx.student,
    expedition: ctx.expedition,
    lesson: ctx.readyLesson,
    wonder_wall: ctx.wonderWall,
    latest_record: ctx.latestRecord,
    skills: ctx.skills,
    needs_seed: !ctx.expedition,
  })
}
