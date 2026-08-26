import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { printShell } from '@/lib/life-explorer/print/layout'
import {
  fallbackTodayPage,
  recordingPage,
  visualPage,
} from '@/lib/life-explorer/print/lesson-visuals'
import type { LessonPayload } from '@/lib/life-explorer/types'

export const dynamic = 'force-dynamic'

// GET /api/life-explorer/print/lesson?id= — today's lesson pages:
// teaching visuals first, then a recording sheet if the activity needs one.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: lesson } = await supabase
    .from('le_lessons')
    .select('title, payload, expedition:le_expeditions(title)')
    .eq('id', id)
    .maybeSingle()

  if (!lesson) {
    return new NextResponse('<h1>Lesson not found</h1>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const payload = lesson.payload as LessonPayload
  const expeditionTitle =
    (lesson.expedition as unknown as { title: string } | null)?.title ||
    payload.identity?.expedition ||
    ''

  const pages: string[] = []
  for (const visual of payload.visuals || []) {
    pages.push(visualPage(visual, expeditionTitle))
  }
  if (payload.printable) {
    pages.push(recordingPage(payload.printable, expeditionTitle))
  }
  if (pages.length === 0) {
    pages.push(fallbackTodayPage(payload, expeditionTitle, lesson.title))
  }

  return new NextResponse(
    printShell({ title: `${lesson.title} — today’s pages`, pages }),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
