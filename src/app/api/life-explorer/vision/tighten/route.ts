import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveStudent } from '@/lib/life-explorer/context'
import { vivaComplete } from '@/lib/life-explorer/viva-complete'
import {
  LIFE_I_CHOOSE_TIGHTEN_SYSTEM_PROMPT,
  buildLifeIChooseTightenPrompt,
} from '@/lib/viva/prompts/life-explorer-compose'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const student = await getActiveStudent(supabase, body.student_id)
  if (!student) return NextResponse.json({ error: 'No active student' }, { status: 400 })

  const draft = (body.draft || student.life_i_choose || '').trim()
  if (!draft) {
    return NextResponse.json({ error: 'Write the Life I Choose first' }, { status: 400 })
  }

  const { text } = await vivaComplete({
    supabase,
    userId: user.id,
    system: LIFE_I_CHOOSE_TIGHTEN_SYSTEM_PROMPT,
    user: buildLifeIChooseTightenPrompt({
      studentName: student.name,
      gradeLevel: student.grade_level,
      draft,
    }),
    actionType: 'life_explorer_compose',
    maxTokens: 1200,
    temperature: 0.3,
    metadata: { kind: 'life_i_choose_tighten', student_id: student.id },
  })

  const tightened = text.replace(/^["']|["']$/g, '').trim()
  return NextResponse.json({ text: tightened })
}
