/**
 * Universal Story Generation API
 *
 * Generates a streaming day-in-the-life narrative for any entity type.
 * Routes to the correct prompt builder based on entityType.
 *
 * POST /api/stories/generate
 * Body: { entityType, entityId?, title?, content?, focusNotes?, selectedCategories?, categoryData? }
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
  buildVisionBoardStoryPrompt,
  buildJournalStoryPrompt,
  buildCustomStoryPrompt,
  type CategoryContent,
} from '@/lib/viva/prompts/focus-story-prompt'
import type { StoryEntityType } from '@/lib/stories/types'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

interface GenerateBody {
  entityType: StoryEntityType
  entityId?: string
  title?: string
  content?: string
  focusNotes?: string
  selectedCategories?: string[]
  categoryData?: Record<string, CategoryContent>
}

async function buildPromptForEntity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  body: GenerateBody,
  perspective: 'singular' | 'plural'
): Promise<{ prompt: string; entityId: string; title: string | null }> {
  const { entityType, entityId, focusNotes } = body

  switch (entityType) {
    case 'life_vision': {
      if (!entityId || !body.selectedCategories?.length || !body.categoryData) {
        throw new Error('life_vision requires entityId, selectedCategories, and categoryData')
      }
      const prompt = buildFocusStoryFromCategoriesPrompt(body.categoryData, perspective)
      const categoryLabels = body.selectedCategories.map(
        c => c.charAt(0).toUpperCase() + c.slice(1)
      )
      const generatedTitle = `Life Vision Focus – ${categoryLabels.join(' | ')}`
      return { prompt, entityId, title: generatedTitle }
    }

    case 'vision_board_item': {
      if (!entityId) throw new Error('vision_board_item requires entityId')
      const { data: item, error } = await supabase
        .from('vision_board_items')
        .select('id, name, description, categories')
        .eq('id', entityId)
        .eq('user_id', userId)
        .single()
      if (error || !item) throw new Error('Vision board item not found')

      const prompt = buildVisionBoardStoryPrompt(
        { name: item.name, description: item.description, categories: item.categories },
        focusNotes,
        perspective
      )
      return { prompt, entityId, title: item.name }
    }

    case 'journal_entry': {
      if (!entityId) throw new Error('journal_entry requires entityId')
      const { data: entry, error } = await supabase
        .from('journal_entries')
        .select('id, title, content, created_at, categories')
        .eq('id', entityId)
        .eq('user_id', userId)
        .single()
      if (error || !entry) throw new Error('Journal entry not found')

      const prompt = buildJournalStoryPrompt(
        {
          title: entry.title,
          content: entry.content,
          date: new Date(entry.created_at).toLocaleDateString(),
          categories: entry.categories,
        },
        focusNotes,
        perspective
      )
      return { prompt, entityId, title: entry.title || 'Journal Story' }
    }

    case 'custom': {
      if (!body.content) throw new Error('custom stories require content')
      const prompt = buildCustomStoryPrompt(body.content, body.title, perspective)
      const customId = entityId || crypto.randomUUID()
      return { prompt, entityId: customId, title: body.title || 'Custom Story' }
    }

    default:
      throw new Error(`Unsupported entity type: ${entityType}`)
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body: GenerateBody = await request.json()
    const { entityType } = body

    if (!entityType) {
      return new Response(JSON.stringify({ error: 'entityType is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`[StoryGenerate] Starting for entityType=${entityType}, entityId=${body.entityId || 'none'}`)

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('perspective')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    const perspective = (profile?.perspective as 'singular' | 'plural') || 'singular'

    const { prompt, entityId, title } = await buildPromptForEntity(supabase, user.id, body, perspective)

    let toolConfig
    try {
      toolConfig = await getAIToolConfig('focus_story_generation')
    } catch {
      console.log('[StoryGenerate] Tool not configured, falling back to master_vision_assembly')
      toolConfig = await getAIToolConfig('master_vision_assembly')
    }

    const estimatedTokens = estimateTokensForText(prompt, toolConfig.model_name)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      return new Response(JSON.stringify({
        error: tokenValidation.error,
        tokensRemaining: tokenValidation.tokensRemaining,
      }), { status: tokenValidation.status, headers: { 'Content-Type': 'application/json' } })
    }

    console.log(`[StoryGenerate] Using model ${VISION_MODEL} (Gemini via gateway)`)

    const result = streamText({
      model: gateway(VISION_MODEL),
      system: FOCUS_STORY_SYSTEM_PROMPT,
      prompt,
      temperature: toolConfig.supports_temperature ? (toolConfig.temperature || 0.8) : undefined,

      async onFinish({ text, usage, response }) {
        const elapsedMs = Date.now() - startTime
        const wordCount = text?.split(/\s+/).length || 0
        console.log(`[StoryGenerate] Completed in ${elapsedMs}ms, ${wordCount} words, type=${entityType}`)

        const { data: existingStory } = await supabase
          .from('stories')
          .select('id, generation_count, metadata')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .eq('user_id', user.id)
          .maybeSingle()

        const metadata = {
          ...(existingStory?.metadata || {}),
          ...(body.selectedCategories ? { selected_categories: body.selectedCategories } : {}),
          ...(body.categoryData ? { category_data: body.categoryData } : {}),
          ...(body.focusNotes ? { focus_notes: body.focusNotes } : {}),
          prompt_version: 'universal-v1',
          model_used: response?.modelId || VISION_MODEL,
        }

        if (existingStory) {
          await supabase
            .from('stories')
            .update({
              title,
              metadata,
              content: text,
              word_count: wordCount,
              source: 'ai_generated',
              status: 'completed',
              generation_count: (existingStory.generation_count || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingStory.id)
        } else {
          await supabase
            .from('stories')
            .insert({
              user_id: user.id,
              entity_type: entityType,
              entity_id: entityId,
              title,
              metadata,
              content: text,
              word_count: wordCount,
              source: 'ai_generated',
              status: 'completed',
              generation_count: 1,
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
              entity_type: entityType,
              entity_id: entityId,
              word_count: wordCount,
              elapsed_ms: elapsedMs,
            },
          }).catch(err => console.error('[StoryGenerate] Token tracking failed:', err))
        }
      },
    })

    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Story-Entity-Type': entityType,
        'X-Story-Entity-Id': entityId || '',
        'Cache-Control': 'no-cache, no-transform',
      },
    })
  } catch (err) {
    const elapsedMs = Date.now() - startTime
    console.error(`[StoryGenerate] Error after ${elapsedMs}ms:`, err)

    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : 'Failed to generate story',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
