import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveStudent } from '@/lib/life-explorer/context'
import { vivaComplete } from '@/lib/life-explorer/viva-complete'
import { profileSummaryForPrompt } from '@/lib/life-explorer/life-profile'
import {
  LIFE_I_CHOOSE_DRAFT_SYSTEM_PROMPT,
  buildLifeIChooseDraftPrompt,
} from '@/lib/viva/prompts/life-explorer-compose'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// POST /api/life-explorer/vision/draft — VIVA drafts the Life I Choose from the profile
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const student = await getActiveStudent(supabase, body.student_id)
  if (!student) return NextResponse.json({ error: 'No active student' }, { status: 400 })

  const { data: profile } = await supabase
    .from('le_student_profiles')
    .select('*')
    .eq('student_id', student.id)
    .maybeSingle()

  const profileSummary = profileSummaryForPrompt(profile)
  if (!profileSummary && (student.interests || []).length === 0) {
    return NextResponse.json(
      { error: 'Fill out the current-state profile first' },
      { status: 400 }
    )
  }

  const { text } = await vivaComplete({
    supabase,
    userId: user.id,
    system: LIFE_I_CHOOSE_DRAFT_SYSTEM_PROMPT,
    user: buildLifeIChooseDraftPrompt({
      studentName: student.name,
      gradeLevel: student.grade_level,
      currentAge: student.current_age ?? null,
      profileSummary,
      interests: student.interests || [],
      strengths: student.strengths || [],
    }),
    actionType: 'life_explorer_compose',
    maxTokens: 1200,
    temperature: 0.7,
    metadata: { kind: 'life_i_choose_draft', student_id: student.id },
  })

  const draft = text.replace(/^["']|["']$/g, '').trim()
  if (!draft) return NextResponse.json({ error: 'VIVA could not draft this' }, { status: 502 })

  // Persist as the profile-sourced draft; the child's edits flip the source later.
  await supabase
    .from('le_students')
    .update({
      life_i_choose: draft,
      life_i_choose_source: 'profile_draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', student.id)

  return NextResponse.json({ text: draft })
}
