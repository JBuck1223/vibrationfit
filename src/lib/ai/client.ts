// ============================================================================
// VibrationFit AI Client
// ============================================================================
// Centralized AI client that uses the configuration system

import { AI_MODELS, AI_PROVIDER, getAIModelConfig, type AIModelConfig } from './config'

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
      usage: data.usage
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
  validator?: (data: any) => data is T
): Promise<T | null> {
  const jsonPrompt = `${prompt}\n\nRespond with ONLY a valid JSON object.`
  
  const response = await generateText({
    messages: [{ role: 'user', content: jsonPrompt }],
    feature,
    customConfig: { temperature: 0.3 } // Lower temperature for JSON
  })
  
  if (response.error) {
    console.error('JSON generation error:', response.error)
    return null
  }
  
  try {
    const parsed = JSON.parse(response.content)
    
    if (validator && !validator(parsed)) {
      console.error('JSON validation failed:', parsed)
      return null
    }
    
    return parsed
  } catch (error) {
    console.error('JSON parsing error:', error)
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
