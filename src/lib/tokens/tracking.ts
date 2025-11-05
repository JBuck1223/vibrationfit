// ============================================================================
// Token Tracking System
// ============================================================================
// Comprehensive token usage tracking for all AI actions across the platform

import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'

export interface TokenUsage {
  id?: string
  user_id: string
  action_type: 'assessment_scoring' | 'vision_generation' | 'vision_refinement' | 'blueprint_generation' | 'chat_conversation' | 'audio_generation' | 'image_generation' | 'admin_grant' | 'admin_deduct' | 'life_vision_category_summary' | 'life_vision_master_assembly' | 'prompt_suggestions' | 'frequency_flip'
  model_used: string
  tokens_used: number
  cost_estimate: number // in cents
  input_tokens?: number
  output_tokens?: number
  success: boolean
  error_message?: string
  metadata?: Record<string, any>
  created_at?: string
}

export interface TokenSummary {
  total_tokens: number
  total_cost: number // in cents
  actions_count: number
  model_breakdown: Record<string, { tokens: number; cost: number; count: number }>
  daily_usage: Record<string, { tokens: number; cost: number; count: number }>
}

// Token cost estimates (per 1K tokens, in cents)
const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-5': { input: 5, output: 15 },
  'gpt-5-mini': { input: 3, output: 9 },
  'gpt-5-nano': { input: 1, output: 3 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 1, output: 3 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'dall-e-3': { input: 40, output: 0 }, // Fixed cost per image
  'dall-e-2': { input: 20, output: 0 }
}

/**
 * Check if user has sufficient tokens before allowing an AI action (server-side)
 * Returns null if user has enough tokens, or an error response object if insufficient
 */
export async function validateTokenBalance(
  userId: string, 
  estimatedTokens: number,
  supabaseClient?: any
): Promise<{ error: string; tokensRemaining: number; status: number } | null> {
  try {
    const supabase = supabaseClient || await createServerClient()
    
    // Get current token balance
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('vibe_assistant_tokens_remaining')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Failed to fetch user profile for token validation:', profileError)
      // Allow the request to proceed if we can't check (better than blocking)
      return null
    }

    const tokensRemaining = profile.vibe_assistant_tokens_remaining || 0

    // Check if user has sufficient tokens
    if (tokensRemaining < estimatedTokens) {
      return {
        error: 'Insufficient tokens remaining',
        tokensRemaining,
        status: 402 // Payment Required
      }
    }

    return null // User has sufficient tokens
  } catch (error) {
    console.error('Error validating token balance:', error)
    // On error, allow request to proceed (fail open rather than blocking)
    return null
  }
}

/**
 * Estimate tokens for a text-based AI request
 */
export function estimateTokensForText(text: string, model: string): number {
  // Rough estimate: ~4 characters per token for English text
  // Add buffer for system prompts and formatting
  const inputTokens = Math.max(100, Math.ceil(text.length / 4) + 200)
  
  // Estimate output tokens based on model (typically 20-50% of input for completions)
  let outputMultiplier = 0.3 // Conservative default
  if (model.includes('gpt-4')) outputMultiplier = 0.4
  if (model.includes('gpt-5')) outputMultiplier = 0.5
  
  const outputTokens = Math.ceil(inputTokens * outputMultiplier)
  
  return inputTokens + outputTokens
}

/**
 * Get default token estimate for non-text actions (images, audio, etc.)
 */
export async function getDefaultTokenEstimate(
  actionType: TokenUsage['action_type'],
  supabaseClient?: any
): Promise<number> {
  try {
    const supabase = supabaseClient || await createServerClient()
    
    // Check for override value
    const { data: override } = await supabase
      .from('ai_action_token_overrides')
      .select('token_value')
      .eq('action_type', actionType)
      .single()
    
    if (override?.token_value) {
      return override.token_value
    }

    // Default estimates if no override
    const defaults: Record<string, number> = {
      image_generation: 25,
      audio_generation: 1,
      transcription: 60,
      assessment_scoring: 200,
    }

    return defaults[actionType] || 100
  } catch (error) {
    console.error('Error getting default token estimate:', error)
    // Return conservative default
    return 100
  }
}

/**
 * Track token usage for an AI action
 */
export async function trackTokenUsage(usage: Omit<TokenUsage, 'id' | 'created_at'>, supabaseClient?: any): Promise<void> {
  try {
    const supabase = supabaseClient || createClient()
    
    // Calculate cost based on model and token usage (in cents)
    const costEstimate = calculateTokenCost(usage.model_used, usage.input_tokens || 0, usage.output_tokens || 0)
    
    // Determine effective tokens (use override if no input/output tokens provided)
    let effectiveTokens = usage.tokens_used
    if ((usage.input_tokens || 0) + (usage.output_tokens || 0) > 0) {
      effectiveTokens = (usage.input_tokens || 0) + (usage.output_tokens || 0)
    }
    
    // If still no tokens, try to get override for this action type
    if (effectiveTokens === 0) {
      const { data: override } = await supabase
        .from('ai_action_token_overrides')
        .select('token_value')
        .eq('action_type', usage.action_type)
        .single()
      
      if (override) {
        effectiveTokens = override.token_value
      }
    }

    // 1. Insert audit trail record (for user history)
    const { error: auditError } = await supabase
      .from('token_usage')
      .insert({
        user_id: usage.user_id,
        action_type: usage.action_type,
        model_used: usage.model_used,
        tokens_used: effectiveTokens,
        cost_estimate: Math.round(costEstimate * 100),
        input_tokens: usage.input_tokens || 0,
        output_tokens: usage.output_tokens || 0,
        success: usage.success,
        error_message: usage.error_message,
        metadata: usage.metadata || {},
        created_at: new Date().toISOString()
      })

    if (auditError) {
      console.error('Failed to insert audit trail:', auditError)
    }

    // 2. Update user balance (single source of truth) - only if successful
    if (usage.success && effectiveTokens > 0) {
      // Get current balance first
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('vibe_assistant_tokens_used, vibe_assistant_tokens_remaining, vibe_assistant_total_cost')
        .eq('user_id', usage.user_id)
        .single()

      if (currentProfile) {
        let newTokensUsed = currentProfile.vibe_assistant_tokens_used || 0
        let newTokensRemaining = currentProfile.vibe_assistant_tokens_remaining || 0
        
        // Handle different action types
        if (usage.action_type === 'admin_grant') {
          // Admin grants: add to remaining (don't touch tokens_used)
          newTokensRemaining += effectiveTokens
          // Don't modify tokens_used for grants
        } else if (usage.action_type === 'admin_deduct') {
          // Admin deductions: subtract from remaining, add to used
          newTokensRemaining = Math.max(0, newTokensRemaining - effectiveTokens)
          newTokensUsed += effectiveTokens
        } else {
          // Regular AI usage: subtract from remaining, add to used
          newTokensRemaining = Math.max(0, newTokensRemaining - effectiveTokens)
          newTokensUsed += effectiveTokens
        }
        
        const newTotalCost = (currentProfile.vibe_assistant_total_cost || 0) + Math.round(costEstimate * 100)

        console.log('Updating user balance:', {
          user_id: usage.user_id,
          old_tokens_remaining: currentProfile.vibe_assistant_tokens_remaining,
          new_tokens_remaining: newTokensRemaining,
          old_tokens_used: currentProfile.vibe_assistant_tokens_used,
          new_tokens_used: newTokensUsed,
          action_type: usage.action_type,
          effective_tokens: effectiveTokens
        })

        const { error: balanceError } = await supabase
          .from('user_profiles')
          .update({
            vibe_assistant_tokens_used: newTokensUsed,
            vibe_assistant_tokens_remaining: newTokensRemaining,
            vibe_assistant_total_cost: newTotalCost
          })
          .eq('user_id', usage.user_id)

        if (balanceError) {
          console.error('Failed to update user balance:', balanceError)
        } else {
          console.log('User balance updated successfully')
        }
      }
    }

  } catch (error) {
    console.error('Token tracking error:', error)
    // Silent fail - tracking shouldn't break the main functionality
  }
}

/**
 * Calculate token cost based on model and usage
 */
function calculateTokenCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = TOKEN_COSTS[model]
  if (!costs) {
    console.warn(`Unknown model for cost calculation: ${model}`)
    return 0
  }

  // For image generation models, return fixed cost
  if (model.includes('dall-e')) {
    return costs.input
  }

  // For text models, calculate based on input/output tokens
  const inputCost = (inputTokens / 1000) * costs.input
  const outputCost = (outputTokens / 1000) * costs.output
  
  return Math.round((inputCost + outputCost) * 100) / 100 // Round to 2 decimal places
}

/**
 * Get token usage summary for a user
 */
export async function getTokenSummary(userId: string, days: number = 30): Promise<TokenSummary | null> {
  try {
    const supabase = createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: usage, error } = await supabase
      .from('token_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch token usage:', error)
      return null
    }

    if (!usage || usage.length === 0) {
      return {
        total_tokens: 0,
        total_cost: 0,
        actions_count: 0,
        model_breakdown: {},
        daily_usage: {}
      }
    }

    // Calculate summary
    const totalTokens = usage.reduce((sum, record) => sum + record.tokens_used, 0)
    const totalCost = usage.reduce((sum, record) => sum + record.cost_estimate, 0)
    const actionsCount = usage.length

    // Model breakdown
    const modelBreakdown: Record<string, { tokens: number; cost: number; count: number }> = {}
    usage.forEach(record => {
      if (!modelBreakdown[record.model_used]) {
        modelBreakdown[record.model_used] = { tokens: 0, cost: 0, count: 0 }
      }
      modelBreakdown[record.model_used].tokens += record.tokens_used
      modelBreakdown[record.model_used].cost += record.cost_estimate
      modelBreakdown[record.model_used].count += 1
    })

    // Daily usage
    const dailyUsage: Record<string, { tokens: number; cost: number; count: number }> = {}
    usage.forEach(record => {
      const date = new Date(record.created_at).toISOString().split('T')[0]
      if (!dailyUsage[date]) {
        dailyUsage[date] = { tokens: 0, cost: 0, count: 0 }
      }
      dailyUsage[date].tokens += record.tokens_used
      dailyUsage[date].cost += record.cost_estimate
      dailyUsage[date].count += 1
    })

    return {
      total_tokens: totalTokens,
      total_cost: totalCost,
      actions_count: actionsCount,
      model_breakdown: modelBreakdown,
      daily_usage: dailyUsage
    }

  } catch (error) {
    console.error('Token summary error:', error)
    return null
  }
}

/**
 * Get admin token usage summary across all users
 */
export async function getAdminTokenSummary(days: number = 30): Promise<TokenSummary | null> {
  try {
    const supabase = createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: usage, error } = await supabase
      .from('token_usage')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch admin token usage:', error)
      return null
    }

    if (!usage || usage.length === 0) {
      return {
        total_tokens: 0,
        total_cost: 0,
        actions_count: 0,
        model_breakdown: {},
        daily_usage: {}
      }
    }

    // Calculate summary (same logic as user summary but across all users)
    const totalTokens = usage.reduce((sum, record) => sum + record.tokens_used, 0)
    const totalCost = usage.reduce((sum, record) => sum + record.cost_estimate, 0)
    const actionsCount = usage.length

    // Model breakdown
    const modelBreakdown: Record<string, { tokens: number; cost: number; count: number }> = {}
    usage.forEach(record => {
      if (!modelBreakdown[record.model_used]) {
        modelBreakdown[record.model_used] = { tokens: 0, cost: 0, count: 0 }
      }
      modelBreakdown[record.model_used].tokens += record.tokens_used
      modelBreakdown[record.model_used].cost += record.cost_estimate
      modelBreakdown[record.model_used].count += 1
    })

    // Daily usage
    const dailyUsage: Record<string, { tokens: number; cost: number; count: number }> = {}
    usage.forEach(record => {
      const date = new Date(record.created_at).toISOString().split('T')[0]
      if (!dailyUsage[date]) {
        dailyUsage[date] = { tokens: 0, cost: 0, count: 0 }
      }
      dailyUsage[date].tokens += record.tokens_used
      dailyUsage[date].cost += record.cost_estimate
      dailyUsage[date].count += 1
    })

    return {
      total_tokens: totalTokens,
      total_cost: totalCost,
      actions_count: actionsCount,
      model_breakdown: modelBreakdown,
      daily_usage: dailyUsage
    }

  } catch (error) {
    console.error('Admin token summary error:', error)
    return null
  }
}

/**
 * Get token usage by user for admin dashboard
 */
export async function getTokenUsageByUser(days: number = 30, limit: number = 100): Promise<Array<{
  user_id: string
  user_email: string
  total_tokens: number
  total_cost: number
  actions_count: number
  last_activity: string
}>> {
  try {
    const supabase = createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: usage, error } = await supabase
      .from('token_usage')
      .select(`
        user_id,
        tokens_used,
        cost_estimate,
        created_at
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch token usage by user:', error)
      return []
    }

    if (!usage || usage.length === 0) {
      return []
    }

    // Group by user and calculate totals
    const userTotals: Record<string, {
      user_id: string
      user_email: string
      total_tokens: number
      total_cost: number
      actions_count: number
      last_activity: string
    }> = {}

    usage.forEach(record => {
      const userId = record.user_id
      if (!userTotals[userId]) {
        userTotals[userId] = {
          user_id: userId,
          user_email: `user_${userId.substring(0, 8)}`, // Simplified email display
          total_tokens: 0,
          total_cost: 0,
          actions_count: 0,
          last_activity: record.created_at
        }
      }
      
      userTotals[userId].total_tokens += record.tokens_used
      userTotals[userId].total_cost += record.cost_estimate
      userTotals[userId].actions_count += 1
      
      // Keep the most recent activity date
      if (new Date(record.created_at) > new Date(userTotals[userId].last_activity)) {
        userTotals[userId].last_activity = record.created_at
      }
    })

    // Convert to array and sort by total cost
    return Object.values(userTotals)
      .sort((a, b) => b.total_cost - a.total_cost)
      .slice(0, limit)

  } catch (error) {
    console.error('Token usage by user error:', error)
    return []
  }
}

export default {
  trackTokenUsage,
  calculateTokenCost,
  getTokenSummary,
  getAdminTokenSummary,
  getTokenUsageByUser
}
