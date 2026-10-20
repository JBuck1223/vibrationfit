import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { loadCurrentStateText } from '@/lib/your-world/current-state'

const VISION_FIELD_MAP: Record<string, string> = {
  fun: 'fun',
  travel: 'travel',
  home: 'home',
  family: 'family',
  love: 'love',
  health: 'health',
  money: 'money',
  work: 'work',
  social: 'social',
  giving: 'giving',
  stuff: 'stuff',
  spirituality: 'spirituality',
}

async function fetchActiveVision(supabase: SupabaseClient, userId: string) {
  const selectFields = [
    'id',
    'fun',
    'travel',
    'home',
    'family',
    'love',
    'health',
    'money',
    'work',
    'social',
    'stuff',
    'giving',
    'spirituality',
  ].join(', ')

  const { data: activeVision } = await supabase
    .from('vision_versions')
    .select(selectFields)
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_draft', false)
    .maybeSingle()

  if (activeVision) return activeVision

  const { data: fallbackVision } = await supabase
    .from('vision_versions')
    .select(selectFields)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return fallbackVision ?? null
}

async function fetchAssessmentSnippets(
  supabase: SupabaseClient,
  userId: string,
  category: string
): Promise<string[]> {
  const { data: latestAssessment } = await supabase
    .from('assessment_results')
    .select('id')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestAssessment) return []

  const { data: responses } = await supabase
    .from('assessment_responses')
    .select('*')
    .eq('assessment_id', latestAssessment.id)

  if (!responses) return []

  return responses
    .filter((response: any) => response.category === category)
    .map((response: any) =>
      response.response_text ??
        response.response ??
        response.free_response ??
        response.reflection ??
        response.journal_entry ??
        ''
    )
    .filter((text) => text && String(text).trim().length > 0)
    .slice(0, 5)
}


export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const category = url.searchParams.get('category') ?? 'fun'

    const [profileStateText, vision, assessmentSnippets] = await Promise.all([
      loadCurrentStateText(supabase, user.id, category),
      fetchActiveVision(supabase, user.id),
      fetchAssessmentSnippets(supabase, user.id, category),
    ])

    const visionField = VISION_FIELD_MAP[category] ?? category
    const existingVisionParagraph = vision
      ? ((vision as unknown as Record<string, string | null | undefined>)[visionField] ?? '')
      : ''

    return NextResponse.json({
      category,
      profileStateText: profileStateText ?? '',
      existingVisionParagraph: existingVisionParagraph ?? '',
      assessmentSnippets,
    })
  } catch (error) {
    console.error('Failed to load scene context:', error)
    return NextResponse.json({ error: 'Failed to load scene context.' }, { status: 500 })
  }
}
