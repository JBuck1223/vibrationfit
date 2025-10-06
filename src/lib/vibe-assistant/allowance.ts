// Vibe Assistant Allowance Helper Library
// Provides functions for checking, managing, and tracking Vibe Assistant token allowances
// with transparent cost tracking and membership-based limits

import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'

// Types for Vibe Assistant allowance management
export interface VibeAssistantAllowance {
  tokensRemaining: number
  tokensUsed: number
  monthlyLimit: number
  costLimit: number
  resetDate: string
  tierName: string
}

export interface VibeAssistantUsage {
  tokensUsed: number
  costUsd: number
  operationType: 'refine_vision' | 'generate_guidance' | 'analyze_alignment'
  category: string
  success: boolean
  errorMessage?: string
}

export interface TokenEstimate {
  estimatedTokens: number
  estimatedCost: number
  confidence: 'low' | 'medium' | 'high'
}

// Operation types for Vibe Assistant
export const VIBE_ASSISTANT_OPERATIONS = {
  REFINE_VISION: 'refine_vision',
  GENERATE_GUIDANCE: 'generate_guidance', 
  ANALYZE_ALIGNMENT: 'analyze_alignment'
} as const

// Membership tier names
export const MEMBERSHIP_TIERS = {
  FREE: 'Free',
  GROWTH: 'Growth',
  ALIGNMENT: 'Alignment',
  ACTUALIZATION: 'Actualization'
} as const

// Tonality options for refinements
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
 * Client-side function to check user's current Vibe Assistant allowance
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

    // Call the database function to get allowance info
    const { data, error } = await supabase
      .rpc('get_vibe_assistant_allowance', { p_user_id: user.id })

    if (error) {
      console.error('Error fetching allowance:', error)
      return null
    }

    if (!data || data.length === 0) {
      console.error('No allowance data found for user')
      return null
    }

    const allowance = data[0]
    return {
      tokensRemaining: allowance.tokens_remaining || 0,
      tokensUsed: allowance.tokens_used || 0,
      monthlyLimit: allowance.monthly_limit || 0,
      costLimit: parseFloat(allowance.cost_limit || '0'),
      resetDate: allowance.reset_date,
      tierName: allowance.tier_name || 'Free'
    }
  } catch (error) {
    console.error('Error checking Vibe Assistant allowance:', error)
    return null
  }
}

/**
 * Server-side function to check user's current Vibe Assistant allowance
 */
export async function checkVibeAssistantAllowanceServer(userId: string): Promise<VibeAssistantAllowance | null> {
  try {
    const supabase = await createServerClient()
    
    // Call the database function to get allowance info
    const { data, error } = await supabase
      .rpc('get_vibe_assistant_allowance', { p_user_id: userId })

    if (error) {
      console.error('Error fetching allowance:', error)
      return null
    }

    if (!data || data.length === 0) {
      console.error('No allowance data found for user')
      return null
    }

    const allowance = data[0]
    return {
      tokensRemaining: allowance.tokens_remaining || 0,
      tokensUsed: allowance.tokens_used || 0,
      monthlyLimit: allowance.monthly_limit || 0,
      costLimit: parseFloat(allowance.cost_limit || '0'),
      resetDate: allowance.reset_date,
      tierName: allowance.tier_name || 'Free'
    }
  } catch (error) {
    console.error('Error checking Vibe Assistant allowance:', error)
    return null
  }
}

/**
 * Decrement user's Vibe Assistant allowance (server-side only)
 */
export async function decrementVibeAssistantAllowance(
  userId: string,
  tokens: number,
  cost: number
): Promise<boolean> {
  try {
    const supabase = await createServerClient()
    
    // Call the database function to decrement allowance
    const { data, error } = await supabase
      .rpc('decrement_vibe_assistant_allowance', {
        p_user_id: userId,
        p_tokens: tokens,
        p_cost: cost
      })

    if (error) {
      console.error('Error decrementing allowance:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error decrementing Vibe Assistant allowance:', error)
    return false
  }
}

/**
 * Get remaining Vibe Assistant allowance for a user
 */
export async function getRemainingVibeAssistantAllowance(): Promise<number> {
  const allowance = await checkVibeAssistantAllowance()
  return allowance?.tokensRemaining || 0
}

/**
 * Estimate tokens for given text (client-side)
 */
export function estimateTokens(text: string): TokenEstimate {
  // Rough estimation: ~4 characters per token for English text
  // Add buffer for system prompts and formatting
  const baseTokens = Math.max(100, Math.ceil(text.length / 4) + 200)
  
  // Confidence based on text length
  let confidence: 'low' | 'medium' | 'high' = 'low'
  if (text.length > 1000) confidence = 'high'
  else if (text.length > 500) confidence = 'medium'
  
  const estimatedCost = calculateCost(baseTokens)
  
  return {
    estimatedTokens: baseTokens,
    estimatedCost,
    confidence
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
 * Check if user has sufficient allowance for an operation
 */
export async function hasSufficientAllowance(estimatedTokens: number): Promise<{
  hasAllowance: boolean
  currentAllowance: VibeAssistantAllowance | null
  estimatedCost: number
}> {
  const allowance = await checkVibeAssistantAllowance()
  const estimatedCost = calculateCost(estimatedTokens)
  
  if (!allowance) {
    return {
      hasAllowance: false,
      currentAllowance: null,
      estimatedCost
    }
  }

  const hasTokens = allowance.tokensRemaining >= estimatedTokens
  const hasCostLimit = (allowance.costLimit - allowance.tokensUsed * 0.045 / 1000) >= estimatedCost
  
  return {
    hasAllowance: hasTokens && hasCostLimit,
    currentAllowance: allowance,
    estimatedCost
  }
}

/**
 * Log Vibe Assistant usage (server-side)
 */
export async function logVibeAssistantUsage(usage: {
  userId: string
  visionId?: string
  category: string
  operationType: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number
  refinementPercentage?: number
  tonality?: string
  wordCountTarget?: number
  emotionalIntensity?: string
  instructions?: string
  inputText?: string
  outputText?: string
  processingTimeMs?: number
  success: boolean
  errorMessage?: string
}): Promise<boolean> {
  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('vibe_assistant_logs')
      .insert({
        user_id: usage.userId,
        vision_id: usage.visionId,
        category: usage.category,
        operation_type: usage.operationType,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        total_tokens: usage.totalTokens,
        cost_usd: usage.costUsd,
        refinement_percentage: usage.refinementPercentage,
        tonality: usage.tonality,
        word_count_target: usage.wordCountTarget,
        emotional_intensity: usage.emotionalIntensity,
        instructions: usage.instructions,
        input_text: usage.inputText,
        output_text: usage.outputText,
        processing_time_ms: usage.processingTimeMs,
        success: usage.success,
        error_message: usage.errorMessage
      })

    if (error) {
      console.error('Error logging Vibe Assistant usage:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error logging Vibe Assistant usage:', error)
    return false
  }
}

/**
 * Get user's recent Vibe Assistant usage history
 */
export async function getVibeAssistantUsageHistory(limit: number = 10): Promise<any[]> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return []
    }

    const { data, error } = await supabase
      .from('vibe_assistant_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching usage history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching Vibe Assistant usage history:', error)
    return []
  }
}

/**
 * Get user's monthly Vibe Assistant usage statistics
 */
export async function getVibeAssistantMonthlyStats(): Promise<{
  tokensUsed: number
  costUsd: number
  operationsCount: number
  mostUsedCategory: string
  averageProcessingTime: number
}> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return {
        tokensUsed: 0,
        costUsd: 0,
        operationsCount: 0,
        mostUsedCategory: '',
        averageProcessingTime: 0
      }
    }

    // Get current month's start date
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const { data, error } = await supabase
      .from('vibe_assistant_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString())
      .eq('success', true)

    if (error) {
      console.error('Error fetching monthly stats:', error)
      return {
        tokensUsed: 0,
        costUsd: 0,
        operationsCount: 0,
        mostUsedCategory: '',
        averageProcessingTime: 0
      }
    }

    const logs = data || []
    
    // Calculate statistics
    const tokensUsed = logs.reduce((sum, log) => sum + (log.total_tokens || 0), 0)
    const costUsd = logs.reduce((sum, log) => sum + parseFloat(log.cost_usd || '0'), 0)
    const operationsCount = logs.length
    
    // Find most used category
    const categoryCounts: Record<string, number> = {}
    logs.forEach(log => {
      categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1
    })
    const mostUsedCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || ''
    
    // Calculate average processing time
    const processingTimes = logs
      .map(log => log.processing_time_ms)
      .filter(time => time && time > 0)
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0

    return {
      tokensUsed,
      costUsd,
      operationsCount,
      mostUsedCategory,
      averageProcessingTime
    }
  } catch (error) {
    console.error('Error fetching Vibe Assistant monthly stats:', error)
    return {
      tokensUsed: 0,
      costUsd: 0,
      operationsCount: 0,
      mostUsedCategory: '',
      averageProcessingTime: 0
    }
  }
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(cost)
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  return new Intl.NumberFormat('en-US').format(tokens)
}

/**
 * Get membership tier color for UI
 */
export function getMembershipTierColor(tierName: string): string {
  switch (tierName) {
    case MEMBERSHIP_TIERS.FREE:
      return 'text-gray-400'
    case MEMBERSHIP_TIERS.GROWTH:
      return 'text-green-400'
    case MEMBERSHIP_TIERS.ALIGNMENT:
      return 'text-blue-400'
    case MEMBERSHIP_TIERS.ACTUALIZATION:
      return 'text-purple-400'
    default:
      return 'text-gray-400'
  }
}

/**
 * Get membership tier background color for UI
 */
export function getMembershipTierBgColor(tierName: string): string {
  switch (tierName) {
    case MEMBERSHIP_TIERS.FREE:
      return 'bg-gray-500/20'
    case MEMBERSHIP_TIERS.GROWTH:
      return 'bg-green-500/20'
    case MEMBERSHIP_TIERS.ALIGNMENT:
      return 'bg-blue-500/20'
    case MEMBERSHIP_TIERS.ACTUALIZATION:
      return 'bg-purple-500/20'
    default:
      return 'bg-gray-500/20'
  }
}
