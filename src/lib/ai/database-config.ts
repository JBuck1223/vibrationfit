// ============================================================================
// Database-Driven AI Configuration
// ============================================================================
// Replaces hardcoded config.ts with admin-configurable database settings

import { createClient } from '@/lib/supabase/server'

export interface AIToolConfig {
  tool_key: string
  tool_name: string
  model_name: string
  temperature: number
  max_tokens: number
  system_prompt: string
  // Model capabilities
  supports_temperature: boolean
  supports_json_mode: boolean
  supports_streaming: boolean
  is_reasoning_model: boolean
  max_tokens_param: 'max_tokens' | 'max_completion_tokens'
  token_multiplier: number
  context_window: number
  // Pricing (per 1M tokens)
  input_price_per_1m: number
  output_price_per_1m: number
}

/**
 * Get AI tool configuration from database
 * Replaces getAIModelConfig() with database-driven config
 */
export async function getAIToolConfig(toolKey: string): Promise<AIToolConfig> {
  try {
    const supabase = await createClient()
    
    // Call database function to get complete config
    const { data, error } = await supabase
      .rpc('get_ai_tool_config', { p_tool_key: toolKey })
      .single()

    if (error) {
      console.error(`Failed to load AI tool config for ${toolKey}:`, error)
      throw new Error(`AI tool configuration not found: ${toolKey}`)
    }

    if (!data) {
      throw new Error(`AI tool not configured: ${toolKey}`)
    }

    return data as AIToolConfig
  } catch (err) {
    console.error('Error loading AI tool config:', err)
    throw new Error(`Failed to load AI configuration for ${toolKey}`)
  }
}

/**
 * Build OpenAI API call params from tool config
 * Respects model capabilities (temperature, json_mode, etc.)
 */
export function buildOpenAIParams(
  config: AIToolConfig,
  messages: Array<{ role: string; content: string }>,
  options?: {
    forceNoJsonMode?: boolean
    customMaxTokens?: number
  }
) {
  // Calculate actual token limit (reasoning models get multiplier)
  const actualMaxTokens = (options?.customMaxTokens || config.max_tokens) * config.token_multiplier

  const params: any = {
    model: config.model_name,
    messages,
    [config.max_tokens_param]: actualMaxTokens,
  }

  // Only add temperature if model supports it
  if (config.supports_temperature) {
    params.temperature = config.temperature
  }

  // Only add json_object mode if model supports it AND not disabled
  if (config.supports_json_mode && !options?.forceNoJsonMode) {
    params.response_format = { type: 'json_object' }
  }

  return params
}

/**
 * Validate if a tool can be used with streaming
 */
export function supportsStreaming(config: AIToolConfig): boolean {
  return config.supports_streaming
}

/**
 * Calculate estimated cost for a tool call
 */
export function estimateCost(
  config: AIToolConfig,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): number {
  const inputCost = (estimatedInputTokens / 1000000) * config.input_price_per_1m
  const outputCost = (estimatedOutputTokens / 1000000) * config.output_price_per_1m
  return Math.round((inputCost + outputCost) * 100) // Return cents
}

/**
 * Legacy compatibility: Map old config keys to new tool keys
 */
const LEGACY_KEY_MAP: Record<string, string> = {
  'LIFE_VISION_CATEGORY_SUMMARY': 'life_vision_category_summary',
  'BLUEPRINT_GENERATION': 'blueprint_generation',
  'VISION_REFINEMENT': 'vision_refinement',
  'LIFE_VISION_MASTER_ASSEMBLY': 'master_vision_assembly',
  'PROMPT_SUGGESTIONS': 'prompt_suggestions',
  'VIVA_SCENE_SUGGESTION': 'scene_generation',
  'VIVA_NORTH_STAR_REFLECTION': 'north_star_reflection',
  'VIVA_VOICE_ANALYZER': 'voice_analyzer',
  'VIBRATIONAL_ANALYZER': 'vibrational_analyzer'
}

/**
 * Get tool config with legacy key support
 */
export async function getAIToolConfigLegacy(keyOrToolKey: string): Promise<AIToolConfig> {
  const toolKey = LEGACY_KEY_MAP[keyOrToolKey] || keyOrToolKey
  return getAIToolConfig(toolKey)
}

