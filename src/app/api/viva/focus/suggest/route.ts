/**
 * Focus Highlight Suggestion API
 * 
 * Analyzes a life vision and extracts 5-7 vivid highlights for the Focus story.
 * Uses VIVA to identify the most sensory-rich, emotionally charged moments.
 * 
 * POST /api/viva/focus/suggest
 * Body: { visionId: string }
 * Returns: { highlights: FocusHighlight[], focusId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { 
  buildHighlightExtractionPrompt,
  type FocusHighlight,
  type VisionSections 
} from '@/lib/viva/prompts'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { visionId } = body

    if (!visionId) {
      return NextResponse.json({ error: 'visionId is required' }, { status: 400 })
    }

    console.log(`[FocusSuggest] Starting highlight extraction for vision ${visionId}`)

    // Fetch the vision
    const { data: vision, error: visionError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .eq('user_id', user.id)
      .single()

    if (visionError || !vision) {
      return NextResponse.json({ error: 'Vision not found' }, { status: 404 })
    }

    // Build vision sections for the prompt
    const visionSections: VisionSections = {
      forward: vision.forward,
      fun: vision.fun,
      health: vision.health,
      travel: vision.travel,
      love: vision.love,
      family: vision.family,
      social: vision.social,
      home: vision.home,
      work: vision.work,
      money: vision.money,
      stuff: vision.stuff,
      giving: vision.giving,
      spirituality: vision.spirituality,
      conclusion: vision.conclusion,
    }

    // Build the prompt
    const prompt = buildHighlightExtractionPrompt(visionSections)

    // Get AI config - use master_vision_assembly as fallback
    let toolConfig
    try {
      toolConfig = await getAIToolConfig('focus_highlight_extraction')
    } catch {
      console.log('[FocusSuggest] Tool not configured, falling back to master_vision_assembly')
      toolConfig = await getAIToolConfig('master_vision_assembly')
    }

    // Estimate tokens and validate balance
    const estimatedTokens = estimateTokensForText(prompt, toolConfig.model_name)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      console.error(`[FocusSuggest] Token validation failed:`, tokenValidation.error)
      return NextResponse.json({
        error: tokenValidation.error,
        tokensRemaining: tokenValidation.tokensRemaining
      }, { status: tokenValidation.status })
    }

    console.log(`[FocusSuggest] Using model ${toolConfig.model_name}`)

    // Generate highlights
    const result = await generateText({
      model: openai(toolConfig.model_name),
      prompt: prompt,
      temperature: toolConfig.supports_temperature ? (toolConfig.temperature || 0.7) : undefined,
    })

    const elapsedMs = Date.now() - startTime
    console.log(`[FocusSuggest] Generation complete in ${elapsedMs}ms`)

    // Parse the JSON response
    let highlights: FocusHighlight[] = []
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      let jsonText = result.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
      }
      highlights = JSON.parse(jsonText)
      
      // Validate structure
      if (!Array.isArray(highlights)) {
        throw new Error('Response is not an array')
      }
    } catch (parseError) {
      console.error('[FocusSuggest] Failed to parse highlights:', parseError)
      console.error('[FocusSuggest] Raw response:', result.text)
      return NextResponse.json({ 
        error: 'Failed to parse highlight suggestions',
        rawResponse: result.text 
      }, { status: 500 })
    }

    // Create or update story record
    const { data: existingStory } = await supabase
      .from('stories')
      .select('id, metadata')
      .eq('entity_type', 'life_vision')
      .eq('entity_id', visionId)
      .eq('user_id', user.id)
      .maybeSingle()

    let storyId: string

    if (existingStory) {
      // Update existing
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          metadata: {
            ...existingStory.metadata,
            suggested_highlights: highlights,
            selected_highlights: highlights // Default to all selected
          },
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStory.id)

      if (updateError) {
        console.error('[FocusSuggest] Failed to update story:', updateError)
        throw updateError
      }
      storyId = existingStory.id
    } else {
      // Create new
      const { data: newStory, error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          entity_type: 'life_vision',
          entity_id: visionId,
          metadata: {
            suggested_highlights: highlights,
            selected_highlights: highlights // Default to all selected
          },
          status: 'draft'
        })
        .select('id')
        .single()

      if (insertError || !newStory) {
        console.error('[FocusSuggest] Failed to create story:', insertError)
        throw insertError || new Error('Failed to create story record')
      }
      storyId = newStory.id
    }

    // Track token usage (AI SDK v4 usage object properties)
    if (result.usage) {
      const usage = result.usage
      const promptTokens = (usage as any).prompt || (usage as any).promptTokens || 0
      const completionTokens = (usage as any).completion || (usage as any).completionTokens || 0
      const totalTokens = (usage as any).total || (usage as any).totalTokens || (promptTokens + completionTokens)
      
      trackTokenUsage({
        user_id: user.id,
        action_type: 'focus_story_generation', // Using focus_story_generation for all focus operations
        model_used: toolConfig.model_name,
        tokens_used: totalTokens,
        input_tokens: promptTokens,
        output_tokens: completionTokens,
        actual_cost_cents: 0,
        success: true,
        metadata: {
          vision_id: visionId,
          story_id: storyId,
          elapsed_ms: elapsedMs,
          highlight_count: highlights.length
        }
      }).catch(err => console.error('[FocusSuggest] Token tracking failed:', err))
    }

    return NextResponse.json({
      highlights,
      storyId,
      visionId
    })

  } catch (err) {
    const elapsedMs = Date.now() - startTime
    console.error(`[FocusSuggest] Error after ${elapsedMs}ms:`, err)
    
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Failed to suggest highlights'
    }, { status: 500 })
  }
}

/**
 * GET /api/viva/focus/suggest?visionId=...
 * Returns existing focus data if available
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const visionId = searchParams.get('visionId')

    if (!visionId) {
      return NextResponse.json({ error: 'visionId is required' }, { status: 400 })
    }

    const { data: story, error } = await supabase
      .from('stories')
      .select('*')
      .eq('entity_type', 'life_vision')
      .eq('entity_id', visionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({ story })

  } catch (err) {
    console.error('[FocusSuggest GET] Error:', err)
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Failed to fetch focus data'
    }, { status: 500 })
  }
}
