import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadActiveContext } from '@/lib/life-explorer/context'
import { generateDailyLesson } from '@/lib/life-explorer/generate'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * "Regenerate today": if the steer changed after today's lesson was built,
 * skip the current ready lesson and compose a fresh one. The skipped lesson
 * keeps its `skipped` status and stays runnable another day.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const ctx = await loadActiveContext(supabase, body.student_id)
  if (!ctx?.expedition) {
    return NextResponse.json({ error: 'No active expedition' }, { status: 400 })
  }

  if (ctx.readyLesson) {
    const { error } = await supabase
      .from('le_lessons')
      .update({ status: 'skipped', updated_at: new Date().toISOString() })
      .eq('id', ctx.readyLesson.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  try {
    const lesson = await generateDailyLesson(supabase, user.id, body.student_id)
    return NextResponse.json({ lesson })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generate failed' },
      { status: 500 }
    )
  }
}
