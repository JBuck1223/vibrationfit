// ============================================================================
// Flip the Frequency API Endpoint
// ============================================================================
// POST /api/viva/flip-frequency
// Converts contrast/lack language into clarity seeds

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { flipFrequency, FlipFrequencyParams, FlipMode } from '@/lib/viva/flip-frequency'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText, getDefaultTokenEstimate } from '@/lib/tokens/tracking'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Model mapping for token tracking
const MODEL_MAP: Record<FlipMode, string> = {
  'flip': 'gpt-4o-mini',
  'flip+enrich': 'gpt-4o-mini',
  'batch': 'gpt-4o-mini',
  'text': 'gpt-4o-mini'
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const {
      mode = 'flip',
      n = 1,
      tone_hint,
      keep_words = [],
      ban_words = [],
      debug = false,
      input,
      lines,
      category,
      vision_id,
      scene_context,
      save_to_db = true
    } = body
    
    // Validate input
    if (mode === 'batch') {
      if (!lines || !Array.isArray(lines) || lines.length === 0) {
        return NextResponse.json(
          { error: 'Batch mode requires lines array with at least one item' },
          { status: 400 }
        )
      }
    } else {
      if (!input || typeof input !== 'string' || input.trim().length === 0) {
        return NextResponse.json(
          { error: 'Single flip mode requires input string' },
          { status: 400 }
        )
      }
    }
    
    // Estimate tokens and validate token balance before processing
    const inputTextForValidation = input || lines?.join('\n') || ''
    const estimatedTokens = estimateTokensForText(inputTextForValidation, MODEL_MAP[mode as FlipMode])
    
    const tokenCheck = await validateTokenBalance(user.id, estimatedTokens, supabase)
    
    if (tokenCheck) {
      return NextResponse.json(tokenCheck, { status: 402 })
    }
    
    // Build params for flip function
    const params: FlipFrequencyParams = {
      mode: mode as FlipMode,
      n: Math.min(Math.max(1, n), 3), // Clamp between 1-3
      tone_hint,
      keep_words,
      ban_words,
      debug,
      input,
      lines
    }
    
    // Call flip frequency
    const startTime = Date.now()
    const result = await flipFrequency(params)
    const duration = Date.now() - startTime
    
    // Handle text mode response
    if (mode === 'text' && typeof result === 'string') {
      // Estimate tokens for text response
      const textModeTokens = Math.ceil(result.length / 4) // Rough estimate
      
      // Track token usage
      await trackTokenUsage({
        user_id: user.id,
        action_type: 'frequency_flip',
        model_used: MODEL_MAP[mode as FlipMode],
        tokens_used: textModeTokens,
        input_tokens: textModeTokens * 0.7, // Rough split
        output_tokens: textModeTokens * 0.3,
        cost_estimate: 0, // Calculated by trackTokenUsage
        success: true,
        metadata: {
          mode,
          duration_ms: duration,
          input_length: input?.length || 0
        }
      })
      
      return NextResponse.json({
        mode: 'text',
        clarity_seed: result
      })
    }
    
    // Handle JSON response
    const jsonResult = result as {
      mode: FlipMode
      unchanged: boolean
      items: Array<{
        input: string
        clarity_seed: string
        essence?: string
        sensory_anchor?: string
        embodiment_line?: string
        surrender_line?: string
        voice_notes?: string[]
        unchanged?: boolean
      }>
    }
    
    // Estimate tokens (rough calculation)
    const inputText = input || lines?.join('\n') || ''
    const outputText = jsonResult.items.map(item => 
      item.clarity_seed + (item.essence || '') + (item.sensory_anchor || '')
    ).join('\n')
    
    const estimatedInputTokens = Math.ceil(inputText.length / 4)
    const estimatedOutputTokens = Math.ceil(outputText.length / 4)
    const totalTokens = estimatedInputTokens + estimatedOutputTokens
    
    // Track token usage
    await trackTokenUsage({
      user_id: user.id,
      action_type: 'frequency_flip',
      model_used: MODEL_MAP[mode as FlipMode],
      tokens_used: totalTokens,
      input_tokens: estimatedInputTokens,
      output_tokens: estimatedOutputTokens,
      cost_estimate: 0, // Calculated by trackTokenUsage
      success: true,
      metadata: {
        mode,
        duration_ms: duration,
        items_count: jsonResult.items.length,
        input_length: inputText.length,
        output_length: outputText.length
      }
    })
    
    // Save to database if requested
    if (save_to_db && jsonResult.items.length > 0) {
      const seedsToInsert = jsonResult.items.map(item => ({
        user_id: user.id,
        input_text: item.input,
        clarity_seed: item.clarity_seed,
        essence: item.essence || null,
        sensory_anchor: item.sensory_anchor || null,
        embodiment_line: item.embodiment_line || null,
        surrender_line: item.surrender_line || null,
        category: category || null,
        vision_id: vision_id || null,
        scene_context: scene_context || null,
        mode: jsonResult.mode,
        unchanged: item.unchanged || jsonResult.unchanged || false,
        voice_notes: item.voice_notes || []
      }))
      
      const { error: insertError } = await supabase
        .from('frequency_flip')
        .insert(seedsToInsert)
      
      if (insertError) {
        console.error('Error saving clarity seeds to database:', insertError)
        // Don't fail the request if save fails
      }
    }
    
    // Return response
    return NextResponse.json({
      success: true,
      mode: jsonResult.mode,
      unchanged: jsonResult.unchanged,
      items: jsonResult.items,
      saved_to_db: save_to_db
    })
    
  } catch (error) {
    console.error('Error in flip-frequency endpoint:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to flip frequency',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

