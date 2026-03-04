import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isUserAdmin } from '@/lib/supabase/admin'
import { gateway } from '@/lib/ai/gateway'
import { buildIndividualCategoryPrompt } from '@/lib/viva/prompts/single-category-vision-prompt'
import {
  buildImaginationStarterPrompt,
  extractCategoryProfileData,
} from '@/lib/viva/prompts/imagination-starter-prompt'
import {
  getVisionCategory,
  isValidVisionCategory,
  getCategoryStateField,
  type LifeCategoryKey,
} from '@/lib/design-system/vision-categories'
import { getFilteredQuestionsForCategory } from '@/lib/life-vision/ideal-state-questions'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    if (!isUserAdmin(user)) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 })
    }

    const body = await request.json()
    const { userId, categoryKey, modelName, promptType, perspective = 'singular' } = body

    if (!userId || !categoryKey || !modelName || !promptType) {
      return new Response(JSON.stringify({ error: 'Missing required fields: userId, categoryKey, modelName, promptType' }), { status: 400 })
    }

    if (!isValidVisionCategory(categoryKey)) {
      return new Response(JSON.stringify({ error: `Invalid category: ${categoryKey}` }), { status: 400 })
    }

    const category = getVisionCategory(categoryKey)
    if (!category) {
      return new Response(JSON.stringify({ error: `Category not found: ${categoryKey}` }), { status: 400 })
    }

    const adminSupabase = createAdminClient()

    const { data: profile } = await adminSupabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('is_draft', false)
      .maybeSingle()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'No active profile found for this user' }), { status: 400 })
    }

    let prompt: string

    if (promptType === 'imagination-starter') {
      const stateField = getCategoryStateField(categoryKey as LifeCategoryKey)
      const stateText = profile[stateField] || ''

      if (!stateText) {
        return new Response(JSON.stringify({ error: `No state data for ${category.label} in this user's profile` }), { status: 400 })
      }

      const profileData = extractCategoryProfileData(categoryKey as LifeCategoryKey, profile)
      const questions = getFilteredQuestionsForCategory(categoryKey, profile)
      const questionTexts = questions.map((q: { text: string }) => q.text)

      prompt = buildImaginationStarterPrompt(
        categoryKey as LifeCategoryKey,
        category.label,
        stateText,
        profileData,
        questionTexts,
        perspective as 'singular' | 'plural'
      )
    } else if (promptType === 'category-vision') {
      const { data: categoryState } = await adminSupabase
        .from('vision_new_category_state')
        .select('get_me_started_text, imagination_text, clarity_keys')
        .eq('user_id', userId)
        .eq('category', categoryKey)
        .maybeSingle()

      const getMeStartedText = categoryState?.get_me_started_text || ''
      const imaginationText = categoryState?.imagination_text || ''
      const currentStateText = categoryState?.clarity_keys?.[0] || ''

      if (!getMeStartedText && !imaginationText) {
        const stateField = getCategoryStateField(categoryKey as LifeCategoryKey)
        const stateText = profile[stateField] || ''
        if (!stateText) {
          return new Response(JSON.stringify({ error: `No input data for ${category.label}. User needs to complete Get Me Started first.` }), { status: 400 })
        }
        prompt = buildIndividualCategoryPrompt(
          categoryKey,
          category.label,
          '',
          '',
          stateText,
          perspective as 'singular' | 'plural'
        )
      } else {
        prompt = buildIndividualCategoryPrompt(
          categoryKey,
          category.label,
          getMeStartedText,
          imaginationText,
          currentStateText,
          perspective as 'singular' | 'plural'
        )
      }
    } else {
      return new Response(JSON.stringify({ error: 'promptType must be "imagination-starter" or "category-vision"' }), { status: 400 })
    }

    console.log(`[VisionTest] model=${modelName} category=${categoryKey} type=${promptType} prompt_len=${prompt.length}`)

    const systemPrompt = promptType === 'imagination-starter'
      ? 'You are VIVA, a vibrationally intelligent assistant that writes powerful, present-tense life vision text. You write with certainty and embodied confidence. You never ask questions, never reference the past, and never hedge. Every word activates the life they choose.'
      : 'You are VIVA, a vibrationally intelligent assistant that writes beautiful, human-sounding life vision text.'

    const result = streamText({
      model: gateway(modelName),
      system: systemPrompt,
      prompt,
      temperature: 0.8,
    })

    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Model': modelName,
        'X-Category': categoryKey,
        'X-Prompt-Type': promptType,
        'X-Start-Time': startTime.toString(),
      },
    })
  } catch (err) {
    const elapsed = Date.now() - startTime
    console.error(`[VisionTest] Error after ${elapsed}ms:`, err)
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : 'Vision test generation failed',
    }), { status: 500 })
  }
}
