// ============================================================================
// Token Tracking System
// ============================================================================
// Comprehensive token usage tracking for all AI actions across the platform

import { createClient } from '@/lib/supabase/client'

export interface TokenUsage {
  id?: string
  user_id: string
  action_type: 'assessment_scoring' | 'vision_generation' | 'vision_refinement' | 'blueprint_generation' | 'chat_conversation' | 'audio_generation' | 'image_generation'
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
 * Track token usage for an AI action
 */
export async function trackTokenUsage(usage: Omit<TokenUsage, 'id' | 'created_at'>): Promise<void> {
  try {
    const supabase = createClient()
    
    // Calculate cost based on model and token usage
    const costEstimate = calculateTokenCost(usage.model_used, usage.input_tokens || 0, usage.output_tokens || 0)
    
    const tokenRecord: Omit<TokenUsage, 'id'> = {
      ...usage,
      cost_estimate: costEstimate,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('token_usage')
      .insert(tokenRecord)

    if (error) {
      console.error('Failed to track token usage:', error)
      // Don't throw - we don't want token tracking failures to break the main flow
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
