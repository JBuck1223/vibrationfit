// ============================================================================
// VibrationFit AI Client
// ============================================================================
// Centralized AI client that uses the configuration system

import { AI_MODELS, AI_PROVIDER, getAIModelConfig, type AIModelConfig } from './config'
import { trackTokenUsage, estimateTokensForText, type TokenUsage } from '@/lib/tokens/tracking'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AIRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  feature: keyof typeof AI_MODELS
  customConfig?: Partial<AIModelConfig>
}

export interface AIResponse {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  // OpenAI Reconciliation Fields (added Nov 16, 2025)
  openai_request_id?: string
  openai_created?: number
  system_fingerprint?: string
  error?: string
}

export interface ImageGenerationRequest {
  prompt: string
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
}

export interface ImageGenerationResponse {
  url: string
  revised_prompt?: string
  error?: string
}

// ============================================================================
// TEXT GENERATION CLIENT
// ============================================================================

export async function generateText(request: AIRequest): Promise<AIResponse> {
  try {
    const config = getAIModelConfig(request.feature)
    const finalConfig = { ...config, ...request.customConfig }

    // Validate API key
    if (!AI_PROVIDER.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Prepare request
    const requestBody = {
      model: finalConfig.model,
      messages: [
        ...(finalConfig.systemPrompt ? [{
          role: 'system' as const,
          content: finalConfig.systemPrompt
        }] : []),
        ...request.messages
      ],
      temperature: finalConfig.temperature,
      max_tokens: finalConfig.maxTokens
    }

    // Make API call
    const response = await fetch(`${AI_PROVIDER.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_PROVIDER.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(AI_PROVIDER.timeout || 30000)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const choice = data.choices[0]

    if (!choice || !choice.message) {
      throw new Error('No response from AI model')
    }

    // Note: Token tracking is handled in API routes where user context is available

    return {
      content: choice.message.content,
      model: data.model,
      usage: data.usage,
      // OpenAI reconciliation metadata
      openai_request_id: data.id,
      openai_created: data.created,
      system_fingerprint: data.system_fingerprint
    }

  } catch (error) {
    console.error(`AI generation error for ${request.feature}:`, error)
    
    // Note: Token tracking is handled in API routes where user context is available
    
    return {
      content: '',
      model: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================================================
// IMAGE GENERATION CLIENT
// ============================================================================

export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  try {
    const config = getAIModelConfig('IMAGE_GENERATION')

    // Validate API key
    if (!AI_PROVIDER.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Prepare request
    const requestBody = {
      model: config.model,
      prompt: request.prompt,
      size: request.size || '1024x1024',
      quality: request.quality || 'standard',
      style: request.style || 'vivid',
      n: 1
    }

    // Make API call
    const response = await fetch(`${AI_PROVIDER.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_PROVIDER.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(AI_PROVIDER.timeout || 30000)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const imageData = data.data[0]

    if (!imageData || !imageData.url) {
      throw new Error('No image generated')
    }

    return {
      url: imageData.url,
      revised_prompt: imageData.revised_prompt
    }

  } catch (error) {
    console.error('AI image generation error:', error)
    return {
      url: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Generate text with a simple prompt (no system message)
 */
export async function generateTextSimple(
  prompt: string,
  feature: keyof typeof AI_MODELS,
  customConfig?: Partial<AIModelConfig>
): Promise<string> {
  const response = await generateText({
    messages: [{ role: 'user', content: prompt }],
    feature,
    customConfig
  })
  
  return response.error ? `Error: ${response.error}` : response.content
}

/**
 * Generate text with system message and user prompt
 */
export async function generateTextWithSystem(
  systemPrompt: string,
  userPrompt: string,
  feature: keyof typeof AI_MODELS,
  customConfig?: Partial<AIModelConfig>
): Promise<string> {
  const response = await generateText({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    feature,
    customConfig
  })
  
  return response.error ? `Error: ${response.error}` : response.content
}

/**
 * Generate JSON response with validation
 */
export async function generateJSON<T>(
  prompt: string,
  feature: keyof typeof AI_MODELS,
  validator?: (data: any) => data is T,
  tracking?: {
    userId: string
    actionType: TokenUsage['action_type']
    supabaseClient?: SupabaseClient
    metadata?: Record<string, any>
  }
): Promise<T | null> {
  const userPrompt = `${prompt}\n\nRespond with ONLY a valid JSON object. Begin your reply with '{' and end with '}'. Do not wrap the response in backticks.`

  const response = await generateText({
    messages: [
      {
        role: 'system',
        content:
          'You must return strictly valid JSON. Do not include code fences, markdown, commentary, or any text before or after the JSON object.',
      },
      { role: 'user', content: userPrompt },
    ],
    feature,
    customConfig: { temperature: 0.3 },
  })

  if (response.error) {
    console.error('JSON generation error:', response.error)
    return null
  }

  const sanitized = (() => {
    let output = response.content.trim()

    // Strip common markdown fences
    output = output.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    // Ensure we only keep the first JSON object in case of stray text
    const firstBrace = output.indexOf('{')
    const lastBrace = output.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
      output = output.slice(firstBrace, lastBrace + 1)
    }

    return output
  })()

  const baseModel = response.model || getAIModelConfig(feature)?.model || 'unknown'
  const usageStats = response.usage

  const logUsage = async (success: boolean, errorMessage?: string) => {
    if (!tracking) return

    const inputTokens = usageStats?.prompt_tokens ?? 0
    const outputTokens = usageStats?.completion_tokens ?? 0
    let totalTokens = usageStats?.total_tokens ?? 0

    if (!totalTokens) {
      totalTokens = estimateTokensForText(userPrompt, baseModel)
    }

    try {
      await trackTokenUsage(
        {
          user_id: tracking.userId,
          action_type: tracking.actionType,
          model_used: baseModel,
          tokens_used: totalTokens,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_estimate: 0,
          success,
          error_message: success ? undefined : errorMessage,
          metadata: {
            feature,
            ...tracking.metadata,
            estimated_tokens: usageStats?.total_tokens ? false : true,
          },
        },
        tracking.supabaseClient
      )
    } catch (trackingError) {
      console.error('Failed to track token usage for generateJSON:', trackingError)
    }
  }

  try {
    const parsed = JSON.parse(sanitized)

    if (validator && !validator(parsed)) {
      console.error('JSON validation failed:', parsed)
      await logUsage(false, 'Validation failed for JSON response.')
      return null
    }

    await logUsage(true)
    return parsed
  } catch (error) {
    console.error('JSON parsing error:', error, '\nRaw response:', response.content)
    await logUsage(false, error instanceof Error ? error.message : 'Unknown JSON parsing error')
    return null
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  generateText,
  generateImage,
  generateTextSimple,
  generateTextWithSystem,
  generateJSON
}
