import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** Add a note to the lesson (or to one of its action items via item_id). */
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
  const { data: lesson } = await supabase
    .from('le_lessons')
    .select('id, student_id, household_id')
    .eq('id', id)
    .single()
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const body = await request.json()
  if (!body.body?.trim()) {
    return NextResponse.json({ error: 'Note text is required' }, { status: 400 })
  }

  const { data: note, error } = await supabase
    .from('le_lesson_notes')
    .insert({
      lesson_id: id,
      item_id: body.item_id || null,
      student_id: lesson.student_id,
      created_by: user.id,
      household_id: lesson.household_id,
      body: body.body.trim(),
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note }, { status: 201 })
}

export async function PATCH(
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
  if (!body.note_id) {
    return NextResponse.json({ error: 'note_id is required' }, { status: 400 })
  }
  if (!body.body?.trim()) {
    return NextResponse.json({ error: 'Note text cannot be empty' }, { status: 400 })
  }

  const { data: note, error } = await supabase
    .from('le_lesson_notes')
    .update({ body: body.body.trim(), updated_at: new Date().toISOString() })
    .eq('id', body.note_id)
    .eq('lesson_id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const noteId = request.nextUrl.searchParams.get('note_id')
  if (!noteId) return NextResponse.json({ error: 'note_id is required' }, { status: 400 })

  const { error } = await supabase
    .from('le_lesson_notes')
    .delete()
    .eq('id', noteId)
    .eq('lesson_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
