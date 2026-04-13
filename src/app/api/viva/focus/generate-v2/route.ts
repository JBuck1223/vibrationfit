/**
 * Focus Story Generation API v2
 * 
 * Generates a streaming day-in-the-life narrative from selected categories and focus notes.
 * Returns a streaming text response.
 * 
 * POST /api/viva/focus/generate-v2
 * Body: { visionId, selectedCategories, categoryData }
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamText } from 'ai'
import { gateway, VISION_MODEL } from '@/lib/ai/gateway'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import {
  FOCUS_STORY_SYSTEM_PROMPT,
  buildFocusStoryFromCategoriesPrompt,
  type CategoryContent,
} from '@/lib/viva/prompts/focus-story-prompt'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    const { visionId, selectedCategories, categoryData } = body as {
      visionId: string
      selectedCategories: string[]
      categoryData: Record<string, CategoryContent>
    }

    if (!visionId || !selectedCategories || selectedCategories.length === 0) {
      return new Response(JSON.stringify({ error: 'visionId and selectedCategories are required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`[FocusGenerateV2] Starting for vision ${visionId}, categories: ${selectedCategories.join(', ')}`)

    // Get user profile for perspective
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('perspective')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    const perspective = (profile?.perspective as 'singular' | 'plural') || 'singular'

    // Build the prompt using centralized prompt system
    const prompt = buildFocusStoryFromCategoriesPrompt(categoryData, perspective)

    // Get AI config
    let toolConfig
    try {
      toolConfig = await getAIToolConfig('focus_story_generation')
    } catch {
      console.log('[FocusGenerateV2] Tool not configured, falling back to master_vision_assembly')
      toolConfig = await getAIToolConfig('master_vision_assembly')
    }

    // Estimate tokens and validate balance
    const estimatedTokens = estimateTokensForText(prompt, toolConfig.model_name)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      return new Response(JSON.stringify({
        error: tokenValidation.error,
        tokensRemaining: tokenValidation.tokensRemaining
      }), { status: tokenValidation.status, headers: { 'Content-Type': 'application/json' } })
    }

    console.log(`[FocusGenerateV2] Using model ${VISION_MODEL} (Gemini via gateway)`)

    // Stream the response using Gemini via Vercel AI Gateway
    const result = streamText({
      model: gateway(VISION_MODEL),
      system: FOCUS_STORY_SYSTEM_PROMPT,
      prompt: prompt,
      temperature: toolConfig.supports_temperature ? (toolConfig.temperature || 0.8) : undefined,
      
      async onFinish({ text, usage, response }) {
        const elapsedMs = Date.now() - startTime
        const wordCount = text?.split(/\s+/).length || 0
        console.log(`[FocusGenerateV2] Completed in ${elapsedMs}ms, ${wordCount} words`)

        // Create or update story record
        const { data: existingStory } = await supabase
          .from('stories')
          .select('id, generation_count, metadata')
          .eq('entity_type', 'life_vision')
          .eq('entity_id', visionId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (existingStory) {
          await supabase
            .from('stories')
            .update({
              metadata: {
                ...existingStory.metadata,
                selected_categories: selectedCategories,
                category_data: categoryData
              },
              content: text,
              word_count: wordCount,
              status: 'completed',
              generation_count: (existingStory.generation_count || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingStory.id)
        } else {
          await supabase
            .from('stories')
            .insert({
              user_id: user.id,
              entity_type: 'life_vision',
              entity_id: visionId,
              metadata: {
                selected_categories: selectedCategories,
                category_data: categoryData
              },
              content: text,
              word_count: wordCount,
              status: 'completed',
              generation_count: 1
            })
        }

        if (usage) {
          trackTokenUsage({
            user_id: user.id,
            action_type: 'focus_story_generation',
            model_used: response?.modelId || VISION_MODEL,
            tokens_used: usage.totalTokens || 0,
            input_tokens: usage.inputTokens || 0,
            output_tokens: usage.outputTokens || 0,
            actual_cost_cents: 0,
            openai_request_id: response?.id,
            success: true,
            metadata: {
              vision_id: visionId,
              categories: selectedCategories,
              word_count: wordCount,
              elapsed_ms: elapsedMs
            }
          }).catch(err => console.error('[FocusGenerateV2] Token tracking failed:', err))
        }
      }
    })

    return result.toTextStreamResponse({
      headers: {
        'Cache-Control': 'no-cache, no-transform',
      }
    })

  } catch (err) {
    const elapsedMs = Date.now() - startTime
    console.error(`[FocusGenerateV2] Error after ${elapsedMs}ms:`, err)
    
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : 'Failed to generate focus story'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
