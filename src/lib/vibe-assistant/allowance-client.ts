// Vibe Assistant Allowance Helper Library - Client Side Only
// Provides client-side functions for checking and managing Vibe Assistant token allowances
// without server-side dependencies

import { createClient } from '@/lib/supabase/client'

// Types for Vibe Assistant allowance management
export interface VibeAssistantAllowance {
  tokensRemaining: number
  tokensUsed: number
  monthlyLimit: number
  costLimit: number
  resetDate: string
  tierName: string
}

export interface TokenEstimate {
  estimatedTokens: number
  estimatedCost: number
  confidence: 'low' | 'medium' | 'high'
}

export interface UsageLog {
  id: string
  category: string
  operation_type: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost_usd: number
  refinement_percentage: number
  tonality: string
  emotional_intensity: string
  processing_time_ms: number
  success: boolean
  error_message?: string
  created_at: string
}

export interface MonthlyStats {
  tokensUsed: number
  costUsd: number
  operationsCount: number
  mostUsedCategory: string
  averageProcessingTime: number
}

// Membership tiers configuration
export const MEMBERSHIP_TIERS = {
  FREE: 'Free',
  GROWTH: 'Growth', 
  ALIGNMENT: 'Alignment',
  ACTUALIZATION: 'Actualization'
} as const

// Vibe Assistant operation types
export const VIBE_ASSISTANT_OPERATIONS = {
  REFINE_VISION: 'refine_vision',
  GENERATE_GUIDANCE: 'generate_guidance',
  ANALYZE_ALIGNMENT: 'analyze_alignment'
} as const

// Tonality options
export const TONALITY_OPTIONS = {
  ENCOURAGING: 'encouraging',
  CHALLENGING: 'challenging',
  BALANCED: 'balanced',
  CELEBRATORY: 'celebratory'
} as const

// Emotional intensity levels
export const EMOTIONAL_INTENSITY = {
  GENTLE: 'gentle',
  MODERATE: 'moderate',
  INTENSE: 'intense'
} as const

/**
 * Get membership tier color for styling
 */
export function getMembershipTierColor(tierName: string): string {
  switch (tierName) {
    case MEMBERSHIP_TIERS.FREE:
      return 'text-neutral-400'
    case MEMBERSHIP_TIERS.GROWTH:
      return 'text-green-400'
    case MEMBERSHIP_TIERS.ALIGNMENT:
      return 'text-blue-400'
    case MEMBERSHIP_TIERS.ACTUALIZATION:
      return 'text-purple-400'
    default:
      return 'text-neutral-400'
  }
}

/**
 * Get membership tier background color for styling
 */
export function getMembershipTierBgColor(tierName: string): string {
  switch (tierName) {
    case MEMBERSHIP_TIERS.FREE:
      return 'bg-neutral-800 text-neutral-400'
    case MEMBERSHIP_TIERS.GROWTH:
      return 'bg-green-500/20 text-green-400'
    case MEMBERSHIP_TIERS.ALIGNMENT:
      return 'bg-blue-500/20 text-blue-400'
    case MEMBERSHIP_TIERS.ACTUALIZATION:
      return 'bg-purple-500/20 text-purple-400'
    default:
      return 'bg-neutral-800 text-neutral-400'
  }
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 1000).toFixed(2)}¢`
  }
  return `$${cost.toFixed(3)}`
}

/**
 * Estimate token usage for given text
 */
export function estimateTokens(text: string): TokenEstimate {
  if (!text || text.trim().length === 0) {
    return {
      estimatedTokens: 0,
      estimatedCost: 0,
      confidence: 'high'
    }
  }

  // Rough estimation: ~4 characters per token for English text
  // Add buffer for system prompts and formatting
  const inputTokens = Math.max(100, Math.ceil(text.length / 4) + 200)
  
  // Estimate output tokens (typically 20-50% of input for refinements)
  const outputTokens = Math.ceil(inputTokens * 0.3) // Conservative 30% estimate
  
  const estimatedCost = calculateCost(inputTokens, outputTokens)
  
  return {
    estimatedTokens: inputTokens + outputTokens, // Total for allowance checking
    estimatedCost,
    confidence: 'medium'
  }
}

/**
 * Calculate cost in USD for input and output tokens separately
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  // GPT-5 mini pricing (as of 2025) - Much cheaper!
  const INPUT_COST_PER_1K = 0.00025  // $0.25 per million tokens
  const OUTPUT_COST_PER_1K = 0.002   // $2.00 per million tokens
  
  const inputCost = (inputTokens * INPUT_COST_PER_1K) / 1000.0
  const outputCost = (outputTokens * OUTPUT_COST_PER_1K) / 1000.0
  
  return inputCost + outputCost
}

/**
 * Legacy function for backward compatibility (treats all tokens as input)
 */
export function calculateCostLegacy(tokens: number): number {
  // Conservative estimate treating all tokens as input tokens
  return (tokens * 0.00125) / 1000.0
}

/**
 * Check user's Vibe Assistant allowance (client-side)
 */
export async function checkVibeAssistantAllowance(): Promise<VibeAssistantAllowance | null> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return null
    }

    // Source of truth: user_profiles (not profiles)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        vibe_assistant_tokens_used,
        vibe_assistant_tokens_remaining,
        vibe_assistant_monthly_reset_date,
        vibe_assistant_total_cost,
        membership_tier_id
      `)
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Profile query error:', {
        error: profileError,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      })
      return null
    }

    if (!profile) {
      console.error('No profile found for user:', user.id)
      return null
    }

    // Fetch membership tier info separately for consistency
    let tier: any = null
    if (profile.membership_tier_id) {
      const { data: tierData } = await supabase
        .from('membership_tiers')
        .select('name, monthly_vibe_assistant_tokens, monthly_vibe_assistant_cost_limit')
        .eq('id', profile.membership_tier_id)
        .single()
      tier = tierData || null
    }

    return {
      tokensRemaining: (profile.vibe_assistant_tokens_remaining ?? 100),
      tokensUsed: (profile.vibe_assistant_tokens_used ?? 0),
      monthlyLimit: (tier?.monthly_vibe_assistant_tokens ?? 100),
      costLimit: (tier?.monthly_vibe_assistant_cost_limit ?? 1.00),
      resetDate: profile.vibe_assistant_monthly_reset_date || new Date().toISOString(),
      tierName: tier?.name || 'Free'
    }

  } catch (error) {
    console.error('Error checking allowance:', error)
    return null
  }
}

/**
 * Check if user has sufficient allowance for an operation
 */
export async function hasSufficientAllowance(tokenEstimate: TokenEstimate): Promise<{
  hasAllowance: boolean
  allowance?: VibeAssistantAllowance
  shortfall?: number
}> {
  const allowance = await checkVibeAssistantAllowance()
  
  if (!allowance) {
    return { hasAllowance: false }
  }

  const hasAllowance = allowance.tokensRemaining >= tokenEstimate.estimatedTokens
  const shortfall = hasAllowance ? 0 : tokenEstimate.estimatedTokens - allowance.tokensRemaining

  return {
    hasAllowance,
    allowance,
    shortfall
  }
}
