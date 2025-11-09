import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { flipFrequency } from '@/lib/viva/flip-frequency'

const CATEGORY_PROFILE_FIELDS: Record<string, { clarity: string; contrast: string }> = {
  fun: { clarity: 'clarity_fun', contrast: 'contrast_fun' },
  travel: { clarity: 'clarity_travel', contrast: 'contrast_travel' },
  home: { clarity: 'clarity_home', contrast: 'contrast_home' },
  family: { clarity: 'clarity_family', contrast: 'contrast_family' },
  love: { clarity: 'clarity_love', contrast: 'contrast_love' },
  health: { clarity: 'clarity_health', contrast: 'contrast_health' },
  money: { clarity: 'clarity_money', contrast: 'contrast_money' },
  work: { clarity: 'clarity_work', contrast: 'contrast_work' },
  social: { clarity: 'clarity_social', contrast: 'contrast_social' },
  giving: { clarity: 'clarity_giving', contrast: 'contrast_giving' },
  stuff: { clarity: 'clarity_stuff', contrast: 'contrast_stuff' },
  spirituality: { clarity: 'clarity_spirituality', contrast: 'contrast_spirituality' },
}

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

async function fetchActiveProfile(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data: activeProfile } = await supabase
    .from('user_profiles')
    .select('id, *')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_draft', false)
    .maybeSingle()

  if (activeProfile) return activeProfile

  const { data: fallbackProfile } = await supabase
    .from('user_profiles')
    .select('id, *')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return fallbackProfile ?? null
}

async function fetchActiveVision(supabase: ReturnType<typeof createClient>, userId: string) {
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
  supabase: ReturnType<typeof createClient>,
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

async function fetchLatestFlip(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  category: string
) {
  const { data } = await supabase
    .from('frequency_flip')
    .select('clarity_seed')
    .eq('user_id', userId)
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data?.clarity_seed ?? ''
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

    const profile = await fetchActiveProfile(supabase, user.id)
    const vision = await fetchActiveVision(supabase, user.id)
    const assessmentSnippets = await fetchAssessmentSnippets(supabase, user.id, category)

    const profileFields = CATEGORY_PROFILE_FIELDS[category]
    const clarityField = profileFields?.clarity
    const contrastField = profileFields?.contrast
    const profileGoesWellText = clarityField && profile ? profile[clarityField] ?? '' : ''
    const profileContrastText = contrastField && profile ? profile[contrastField] ?? '' : ''

    let storedClarity = await fetchLatestFlip(supabase, user.id, category)

    let flippedText = storedClarity
    if ((!flippedText || flippedText.trim().length === 0) && profileContrastText && profileContrastText.trim().length > 0) {
      try {
        const flipResult = await flipFrequency({ mode: 'flip', input: profileContrastText })
        const generated =
          (typeof flipResult === 'string' && flipResult.trim().length > 0 ? flipResult : null) ??
          (flipResult.items?.[0]?.clarity_seed ?? '').trim()

        if (generated) {
          flippedText = generated
        }
      } catch (error) {
        console.warn('Flip frequency failed for scene context:', error)
      }
    }

    const visionField = VISION_FIELD_MAP[category] ?? category
    const existingVisionParagraph = vision ? vision[visionField] ?? '' : ''

    return NextResponse.json({
      category,
      profileGoesWellText: profileGoesWellText ?? '',
      profileContrastText: profileContrastText ?? '',
      profileNotWellTextFlipped: flippedText ?? '',
      clarityStored: storedClarity || '',
      existingVisionParagraph: existingVisionParagraph ?? '',
      assessmentSnippets,
    })
  } catch (error) {
    console.error('Failed to load scene context:', error)
    return NextResponse.json({ error: 'Failed to load scene context.' }, { status: 500 })
  }
}
