import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Persist an uploaded document/photo/video into the lesson bucket.
 * The file is already on S3 (uploaded client-side via uploadUserFile) —
 * this stores the reference, optionally scoped to an action item or note.
 */
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
  if (!body.url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  const { data: media, error } = await supabase
    .from('le_lesson_media')
    .insert({
      lesson_id: id,
      item_id: body.item_id || null,
      note_id: body.note_id || null,
      student_id: lesson.student_id,
      created_by: user.id,
      household_id: lesson.household_id,
      media_type: body.media_type || 'photo',
      url: body.url,
      file_name: body.file_name || null,
      caption: body.caption?.trim() || null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ media }, { status: 201 })
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
  const mediaId = request.nextUrl.searchParams.get('media_id')
  if (!mediaId) return NextResponse.json({ error: 'media_id is required' }, { status: 400 })

  const { error } = await supabase
    .from('le_lesson_media')
    .delete()
    .eq('id', mediaId)
    .eq('lesson_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
