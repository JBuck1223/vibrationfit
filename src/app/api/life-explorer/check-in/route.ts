import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordLessonCheckIn } from '@/lib/life-explorer/checkin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.lesson_id) {
      return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })
    }

    const result = await recordLessonCheckIn(supabase, user.id, {
      lesson_id: body.lesson_id,
      enjoyed_most: body.enjoyed_most,
      created_said_demonstrated: body.created_said_demonstrated,
      easy_or_difficult: body.easy_or_difficult,
      new_question: body.new_question,
      direction: body.direction,
      student_engagement: body.student_engagement,
      parent_notes: body.parent_notes,
      photo_url: body.photo_url,
      activities_completed: body.activities_completed,
      activities_skipped: body.activities_skipped,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Check-in failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
