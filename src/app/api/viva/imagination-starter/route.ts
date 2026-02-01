/**
 * Imagination Starter API Route
 * 
 * Generates a "Get Me Started" draft for the imagination step.
 * Uses raw profile data (clarity + contrast) to create a starting point
 * the user can edit and expand.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { 
  buildImaginationStarterPrompt, 
  extractCategoryProfileData 
} from '@/lib/viva/prompts/imagination-starter-prompt'
import { 
  getVisionCategory, 
  isValidVisionCategory,
  getCategoryClarityField,
  getCategoryContrastField,
  type LifeCategoryKey 
} from '@/lib/design-system/vision-categories'
import { getFilteredQuestionsForCategory } from '@/lib/life-vision/ideal-state-questions'

export const maxDuration = 60 // 1 minute max
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let categoryKey = 'unknown'
  
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    categoryKey = body.categoryKey || 'unknown'
    const perspective = body.perspective || 'singular'

    if (!categoryKey || categoryKey === 'unknown') {
      return NextResponse.json({ error: 'Category key is required' }, { status: 400 })
    }

    // Validate category key
    if (!isValidVisionCategory(categoryKey)) {
      return NextResponse.json({ error: `Invalid category: ${categoryKey}` }, { status: 400 })
    }

    const category = getVisionCategory(categoryKey as LifeCategoryKey)
    if (!category) {
      return NextResponse.json({ error: `Category not found: ${categoryKey}` }, { status: 400 })
    }

    console.log(`[ImaginationStarter] Starting for ${categoryKey}`)

    // Get user's active profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_draft', false)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json(
        { error: 'No active profile found. Please complete your profile first.' },
        { status: 400 }
      )
    }

    // Extract clarity and contrast from profile
    const clarityField = getCategoryClarityField(categoryKey as LifeCategoryKey)
    const contrastField = getCategoryContrastField(categoryKey as LifeCategoryKey)
    
    const clarityText = profile[clarityField] || ''
    const contrastText = profile[contrastField] || ''

    // Check if we have any content to work with
    if (!clarityText && !contrastText) {
      return NextResponse.json(
        { error: `No clarity or contrast data found for ${category.label}. Please complete your profile first.` },
        { status: 400 }
      )
    }

    // Extract category-specific profile data
    const profileData = extractCategoryProfileData(categoryKey as LifeCategoryKey, profile)

    // Get inspiration questions for this category
    const questions = getFilteredQuestionsForCategory(categoryKey, profile)
    const questionTexts = questions.map(q => q.text)

    // Calculate input richness for dynamic max tokens
    const clarityWords = clarityText?.trim().split(/\s+/).filter(Boolean).length || 0
    const contrastWords = contrastText?.trim().split(/\s+/).filter(Boolean).length || 0
    const totalInputWords = clarityWords + contrastWords + (Object.keys(profileData).length * 5)
    
    // Dynamic max tokens based on input richness
    // minimal (<30 words): 300 tokens, moderate (<80): 500 tokens, rich (<150): 800 tokens, very_rich: 1200 tokens
    const dynamicMaxTokens = totalInputWords < 30 ? 300 
      : totalInputWords < 80 ? 500 
      : totalInputWords < 150 ? 800 
      : 1200

    console.log(`[ImaginationStarter] Data - clarity: ${clarityWords} words, contrast: ${contrastWords} words, profile fields: ${Object.keys(profileData).length}, maxTokens: ${dynamicMaxTokens}`)

    // Build the prompt
    const prompt = buildImaginationStarterPrompt(
      categoryKey as LifeCategoryKey,
      category.label,
      clarityText,
      contrastText,
      profileData,
      questionTexts,
      perspective as 'singular' | 'plural'
    )

    // Get AI tool config - try imagination_starter, fall back to master_vision_assembly (similar creative writing use)
    let toolConfig
    try {
      toolConfig = await getAIToolConfig('imagination_starter')
    } catch {
      // Fall back to master_vision_assembly config if imagination_starter not configured
      console.log('[ImaginationStarter] Tool not configured, falling back to master_vision_assembly')
      toolConfig = await getAIToolConfig('master_vision_assembly')
    }
    
    // Estimate tokens and validate balance
    const estimatedTokens = estimateTokensForText(prompt, toolConfig.model_name)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      console.error(`[ImaginationStarter] Token validation failed:`, tokenValidation.error)
      return NextResponse.json({
        error: tokenValidation.error,
        tokensRemaining: tokenValidation.tokensRemaining
      }, { status: tokenValidation.status })
    }

    console.log(`[ImaginationStarter] Using model ${toolConfig.model_name}`)

    // Stream the response
    const result = streamText({
      model: openai(toolConfig.model_name),
      system: 'You are a warm, creative writing assistant helping someone draft their ideal life vision. Write naturally and conversationally.',
      prompt: prompt,
      temperature: toolConfig.supports_temperature ? (toolConfig.temperature || 0.8) : undefined,
      maxTokens: dynamicMaxTokens, // Dynamic based on input richness
      
      async onFinish({ text, usage }) {
        const elapsedMs = Date.now() - startTime
        console.log(`[ImaginationStarter] Completed ${categoryKey} in ${elapsedMs}ms, length: ${text?.length || 0}`)
        
        // Track token usage
        if (usage) {
          const promptTokens = (usage as any).prompt || (usage as any).promptTokens || 0
          const completionTokens = (usage as any).completion || (usage as any).completionTokens || 0
          const totalTokens = (usage as any).total || (usage as any).totalTokens || (promptTokens + completionTokens)
          
          trackTokenUsage({
            user_id: user.id,
            action_type: 'imagination_starter',
            model_used: toolConfig.model_name,
            tokens_used: totalTokens,
            input_tokens: promptTokens,
            output_tokens: completionTokens,
            actual_cost_cents: 0,
            success: true,
            metadata: {
              category: categoryKey,
              elapsed_ms: elapsedMs,
              output_length: text?.length || 0,
              had_clarity: !!clarityText,
              had_contrast: !!contrastText,
              profile_fields_count: Object.keys(profileData).length,
              input_words: totalInputWords,
              max_tokens_used: dynamicMaxTokens
            }
          }).catch(err => console.error('[ImaginationStarter] Token tracking failed:', err))
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
    console.error(`[ImaginationStarter] Error for ${categoryKey} after ${elapsedMs}ms:`, err)
    
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Failed to generate imagination starter',
      category: categoryKey 
    }, { status: 500 })
  }
}
