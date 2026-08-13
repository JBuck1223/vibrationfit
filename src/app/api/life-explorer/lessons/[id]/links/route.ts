import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** Add a reference link to the lesson (or to an action item via item_id). */
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
  const url = String(body.url || '').trim()
  if (!/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: 'A valid http(s) URL is required' }, { status: 400 })
  }

  const { data: link, error } = await supabase
    .from('le_lesson_links')
    .insert({
      lesson_id: id,
      item_id: body.item_id || null,
      student_id: lesson.student_id,
      created_by: user.id,
      household_id: lesson.household_id,
      url,
      title: body.title?.trim() || null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ link }, { status: 201 })
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
  const linkId = request.nextUrl.searchParams.get('link_id')
  if (!linkId) return NextResponse.json({ error: 'link_id is required' }, { status: 400 })

  const { error } = await supabase
    .from('le_lesson_links')
    .delete()
    .eq('id', linkId)
    .eq('lesson_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
