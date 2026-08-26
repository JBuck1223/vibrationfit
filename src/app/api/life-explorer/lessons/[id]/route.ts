import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { materializePackLessons } from '@/lib/life-explorer/generate'
import { seedLessonItems } from '@/lib/life-explorer/lesson-items'
import type { LeLesson, LessonPayload } from '@/lib/life-explorer/types'

export const dynamic = 'force-dynamic'

/**
 * Returns the full lesson bucket: the generated guide plus everything that
 * lives inside it — action items, notes, links, and uploaded media.
 * Lessons created before the container feature get their checklist seeded
 * from the payload on first open.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: loaded, error } = await supabase
    .from('le_lessons')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  let lesson = loaded as LeLesson
  const storedWhy = (lesson.payload as LessonPayload | null)?.identity?.why_this_matters || ''
  if (storedWhy.includes('Florida sits next to the Atlantic')) {
    try {
      await materializePackLessons(supabase, user.id, lesson.student_id)
      const { data: fresh } = await supabase.from('le_lessons').select('*').eq('id', id).single()
      if (fresh) lesson = fresh as LeLesson
    } catch (err) {
      console.error('le materialize pack', err)
    }
  }

  const [itemsRes, notesRes, linksRes, mediaRes] = await Promise.all([
    supabase
      .from('le_lesson_items')
      .select('*')
      .eq('lesson_id', id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('le_lesson_notes')
      .select('*')
      .eq('lesson_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('le_lesson_links')
      .select('*')
      .eq('lesson_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('le_lesson_media')
      .select('*')
      .eq('lesson_id', id)
      .order('created_at', { ascending: true }),
  ])

  let items = itemsRes.data || []
  if (items.length === 0) {
    items = await seedLessonItems(supabase, lesson as LeLesson, user.id)
  }

  return NextResponse.json({
    lesson,
    items,
    notes: notesRes.data || [],
    links: linksRes.data || [],
    media: mediaRes.data || [],
  })
}
