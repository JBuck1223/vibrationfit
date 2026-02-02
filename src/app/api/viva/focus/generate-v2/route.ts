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
import { openai } from '@ai-sdk/openai'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

interface CategoryContent {
  visionText: string
  focusNotes: string
}

const FOCUS_STORY_SYSTEM_PROMPT = `You are VIVA — the Vibrationally Intelligent Virtual Assistant for VibrationFit.

You are crafting an immersive day-in-the-life narrative that brings someone's life vision to life.
This story will be listened to as a 5-7 minute audio experience (750-1000 words).

NARRATIVE STYLE:
- First person, present tense throughout
- Sensory-rich and cinematic
- Flowing transitions between moments
- Emotionally activating without being preachy
- Natural rhythm suitable for audio listening

STORY STRUCTURE:
The day flows naturally from morning awakening through evening wind-down:

MORNING (dawn to mid-morning):
- Waking, the quality of light, first sensations
- Morning rituals, energy, intention

MIDDAY (late morning to early afternoon):
- Active engagement, work or play
- Connections, conversations, flow

AFTERNOON (mid to late afternoon):
- Continued experiences, transitions
- Energy of accomplishment or leisure

EVENING (sunset and beyond):
- Winding down, reflection
- Gratitude, presence, peace

WRITING RULES:
1. Each moment should SHOW, not tell ("I feel the warm sun on my face" not "I am grateful for the sun")
2. Transitions should be smooth, not jarring ("Later..." or "As the afternoon unfolds...")
3. Include micro-moments of sensation (a sip of coffee, a deep breath, a smile)
4. Vary sentence length - some short and punchy, some flowing and descriptive
5. End with a sense of completeness and contentment

AVOID:
- "I am so grateful for..." or "I feel blessed..."
- Listing activities without sensory grounding
- Rushing through moments
- Generic or vague descriptions
- Coaching or advice language
- Starting paragraphs with "I wake up" or similar cliches

FOCUS NOTES:
When the user provides "focus notes" for a category, make sure to emphasize and expand on those specific details in the narrative. These are the moments they most want to experience.`

function buildFocusStoryPrompt(
  categoryData: Record<string, CategoryContent>,
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'
  
  // Build category sections
  const categorySections = Object.entries(categoryData)
    .filter(([_, content]) => content.visionText.trim())
    .map(([category, content]) => {
      let section = `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n`
      section += `Vision:\n${content.visionText}\n`
      if (content.focusNotes.trim()) {
        section += `\nKey Details to Emphasize:\n${content.focusNotes}\n`
      }
      return section
    })
    .join('\n---\n\n')

  return `PERSPECTIVE: ${pronoun}

SELECTED LIFE AREAS AND CONTENT:

${categorySections}

---

TASK:
Create a flowing day-in-the-life narrative (750-1000 words) that weaves these life areas 
into an immersive story. The narrative should:

1. Flow naturally from morning to evening
2. Incorporate content from EACH selected life area
3. ESPECIALLY emphasize any "Key Details to Emphasize" the user provided
4. Create smooth transitions between different life areas
5. Feel like listening to someone share their ideal day
6. End with a sense of peaceful completion

IMPORTANT:
- Add sensory details (sounds, textures, temperatures, smells)
- Create bridging moments between life areas
- The tone should be calm, present, and embodied - not excited or performative
- Every life area MUST appear in the story, woven naturally into the day

TARGET LENGTH: 750-1000 words (this produces 5-7 minutes of audio)

OUTPUT:
Return ONLY the narrative text. No titles, headers, or formatting.
Write in flowing paragraphs suitable for audio narration.`
}

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

    // Build the prompt
    const prompt = buildFocusStoryPrompt(categoryData, perspective)

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

    console.log(`[FocusGenerateV2] Using model ${toolConfig.model_name}`)

    // Stream the response
    const result = streamText({
      model: openai(toolConfig.model_name),
      system: FOCUS_STORY_SYSTEM_PROMPT,
      prompt: prompt,
      temperature: toolConfig.supports_temperature ? (toolConfig.temperature || 0.8) : undefined,
      maxTokens: 1500,
      
      async onFinish({ text, usage }) {
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

        // Track token usage
        if (usage) {
          trackTokenUsage({
            user_id: user.id,
            action_type: 'focus_story_generation',
            model_used: toolConfig.model_name,
            tokens_used: usage.totalTokens || 0,
            input_tokens: usage.promptTokens || 0,
            output_tokens: usage.completionTokens || 0,
            actual_cost_cents: 0,
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

    // Return streaming response
    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
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
