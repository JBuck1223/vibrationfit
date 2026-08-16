import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Restore a set-aside lesson version.
 *
 * "Regenerate today" never deletes — it marks the previous lesson `skipped`
 * and composes a new one. This endpoint is the way back: it promotes a
 * skipped lesson to `ready` and sets aside whatever ready/in_progress lesson
 * currently holds the slot. Both versions stay in the Lesson Log with their
 * own checklists, notes, and media intact.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: target, error: loadError } = await supabase
    .from('le_lessons')
    .select('*')
    .eq('id', id)
    .single()

  if (loadError || !target) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  if (target.status === 'ready' || target.status === 'in_progress') {
    return NextResponse.json({ lesson: target })
  }

  if (target.status === 'completed') {
    return NextResponse.json(
      { error: 'Completed lessons are permanent records and cannot be restored as today\u2019s lesson.' },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()

  // Set aside the currently active lesson (if any) — same swap regenerate does,
  // in the other direction. It stays runnable another day.
  const { data: active } = await supabase
    .from('le_lessons')
    .select('id')
    .eq('student_id', target.student_id)
    .eq('expedition_id', target.expedition_id)
    .in('status', ['ready', 'in_progress'])
    .neq('id', id)

  if (active && active.length > 0) {
    const { error: demoteError } = await supabase
      .from('le_lessons')
      .update({ status: 'skipped', updated_at: now })
      .in(
        'id',
        active.map((a) => a.id)
      )
    if (demoteError) {
      return NextResponse.json({ error: demoteError.message }, { status: 500 })
    }
  }

  const { data: lesson, error: restoreError } = await supabase
    .from('le_lessons')
    .update({ status: 'ready', updated_at: now })
    .eq('id', id)
    .select('*')
    .single()

  if (restoreError || !lesson) {
    return NextResponse.json(
      { error: restoreError?.message || 'Failed to restore lesson' },
      { status: 500 }
    )
  }

  return NextResponse.json({ lesson, set_aside_count: active?.length || 0 })
}
