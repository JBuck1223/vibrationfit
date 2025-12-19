// app/api/life-vision/master/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIToolConfig, buildOpenAIParams } from '@/lib/ai/database-config'
import OpenAI from 'openai'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { buildMasterVisionPrompt, MASTER_VISION_SHARED_SYSTEM_PROMPT } from '@/lib/viva/prompts'
// V5: Import bookend templates for forward/conclusion
import { getBookendTemplate, determineWooLevel, type Perspective } from '@/lib/viva/bookend-templates'
import { assessmentToVisionKey } from '@/lib/design-system/vision-categories'

// Allow longer execution time for master vision generation (up to 15 minutes)
export const maxDuration = 900 // 15 minutes in seconds
export const runtime = 'nodejs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * ============================
 *   Route Handler
 * ============================
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now() // Track timing for the entire request
  
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      categorySummaries,         // Step 1: Clarity (AI summary)
      categoryIdealStates = {},  // Step 2: Imagination (USER'S WORDS!)
      categoryBlueprints = {},   // Step 3: Being/Doing/Receiving loops
      categoryScenes = {},       // Step 4: Visualization scenes
      categoryTranscripts = {},  // Legacy: Original transcripts
      profile, 
      assessment, 
      activeVision = null 
    } = await request.json()

    if (!categorySummaries || Object.keys(categorySummaries).length === 0) {
      return NextResponse.json({ error: 'Category summaries are required' }, { status: 400 })
    }

    // Get admin-configured AI tool config from database
    const toolConfig = await getAIToolConfig('master_vision_assembly')
    
    console.log('[Master Vision] Starting assembly with config:', {
      model: toolConfig.model_name,
      max_tokens: toolConfig.max_tokens,
      token_multiplier: toolConfig.token_multiplier,
      actual_max_tokens: toolConfig.max_tokens * toolConfig.token_multiplier
    })

    // Build the prompt with ALL rich data
    const prompt = buildMasterVisionPrompt(
      categorySummaries,
      categoryIdealStates,
      categoryBlueprints,
      categoryScenes,
      categoryTranscripts,
      profile || {},
      assessment || {},
      activeVision || null
    )

    // Estimate tokens and validate balance
    const estimatedTokens = estimateTokensForText(prompt, toolConfig.model_name)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      return NextResponse.json(
        {
          error: tokenValidation.error,
          tokensRemaining: tokenValidation.tokensRemaining
        },
        { status: tokenValidation.status }
      )
    }

    // Build OpenAI params using database config
    const messages = [
      { role: 'system' as const, content: toolConfig.system_prompt || MASTER_VISION_SHARED_SYSTEM_PROMPT },
      { role: 'user' as const, content: prompt }
    ]
    const openaiParams = buildOpenAIParams(toolConfig, messages)

    console.log('[Master Vision] Starting OpenAI call with max_tokens:', openaiParams[toolConfig.max_tokens_param])
    console.log('[Master Vision] Prompt length:', prompt.length, 'characters')

    // Add timeout as a safety net (20 minutes - longer than maxDuration to catch edge cases)
    // This prevents truly infinite hangs, but allows plenty of time for complex generations
    const timeoutMs = 20 * 60 * 1000 // 20 minutes
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      console.error('[Master Vision] Request timeout after', timeoutMs / 1000, 'seconds')
    }, timeoutMs)

    let completion
    try {
      console.log('[Master Vision] Making OpenAI API call...')
      // Call OpenAI with abort signal for timeout
      // The OpenAI SDK should respect the abort signal
      completion = await openai.chat.completions.create(
        openaiParams,
        {
          signal: controller.signal
        } as any
      )
      
      clearTimeout(timeoutId)
      console.log('[Master Vision] OpenAI API call completed successfully')

      // V5: Get actual model used from OpenAI response (may differ from requested due to routing/fallbacks)
      const actualModelUsed = completion.model || toolConfig.model_name
      const elapsedMs = Date.now() - startTime
      console.log('[Master Vision] Requested model:', toolConfig.model_name, '| Actual model used:', actualModelUsed)
      console.log('[Master Vision] Total time elapsed:', elapsedMs, 'ms', `(${(elapsedMs / 1000).toFixed(1)}s)`)
      if (completion.usage) {
        console.log('[Master Vision] Token usage - Input:', completion.usage.prompt_tokens, '| Output:', completion.usage.completion_tokens, '| Total:', completion.usage.total_tokens)
      }

      const fullOutput = completion.choices[0]?.message?.content

      if (!fullOutput || typeof fullOutput !== 'string') {
        throw new Error('No output generated')
      }

    // DEBUG: Log output structure
    console.log('=== AI OUTPUT DEBUG ===')
    console.log('Output length:', fullOutput.length)
    console.log('Has JSON marker:', fullOutput.includes('---JSON---'))
    console.log('First 500 chars:', fullOutput.substring(0, 500))
    console.log('Last 500 chars:', fullOutput.substring(fullOutput.length - 500))

    // Parse the output - split markdown and JSON
    const jsonMarker = '---JSON---'
    const jsonIndex = fullOutput.indexOf(jsonMarker)

    let markdown = ''
    let json: any = {}

    if (jsonIndex !== -1) {
      // Has JSON marker - split markdown and JSON
      markdown = fullOutput.substring(0, jsonIndex).trim()
      const jsonString = fullOutput.substring(jsonIndex + jsonMarker.length).trim()

      console.log('Found JSON marker at index:', jsonIndex)
      console.log('JSON string length:', jsonString.length)

      try {
        json = JSON.parse(jsonString)
        console.log('Parsed JSON keys:', Object.keys(json))
      } catch (e) {
        console.error('Failed to parse JSON, extracting categories from markdown:', e)
        console.error('JSON string preview:', jsonString.substring(0, 200))
        // Fallback: extract categories from markdown
        json = extractCategoriesFromMarkdown(markdown)
      }
    } else {
      // No JSON marker - try to find JSON in the output
      const trimmedOutput = fullOutput.trim()
      
      // Try to find JSON object in the output (might be surrounded by whitespace)
      let jsonString = trimmedOutput
      
      // Look for first { and last } to extract JSON
      const firstBrace = trimmedOutput.indexOf('{')
      const lastBrace = trimmedOutput.lastIndexOf('}')
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = trimmedOutput.substring(firstBrace, lastBrace + 1)
        console.log('Found JSON boundaries, extracting JSON from position', firstBrace, 'to', lastBrace)
      }
      
      // Try to parse as JSON
      if (jsonString.startsWith('{') && jsonString.endsWith('}')) {
        console.log('Attempting to parse as JSON (length:', jsonString.length, ')')
        try {
          json = JSON.parse(jsonString)
          const keys = Object.keys(json).filter(k => k !== 'meta')
          console.log('Successfully parsed JSON with', keys.length, 'category keys:', keys)
          
          // Validate that we actually got category data
          if (keys.length === 0 || keys.length < 12) {
            console.warn('Parsed JSON but missing categories. Expected 12, got:', keys.length)
            console.warn('JSON content:', JSON.stringify(json, null, 2).substring(0, 1000))
            // Fallback to markdown extraction
            console.log('Falling back to markdown extraction due to missing categories')
            markdown = fullOutput
            json = extractCategoriesFromMarkdown(markdown)
            console.log('Extracted category keys from markdown:', Object.keys(json).filter(k => k !== 'meta'))
          } else {
            markdown = '' // No markdown, just JSON
          }
        } catch (e) {
          console.error('Failed to parse JSON:', e)
          console.error('JSON string preview (first 500 chars):', jsonString.substring(0, 500))
          console.error('JSON string preview (last 500 chars):', jsonString.substring(Math.max(0, jsonString.length - 500)))
          // Fallback: extract from markdown
          console.log('Falling back to markdown extraction')
          markdown = fullOutput
          json = extractCategoriesFromMarkdown(markdown)
          console.log('Extracted category keys from markdown:', Object.keys(json).filter(k => k !== 'meta'))
        }
      } else {
        // No JSON found - treat as markdown
        console.log('No JSON structure found, extracting from markdown')
        markdown = fullOutput
        json = extractCategoriesFromMarkdown(markdown)
        console.log('Extracted category keys:', Object.keys(json).filter(k => k !== 'meta'))
      }
    }

    // Richness metadata removed - no longer computed or stored

    // SAFETY: Save raw output to database before returning
    try {
      await supabase
        .from('life_vision_category_state')
        .upsert({
          user_id: user.id,
          category: '_master',
          master_vision_raw: fullOutput,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,category'
        })
      
      console.log('[Master Vision] Saved raw output to database for safety')
    } catch (saveError) {
      console.error('[Master Vision] Failed to save raw output:', saveError)
      // Don't fail the request if saving fails
    }

    // V5: Get user's voice profile for woo level and determine perspective
    let wooLevel: 'high' | 'medium' | 'low' = 'medium'
    let perspective: Perspective = 'singular'
    
    try {
      const { data: voiceProfile } = await supabase
        .from('voice_profiles')
        .select('woo')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (voiceProfile?.woo) {
        wooLevel = determineWooLevel(voiceProfile.woo)
      }
    } catch (e) {
      console.log('[Master Vision] No voice profile found, using default woo level')
    }

    // Get bookend templates (always use templates, AI doesn't generate forward/conclusion)
    const bookendTemplate = getBookendTemplate(wooLevel, perspective)
    const finalForward = bookendTemplate.forward
    const finalConclusion = bookendTemplate.conclusion

    // Standard activation message
    const activationMessage = `Your Life Vision is complete and ready for activation. This is your north star, your decision filter, and your reminder of what matters most. Return to it regularly to stay aligned with your most fun and satisfying life.`

    console.log('[Master Vision V5] Using bookend templates (woo:', wooLevel, 'perspective:', perspective, ')')

    // V5: Create vision_versions row directly (complete, not draft)
    // First, deactivate any existing active visions
    await supabase
      .from('vision_versions')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Insert the new vision as complete and active
    const { data: insertedVision, error: insertError } = await supabase
      .from('vision_versions')
      .insert({
        user_id: user.id,
        title: 'Life Vision',
        forward: finalForward,
        fun: json.fun || '',
        travel: json.travel || '',
        home: json.home || '',
        family: json.family || '',
        love: json.love || json[assessmentToVisionKey('romance')] || '',
        health: json.health || '',
        money: json.money || '',
        work: json.work || json[assessmentToVisionKey('business')] || '',
        social: json.social || '',
        stuff: json.stuff || json[assessmentToVisionKey('possessions')] || '',
        giving: json.giving || '',
        spirituality: json.spirituality || '',
        conclusion: finalConclusion,
        activation_message: activationMessage,
        is_draft: false,  // V5: Complete vision, not draft
        is_active: true,  // V5: This is the active vision
        richness_metadata: {
          // V5: Store actual model used from OpenAI response
          model_used: actualModelUsed,
          requested_model: toolConfig.model_name,
          openai_request_id: completion.id,
          created_at: completion.created ? new Date(completion.created * 1000).toISOString() : new Date().toISOString()
        },
        perspective: perspective
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Master Vision V5] Failed to insert vision:', insertError)
      throw new Error('Failed to save vision to database')
    }

    console.log('[Master Vision V5] Created vision_versions row:', insertedVision.id)

    // Track token usage
    if (completion.usage) {
      try {
        await trackTokenUsage({
          user_id: user.id,
          action_type: 'life_vision_master_assembly',
          model_used: actualModelUsed, // V5: Use actual model from OpenAI response
          tokens_used: completion.usage.total_tokens || 0,
          input_tokens: completion.usage.prompt_tokens || 0,
          output_tokens: completion.usage.completion_tokens || 0,
          actual_cost_cents: 0,
          // OpenAI reconciliation fields
          openai_request_id: completion.id,
          openai_created: completion.created,
          system_fingerprint: completion.system_fingerprint,
          success: true,
          metadata: {
            categories_count: Object.keys(categorySummaries).length,
            markdown_length: markdown.length,
            json_category_count: Object.keys(json).filter(k => k !== 'meta').length,
            has_profile: !!profile,
            has_assessment: !!assessment,
            vision_id: insertedVision.id, // V5: Include vision ID in metadata
          },
        })
      } catch (trackingError) {
        console.error('Failed to track token usage:', trackingError)
      }
    }

    // V5: Return vision ID along with other data for redirect
    return NextResponse.json({
      markdown,
      json,
      model: toolConfig.model_name,
      // V5: Include vision data for direct navigation
      visionId: insertedVision.id,
      vision: insertedVision
    })

    } catch (openaiError: any) {
      clearTimeout(timeoutId)
      
      // Check for timeout/abort errors
      if (openaiError.name === 'AbortError' || openaiError.message?.includes('timeout') || controller.signal.aborted) {
        console.error('[Master Vision] Request timed out after', timeoutMs / 1000, 'seconds')
        console.error('[Master Vision] Time elapsed before timeout:', Date.now() - startTime, 'ms')
        return NextResponse.json(
          { 
            error: 'Request timed out. The vision generation is taking longer than expected. This may be due to a large prompt or slow API response. Please try again or contact support.',
            timeout: true,
            elapsedMs: Date.now() - startTime
          },
          { status: 504 }
        )
      }
      
      // Check for rate limit errors
      if (openaiError.status === 429) {
        console.error('[Master Vision] Rate limit exceeded')
        return NextResponse.json(
          { error: 'OpenAI rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        )
      }
      
      // Log other OpenAI errors
      console.error('[Master Vision] OpenAI API error:', {
        name: openaiError.name,
        message: openaiError.message,
        status: openaiError.status,
        code: openaiError.code,
        elapsedMs: Date.now() - startTime
      })
      throw openaiError
    }
  } catch (err) {
    console.error('[Master Vision] Unexpected error:', err)
    console.error('[Master Vision] Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      elapsedMs: Date.now() - startTime
    })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate master vision' },
      { status: 500 }
    )
  }
}

/**
 * ============================
 *   Markdown → JSON Fallback
 * ============================
 */

function extractCategoriesFromMarkdown(markdown: string): any {
  const categories: Record<string, string> = {}

  // Split by ## headings
  const sections = markdown.split(/##\s+/)

  sections.forEach(section => {
    const lines = section.trim().split('\n')
    const rawTitle = lines[0]?.trim()
    const title = rawTitle?.toLowerCase().replace(/^the\s+/i, '')

    if (title && [
      'forward', 'fun', 'health', 'travel', 'love', 'romance',
      'family', 'social', 'home', 'work', 'business', 'money',
      'stuff', 'possessions', 'giving', 'spirituality', 'conclusion'
    ].includes(title)) {
      const content = lines.slice(1).join('\n').trim()
      // Map legacy names to canonical keys
      let key = title
      if (title === 'romance') key = 'love'
      else if (title === 'business') key = 'work'
      else if (title === 'possessions') key = 'stuff'
      categories[key] = content
    }
  })

  return {
    ...categories,
    meta: {
      model: 'unknown',
      created_at_iso: new Date().toISOString(),
      summary_style: 'present-tense vibrational activation',
      notes: 'extracted from markdown'
    }
  }
}