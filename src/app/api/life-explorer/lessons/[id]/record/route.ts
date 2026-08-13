import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const now = new Date().toISOString()
  const updates: Record<string, unknown> = { updated_at: now }
  if (body.status) updates.status = body.status

  // Wall-clock timing for the lesson record: first open stamps the start,
  // finishing stamps the end. Never overwrite an existing stamp.
  if (body.status === 'in_progress' || body.status === 'completed') {
    const { data: current } = await supabase
      .from('le_lessons')
      .select('started_at, completed_at')
      .eq('id', id)
      .single()
    if (current && !current.started_at) updates.started_at = now
    if (body.status === 'completed' && current && !current.completed_at) {
      updates.completed_at = now
    }
  }

  const { data: lesson, error } = await supabase
    .from('le_lessons')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.activities_completed || body.activities_skipped || body.parent_notes) {
    await supabase.from('le_lesson_records').upsert(
      {
        lesson_id: id,
        expedition_id: lesson.expedition_id,
        student_id: lesson.student_id,
        created_by: user.id,
        household_id: lesson.household_id,
        status: body.record_status || 'partial',
        activities_completed: body.activities_completed || [],
        activities_skipped: body.activities_skipped || [],
        parent_notes: body.parent_notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'lesson_id' }
    )
  }

  return NextResponse.json({ lesson })
}
