/**
 * Blueprint API Route
 * 
 * Step 3: Generates Being/Doing/Receiving loops for a category
 * 
 * POST /api/viva/blueprint
 * Body: { category, categoryName, currentState, idealState }
 * Returns: { loops: [{being, doing, receiving, essence}], summary }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { buildBlueprintPrompt } from '@/lib/viva/prompts'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { getAIToolConfigLegacy, buildOpenAIParams } from '@/lib/ai/database-config'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      category,
      categoryName,
      currentState,
      idealState
    } = body

    // Validate required fields
    if (!category || !categoryName) {
      return NextResponse.json(
        { error: 'Missing required fields: category, categoryName' },
        { status: 400 }
      )
    }

    // Get AI configuration from database (admin-configured)
    const aiConfig = await getAIToolConfigLegacy('BLUEPRINT_GENERATION')
    
    console.log('[Blueprint] Using model:', {
      model: aiConfig.model_name,
      maxTokens: aiConfig.max_tokens,
      temperature: aiConfig.temperature,
      isReasoningModel: aiConfig.is_reasoning_model,
      tokenMultiplier: aiConfig.token_multiplier
    })

    // Parse idealState if it's JSON (legacy format from old imagination flow)
    let idealStateText = idealState || ''
    if (idealState) {
      try {
        const parsed = JSON.parse(idealState)
        if (typeof parsed === 'object' && parsed !== null) {
          // Convert JSON answers object to text (legacy format)
          idealStateText = Object.values(parsed)
            .filter((a: any) => a && String(a).trim())
            .join('\n\n')
        }
      } catch {
        // Not JSON, use as-is (current free-flow text format)
        idealStateText = idealState
      }
    }

    // Build the blueprint prompt
    const prompt = buildBlueprintPrompt(
      category,
      categoryName,
      currentState || '',
      idealStateText
    )

    console.log('[Blueprint] Generating Being/Doing/Receiving loops for category:', category)

    // Call OpenAI with database-driven config
    const startTime = Date.now()
    const openaiParams = buildOpenAIParams(
      aiConfig,
      [
        {
          role: 'system',
          content: aiConfig.system_prompt || 'You are VIVA, helping members create their Being/Doing/Receiving blueprint.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    )
    
    const completion = await openai.chat.completions.create(openaiParams)

    const responseTime = Date.now() - startTime
    const message = completion.choices[0]?.message
    
    // For o1 models, content might be in a different field
    const result = message?.content || (message as any)?.reasoning_content

    if (!result) {
      console.error('[Blueprint] Empty response from AI:', {
        model: aiConfig.model_name,
        message: message,
        finishReason: completion.choices[0]?.finish_reason,
        usage: completion.usage
      })
      throw new Error(`No response from AI (model: ${aiConfig.model_name}, finish_reason: ${completion.choices[0]?.finish_reason || 'unknown'})`)
    }

    console.log('[Blueprint] Received response:', {
      model: aiConfig.model_name,
      responseLength: result.length,
      responseTimeMs: responseTime,
      finishReason: completion.choices[0]?.finish_reason
    })

    // Parse JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(result)
    } catch (parseError) {
      console.error('[Blueprint] Failed to parse AI response:', result)
      throw new Error('Invalid JSON response from AI')
    }

    // Track token usage
    await trackTokenUsage({
      user_id: user.id,
      action_type: 'blueprint_generation',
      model_used: aiConfig.model_name,
      tokens_used: completion.usage?.total_tokens || 0,
      input_tokens: completion.usage?.prompt_tokens || 0,
      output_tokens: completion.usage?.completion_tokens || 0,
      actual_cost_cents: 0,
      // OpenAI reconciliation fields
      openai_request_id: completion.id,
      openai_created: completion.created,
      system_fingerprint: completion.system_fingerprint,
      success: true,
      metadata: {
        tool_key: 'blueprint_generation',
        category,
        categoryName,
        loopCount: parsedResponse.loops?.length || 0,
        responseTimeMs: responseTime,
        reasoningModel: aiConfig.is_reasoning_model
      }
    })

    // Save blueprint to vision_new_category_state table
    const { error: dbError } = await supabase
      .from('vision_new_category_state')
      .upsert({
        user_id: user.id,
        category,
        blueprint_data: parsedResponse
      }, {
        onConflict: 'user_id,category'
      })

    if (dbError) {
      console.error('[Blueprint] Failed to save to database:', dbError)
      // Don't fail the request, just log the error
    }

    console.log('[Blueprint] Successfully generated', parsedResponse.loops?.length || 0, 'loops')

    return NextResponse.json({
      success: true,
      blueprint: parsedResponse
    })

  } catch (error: any) {
    console.error('[Blueprint] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate blueprint',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/viva/blueprint?category=<category>
 * Retrieves stored blueprint for a category
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get category from query params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (!category) {
      return NextResponse.json(
        { error: 'Missing required parameter: category' },
        { status: 400 }
      )
    }

    // Fetch blueprint from database
    const { data, error } = await supabase
      .from('vision_new_category_state')
      .select('blueprint_data')
      .eq('user_id', user.id)
      .eq('category', category)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }

    return NextResponse.json({
      success: true,
      blueprint: data?.blueprint_data || { loops: [], summary: '' }
    })

  } catch (error: any) {
    console.error('[Blueprint GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve blueprint',
        details: error.message
      },
      { status: 500 }
    )
  }
}

