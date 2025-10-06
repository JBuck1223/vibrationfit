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
  const estimatedTokens = Math.max(100, Math.ceil(text.length / 4) + 200)
  const estimatedCost = calculateCost(estimatedTokens)
  
  return {
    estimatedTokens,
    estimatedCost,
    confidence: 'medium'
  }
}

/**
 * Calculate cost in USD for given token count
 */
export function calculateCost(tokens: number): number {
  // GPT-5 pricing: Estimated based on OpenAI's pricing patterns
  // Using conservative estimate for the latest model with advanced capabilities
  return (tokens * 0.015) / 1000.0
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

    // Get user's profile with allowance info
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        vibe_assistant_tokens_used,
        vibe_assistant_tokens_remaining,
        vibe_assistant_monthly_reset_date,
        vibe_assistant_total_cost,
        membership_tier_id,
        membership_tiers (
          name,
          monthly_vibe_assistant_tokens,
          monthly_vibe_assistant_cost_limit
        )
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

    const tier = profile.membership_tiers as any
    if (!tier) {
      console.error('No membership tier found')
      return null
    }

    return {
      tokensRemaining: profile.vibe_assistant_tokens_remaining || 0,
      tokensUsed: profile.vibe_assistant_tokens_used || 0,
      monthlyLimit: tier.monthly_vibe_assistant_tokens || 100,
      costLimit: tier.monthly_vibe_assistant_cost_limit || 1.00,
      resetDate: profile.vibe_assistant_monthly_reset_date || new Date().toISOString(),
      tierName: tier.name || 'Free'
    }

  } catch (error) {
    console.error('Error checking allowance:', error)
    return null
  }
}

/**
 * Check if user has sufficient allowance for an operation
 */
export async function hasSufficientAllowance(estimatedTokens: number): Promise<{
  hasAllowance: boolean
  allowance?: VibeAssistantAllowance
  shortfall?: number
}> {
  const allowance = await checkVibeAssistantAllowance()
  
  if (!allowance) {
    return { hasAllowance: false }
  }

  const hasAllowance = allowance.tokensRemaining >= estimatedTokens
  const shortfall = hasAllowance ? 0 : estimatedTokens - allowance.tokensRemaining

  return {
    hasAllowance,
    allowance,
    shortfall
  }
}
