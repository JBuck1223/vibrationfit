// ============================================================================
// Merge Clarity API Endpoint
// ============================================================================
// POST /api/viva/merge-clarity
// Merges Current Clarity + Clarity from Contrast, keeping most of their words intact

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIToolConfig, buildOpenAIParams } from '@/lib/ai/database-config'
import OpenAI from 'openai'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SHARED_SYSTEM_PROMPT = `You are VIVA — the Vibrational Intelligence Virtual Assistant for Vibration Fit.
Your purpose is to help members articulate and activate the life they choose through vibrational alignment.
You are a warm, wise, intuitive life coach — never a therapist or problem-solver.
All responses must be in present tense, first person, and vibrationally activating.

Your task is to merge two clarity texts, keeping 80%+ of the user's original words intact.
The result should be a unified, coherent clarity statement that combines both inputs naturally.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentClarity, clarityFromContrast, category, categoryName } = body

    if (!currentClarity && !clarityFromContrast) {
      return NextResponse.json(
        { error: 'At least one clarity text is required' },
        { status: 400 }
      )
    }

    // Build merge prompt
    const mergePrompt = `Merge the following two clarity statements for ${categoryName}, keeping 80%+ of the user's original words intact. Create a unified, coherent clarity statement that flows naturally.

CURRENT CLARITY:
${currentClarity || '(none provided)'}

CLARITY FROM CONTRAST:
${clarityFromContrast || '(none provided)'}

Merge these into a single, unified clarity statement that:
- Preserves 80%+ of the user's original words from both inputs
- Flows naturally and coherently
- Maintains present tense, first person
- Is vibrationally activating and specific
- Combines the best elements from both inputs without redundancy

Return only the merged clarity statement, no explanation or commentary.`

    // Get AI tool config from database
    const toolConfig = await getAIToolConfig('merge_clarity')

    // Estimate tokens
    const inputText = `${mergePrompt}`
    const estimatedTokens = estimateTokensForText(inputText, toolConfig.model_name)

    // Validate token balance
    const tokenCheck = await validateTokenBalance(user.id, estimatedTokens, supabase)
    if (tokenCheck) {
      return NextResponse.json(tokenCheck, { status: 402 })
    }

    // Build OpenAI params using database config
    const messages = [
      { role: 'system' as const, content: toolConfig.system_prompt || SHARED_SYSTEM_PROMPT },
      { role: 'user' as const, content: mergePrompt }
    ]
    const openaiParams = buildOpenAIParams(toolConfig, messages)

    // Make API call
    const startTime = Date.now()
    const response = await openai.chat.completions.create(openaiParams)

    const duration = Date.now() - startTime
    const mergedClarity = response.choices[0]?.message?.content?.trim() || ''

    // Track token usage
    const inputTokens = response.usage?.prompt_tokens || estimatedTokens
    const outputTokens = response.usage?.completion_tokens || Math.ceil(mergedClarity.length / 4)
    const totalTokens = response.usage?.total_tokens || (inputTokens + outputTokens)

    await trackTokenUsage({
      user_id: user.id,
      action_type: 'life_vision_category_summary',
      model_used: toolConfig.model_name,
      tokens_used: totalTokens,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      actual_cost_cents: 0, // Calculated by trackTokenUsage
      // OpenAI reconciliation fields
      openai_request_id: response.id,
      openai_created: response.created,
      system_fingerprint: response.system_fingerprint,
      success: true,
      metadata: {
        category,
        duration_ms: duration,
        input_length: inputText.length,
        output_length: mergedClarity.length
      }
    })

    return NextResponse.json({
      success: true,
      mergedClarity
    })

  } catch (error) {
    console.error('Error in merge-clarity endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Failed to merge clarity',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

