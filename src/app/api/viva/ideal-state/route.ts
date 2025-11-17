/**
 * Ideal State API Route
 * 
 * Step 2: Generates prompts for "Unleash Imagination" phase
 * 
 * POST /api/viva/ideal-state
 * Body: { category, categoryName, currentClarity, flippedContrast }
 * Returns: { prompts: [{title, prompt, focus}], encouragement }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { buildIdealStatePrompt } from '@/lib/viva/prompts'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { getAIModelConfig } from '@/lib/ai/config'

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
      currentClarity,
      flippedContrast
    } = body

    // Validate required fields
    if (!category || !categoryName) {
      return NextResponse.json(
        { error: 'Missing required fields: category, categoryName' },
        { status: 400 }
      )
    }

    // Get AI configuration for ideal state generation  
    // TODO: Add 'LIFE_VISION_IDEAL_STATE' config in admin panel, using VISION_GENERATION for now
    const aiConfig = getAIModelConfig('VISION_GENERATION')

    // Build the ideal state prompt
    const prompt = buildIdealStatePrompt(
      category,
      categoryName,
      currentClarity || '',
      flippedContrast || ''
    )

    console.log('[Ideal State] Generating prompts for category:', category)

    // Call OpenAI
    const startTime = Date.now()
    const completion = await openai.chat.completions.create({
      model: aiConfig.model,
      messages: [
        {
          role: 'system',
          content: aiConfig.systemPrompt || 'You are VIVA, helping members unleash their imagination about their ideal life state.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: aiConfig.temperature,
      max_tokens: aiConfig.maxTokens,
      response_format: { type: 'json_object' }
    })

    const responseTime = Date.now() - startTime
    const result = completion.choices[0]?.message?.content

    if (!result) {
      throw new Error('No response from AI')
    }

    // Parse JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(result)
      
      // Validate response structure
      if (!parsedResponse.prompts || !Array.isArray(parsedResponse.prompts)) {
        console.error('[Ideal State] Invalid response structure:', parsedResponse)
        throw new Error('AI response missing prompts array')
      }
      
      if (parsedResponse.prompts.length === 0) {
        console.error('[Ideal State] AI returned empty prompts array')
        throw new Error('AI generated no prompts')
      }
      
      console.log('[Ideal State] Successfully parsed response with', parsedResponse.prompts.length, 'prompts')
      
    } catch (parseError) {
      console.error('[Ideal State] Failed to parse AI response:', result)
      console.error('[Ideal State] Parse error:', parseError)
      throw new Error(`Invalid JSON response from AI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    // Track token usage
    await trackTokenUsage({
      user_id: user.id,
      action_type: 'vision_generation',  // TODO: Add 'ideal_state_generation' type if needed
      model_used: aiConfig.model,
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
        category,
        categoryName,
        promptCount: parsedResponse.prompts?.length || 0,
        responseTimeMs: responseTime
      }
    })

    // Save generated prompts to life_vision_category_state
    const { error: saveError } = await supabase
      .from('life_vision_category_state')
      .upsert({
        user_id: user.id,
        category,
        ideal_state_prompts: parsedResponse.prompts || []
      }, {
        onConflict: 'user_id,category'
      })

    if (saveError) {
      console.error('[Ideal State] Failed to save prompts to database:', saveError)
      // Don't fail the request if save fails
    } else {
      console.log('[Ideal State] Saved', parsedResponse.prompts?.length || 0, 'prompts to life_vision_category_state')
    }

    console.log('[Ideal State] Successfully generated', parsedResponse.prompts?.length || 0, 'prompts')

    return NextResponse.json({
      success: true,
      data: parsedResponse
    })

  } catch (error: any) {
    console.error('[Ideal State] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate ideal state prompts',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/viva/ideal-state?category=<category>
 * Retrieves the most recent generated prompts for a category
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

    // Fetch prompts from life_vision_category_state
    const { data, error } = await supabase
      .from('life_vision_category_state')
      .select('ideal_state_prompts, updated_at')
      .eq('user_id', user.id)
      .eq('category', category)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data?.ideal_state_prompts ? {
        prompts: data.ideal_state_prompts,
        cached: true,
        cachedAt: data.updated_at
      } : null
    })

  } catch (error: any) {
    console.error('[Ideal State GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve cached prompts',
        details: error.message
      },
      { status: 500 }
    )
  }
}

