// ============================================================================
// Merge State API Endpoint
// ============================================================================
// POST /api/viva/merge-clarity
// Merges Current State + New State text, keeping most of their words intact

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIToolConfig, buildOpenAIParams } from '@/lib/ai/database-config'
import OpenAI from 'openai'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { buildMergeStatePrompt, MERGE_STATE_SYSTEM_PROMPT } from '@/lib/viva/prompts/merge-clarity-prompt'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    const { currentState, newStateText, category, categoryName } = body

    if (!currentState && !newStateText) {
      return NextResponse.json(
        { error: 'At least one state text is required' },
        { status: 400 }
      )
    }

    // Build merge prompt using centralized prompt builder
    const mergePrompt = buildMergeStatePrompt({
      currentState: currentState || '',
      newStateText: newStateText || '',
      category,
      categoryName
    })

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
      { role: 'system' as const, content: toolConfig.system_prompt || MERGE_STATE_SYSTEM_PROMPT },
      { role: 'user' as const, content: mergePrompt }
    ]
    const openaiParams = buildOpenAIParams(toolConfig, messages, {
      forceNoJsonMode: true // We want plain text output, not JSON
    })

    // Make API call
    const startTime = Date.now()
    const response = await openai.chat.completions.create(openaiParams)

    const duration = Date.now() - startTime
    const mergedState = response.choices[0]?.message?.content?.trim() || ''

    // Track token usage
    const inputTokens = response.usage?.prompt_tokens || estimatedTokens
    const outputTokens = response.usage?.completion_tokens || Math.ceil(mergedState.length / 4)
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
        output_length: mergedState.length
      }
    })

    return NextResponse.json({
      success: true,
      mergedState
    })

  } catch (error) {
    console.error('Error in merge-state endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Failed to merge state',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

