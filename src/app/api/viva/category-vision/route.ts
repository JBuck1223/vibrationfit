// API route for generating individual category vision text (queue system)
// Now with STREAMING support for real-time feedback
import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { buildIndividualCategoryPrompt } from '@/lib/viva/prompts/master-vision-prompts'
import { getVisionCategory } from '@/lib/design-system/vision-categories'

export const maxDuration = 300 // 5 minutes per category
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let categoryKey = 'unknown'
  
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    const body = await request.json()
    categoryKey = body.categoryKey || 'unknown'
    
    const {
      idealStateText = '',
      clarityPresentStateText = '',
      contrastFlips = [],
      scenes = [],
      blueprintData = null,
      transcript = '',
      perspective = 'singular'
    } = body

    if (!categoryKey || categoryKey === 'unknown') {
      return new Response(JSON.stringify({ error: 'Category key is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const category = getVisionCategory(categoryKey)
    if (!category) {
      return new Response(JSON.stringify({ error: `Invalid category: ${categoryKey}` }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`[CategoryVision] Starting ${categoryKey} (streaming)`)
    console.log(`[CategoryVision] Input sizes: ideal=${idealStateText?.length || 0}, clarity=${clarityPresentStateText?.length || 0}`)

    // Build the prompt
    const prompt = buildIndividualCategoryPrompt(
      categoryKey,
      category.label,
      idealStateText,
      clarityPresentStateText,
      Array.isArray(contrastFlips) ? contrastFlips : [],
      Array.isArray(scenes) ? scenes : [],
      blueprintData,
      transcript,
      null, // activeVisionCategoryText not used in polish mode
      perspective as 'singular' | 'plural'
    )

    console.log(`[CategoryVision] Prompt length: ${prompt.length} chars`)

    // Get AI tool config
    const toolConfig = await getAIToolConfig('master_vision_assembly')
    
    // Estimate tokens and validate balance
    const estimatedTokens = estimateTokensForText(prompt, toolConfig.model_name)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      console.error(`[CategoryVision] Token validation failed for ${categoryKey}:`, tokenValidation.error)
      return new Response(JSON.stringify({
        error: tokenValidation.error,
        tokensRemaining: tokenValidation.tokensRemaining
      }), { 
        status: tokenValidation.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`[CategoryVision] Streaming with model ${toolConfig.model_name}`)

    // Use Vercel AI SDK for streaming
    const result = streamText({
      model: openai(toolConfig.model_name),
      system: toolConfig.system_prompt || 'You are VIVA, a vibrationally intelligent assistant that writes beautiful, human-sounding life vision text.',
      prompt: prompt,
      temperature: toolConfig.supports_temperature ? toolConfig.temperature : undefined,
      maxTokens: toolConfig.max_tokens * toolConfig.token_multiplier,
      
      async onFinish({ text, usage }) {
        const elapsedMs = Date.now() - startTime
        console.log(`[CategoryVision] Stream finished for ${categoryKey} in ${elapsedMs}ms, length: ${text?.length || 0}`)
        
        if (!text || text.trim().length < 50) {
          console.error(`[CategoryVision] Output too short for ${categoryKey}`)
          return
        }

        const finalOutput = text.trim()

        // Track token usage
        if (usage) {
          trackTokenUsage({
            user_id: user.id,
            action_type: 'life_vision_category_generation',
            model_used: toolConfig.model_name,
            tokens_used: usage.totalTokens || 0,
            input_tokens: usage.promptTokens || 0,
            output_tokens: usage.completionTokens || 0,
            actual_cost_cents: 0,
            success: true,
            metadata: {
              category: categoryKey,
              elapsed_ms: elapsedMs,
              output_length: finalOutput.length,
              streaming: true
            }
          }).catch(err => console.error('[CategoryVision] Token tracking failed:', err))
        }

        // Save generated text to category_state
        const { error: updateError } = await supabase
          .from('vision_new_category_state')
          .update({
            category_vision_text: finalOutput,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('category', categoryKey)

        if (updateError) {
          console.error(`[CategoryVision] Failed to save ${categoryKey}:`, updateError)
        } else {
          console.log(`[CategoryVision] Saved ${categoryKey} to category_state`)
        }
      }
    })

    // Return streaming response
    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Category': categoryKey,
        'X-Model': toolConfig.model_name
      }
    })

  } catch (err) {
    const elapsedMs = Date.now() - startTime
    console.error(`[CategoryVision] Error for ${categoryKey} after ${elapsedMs}ms:`, err)
    
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : 'Failed to generate category vision',
      category: categoryKey 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
