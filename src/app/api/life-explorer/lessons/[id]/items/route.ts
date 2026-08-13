import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function loadLesson(supabase: SupabaseClient, lessonId: string) {
  const { data } = await supabase
    .from('le_lessons')
    .select('id, student_id, household_id')
    .eq('id', lessonId)
    .single()
  return data
}

/** Add a custom action item to the lesson checklist. */
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
  const lesson = await loadLesson(supabase, id)
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const body = await request.json()
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const { data: maxRow } = await supabase
    .from('le_lesson_items')
    .select('sort_order')
    .eq('lesson_id', id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: item, error } = await supabase
    .from('le_lesson_items')
    .insert({
      lesson_id: id,
      student_id: lesson.student_id,
      created_by: user.id,
      household_id: lesson.household_id,
      title: body.title.trim(),
      detail: body.detail?.trim() || null,
      kind: body.kind || 'custom',
      source: 'custom',
      sort_order: (maxRow?.sort_order ?? -1) + 1,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item }, { status: 201 })
}

/** Update an item — toggle completion, edit title/detail, reorder. */
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
  if (!body.item_id) {
    return NextResponse.json({ error: 'item_id is required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updates.title = String(body.title).trim()
  if (body.detail !== undefined) updates.detail = body.detail?.trim() || null
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order
  if (body.is_complete !== undefined) {
    updates.is_complete = !!body.is_complete
    updates.completed_at = body.is_complete ? new Date().toISOString() : null
  }

  const { data: item, error } = await supabase
    .from('le_lesson_items')
    .update(updates)
    .eq('id', body.item_id)
    .eq('lesson_id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item })
}

/** Remove an item (its scoped notes/links/media cascade). */
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
  const itemId = request.nextUrl.searchParams.get('item_id')
  if (!itemId) return NextResponse.json({ error: 'item_id is required' }, { status: 400 })

  const { error } = await supabase
    .from('le_lesson_items')
    .delete()
    .eq('id', itemId)
    .eq('lesson_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
