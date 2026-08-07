import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDailyLesson } from '@/lib/life-explorer/generate'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const lesson = await generateDailyLesson(supabase, user.id, body.student_id)
    return NextResponse.json({ lesson })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate lesson'
    const status = /token|balance/i.test(message) ? 402 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
