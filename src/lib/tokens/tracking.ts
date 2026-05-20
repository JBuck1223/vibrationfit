// ============================================================================
// Token Tracking System
// ============================================================================
// Comprehensive token usage tracking for all AI actions across the platform

import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export interface TokenUsage {
  id?: string
  user_id: string
  action_type: 'vision_generation' | 'vision_refinement' | 'blueprint_generation' | 'chat_conversation' | 'audio_generation' | 'image_generation' | 'transcription' | 'admin_grant' | 'admin_deduct' | 'subscription_grant' | 'trial_grant' | 'token_pack_purchase' | 'life_vision_category_summary' | 'life_vision_master_assembly' | 'life_vision_category_generation' | 'prompt_suggestions' | 'frequency_flip' | 'vibrational_analysis' | 'viva_scene_generation' | 'north_star_reflection' | 'voice_profile_analysis' | 'vision_board_ideas' | 'imagination_starter' | 'focus_story_generation' | 'incantation_generation' | 'story_refinement' | 'song_lyrics_generation'
  model_used: string
  tokens_used: number
  input_tokens?: number
  output_tokens?: number
  calculated_cost_cents?: number // Accurate cost from ai_model_pricing
  // Audio-specific fields
  audio_seconds?: number
  audio_duration_formatted?: string
  // OpenAI Reconciliation Fields (added Nov 16, 2025)
  openai_request_id?: string
  openai_created?: number
  system_fingerprint?: string
  actual_cost_cents?: number
  reconciliation_status?: 'pending' | 'matched' | 'discrepancy' | 'not_applicable'
  reconciled_at?: string
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

// ⚠️ DEPRECATED: Legacy hardcoded costs (kept for backwards compatibility)
// New code should query ai_model_pricing table for accurate pricing
const TOKEN_COSTS_LEGACY: Record<string, { input: number; output: number }> = {
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
 * Normalize model names returned by providers/gateways:
 *  - Strips OpenAI date suffix (gpt-4o-2024-08-06 -> gpt-4o, gpt-4o-mini-2024-07-18 -> gpt-4o-mini)
 *  - Strips Vercel AI Gateway provider prefix (google/gemini-2.5-pro -> gemini-2.5-pro,
 *    openai/gpt-4o -> gpt-4o, anthropic/claude-3-5-sonnet -> claude-3-5-sonnet)
 *
 * This lets us keep a single canonical row per model in ai_model_pricing.
 */
function normalizeModelName(model: string): string {
  if (!model) return model
  let normalized = model
  // Strip Vercel AI Gateway / provider prefix (single segment ending in '/')
  // e.g. "google/gemini-2.5-pro" -> "gemini-2.5-pro"
  normalized = normalized.replace(/^(google|openai|anthropic|meta|mistral|deepseek|xai|cohere|perplexity)\//i, '')
  // Strip OpenAI date suffix: -YYYY-MM or -YYYY-MM-DD at end
  normalized = normalized.replace(/-\d{4}-\d{2}(-\d{2})?$/, '')
  return normalized
}

/**
 * Round a USD value (cents) to 4 decimal places matching the
 * numeric(12,4) column precision in token_usage.calculated_cost_cents.
 */
function roundCents(cents: number): number {
  return Math.round(cents * 10000) / 10000
}

/**
 * Calculate accurate cost (in cents) from ai_model_pricing table.
 * Handles all unit_type values currently stored in the DB:
 *   - text models: input_price_per_1m / output_price_per_1m (per 1M tokens)
 *   - whisper:     unit_type = 'minute' | 'second',  price_per_unit
 *   - tts:         unit_type = 'character' | 'per_1k_chars',  price_per_unit
 *   - images:      unit_type = 'image' | starts with 'image_',  price_per_unit
 *
 * Falls back to hardcoded legacy table only if no active pricing row exists.
 */
async function calculateAccurateTokenCost(
  supabase: any,
  model: string,
  inputTokens: number,
  outputTokens: number,
  audioSeconds?: number
): Promise<number> {
  const normalizedModel = normalizeModelName(model)

  const { data: pricing } = await supabase
    .from('ai_model_pricing')
    .select('*')
    .eq('model_name', normalizedModel)
    .eq('is_active', true)
    .single()

  if (pricing) {
    const unit = (pricing.unit_type ?? '') as string
    const pricePerUnit = Number(pricing.price_per_unit ?? 0)

    // Whisper / audio transcription — price per minute or per second
    if (unit === 'minute' && audioSeconds) {
      return roundCents((audioSeconds / 60) * pricePerUnit * 100)
    }
    if (unit === 'second' && audioSeconds) {
      return roundCents(audioSeconds * pricePerUnit * 100)
    }

    // Image models — flat price per image (DALL-E rows use 'image_1024x1024' etc.)
    if (unit === 'image' || unit.startsWith('image_')) {
      return roundCents(pricePerUnit * 100)
    }

    // TTS — character-based pricing. DB stores either 'character' (per char)
    // or 'per_1k_chars' (price for 1000 characters). Input chars passed via inputTokens.
    if ((unit === 'character' || unit === 'per_1k_chars') && inputTokens > 0) {
      return roundCents((inputTokens / 1000) * pricePerUnit * 100)
    }

    // Text / chat models — pricing per 1M tokens
    const inputPricePer1m = Number(pricing.input_price_per_1m ?? 0)
    const outputPricePer1m = Number(pricing.output_price_per_1m ?? 0)
    const inputCost = (inputTokens / 1_000_000) * inputPricePer1m
    const outputCost = (outputTokens / 1_000_000) * outputPricePer1m
    return roundCents((inputCost + outputCost) * 100)
  }

  // Fallback to legacy costs if model not in pricing table
  if (normalizedModel !== model) {
    console.warn(`Model ${model} (normalized to ${normalizedModel}) not found in ai_model_pricing, using legacy costs`)
  } else {
    console.warn(`Model ${model} not found in ai_model_pricing, using legacy costs`)
  }
  return calculateTokenCostLegacy(normalizedModel, inputTokens, outputTokens)
}

/**
 * Check if user has sufficient tokens before allowing an AI action (server-side)
 * Returns null if user has enough tokens, or an error response object if insufficient.
 * Household members automatically resolve to the shared pool via get_user_token_balance.
 */
export async function validateTokenBalance(
  userId: string, 
  estimatedTokens: number,
  supabaseClient?: any
): Promise<{ error: string; tokensRemaining: number; status: number } | null> {
  try {
    const supabase = supabaseClient || await createServerClient()
    
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('get_user_token_balance', { p_user_id: userId })
      .single()
    
    if (balanceError) {
      console.error('Error getting token balance:', balanceError)
      return null
    }
    
    const tokensRemaining = (balanceData as any)?.total_active || 0

    if (tokensRemaining >= estimatedTokens) {
      return null
    }

    return {
      error: 'Insufficient tokens remaining',
      tokensRemaining,
      status: 402
    }
  } catch (error) {
    console.error('Error validating token balance:', error)
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
      // assessment_scoring: 200, // Removed - never implemented (Nov 11, 2025)
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
 * NOW SUPPORTS HOUSEHOLD TOKEN DEDUCTION
 */
export async function trackTokenUsage(usage: Omit<TokenUsage, 'id' | 'created_at'>, supabaseClient?: any): Promise<void> {
  try {
    // Default to server client for API routes (has proper permissions)
    // If supabaseClient is provided, use it (allows override for testing)
    const supabase = supabaseClient || await createServerClient()

    // Calculate accurate cost from ai_model_pricing table
    // Normalize model name before storing and calculating costs
    const normalizedModel = normalizeModelName(usage.model_used)

    // Audio seconds may be supplied either at the top level (preferred) or in metadata (legacy callers)
    const audioSeconds = usage.audio_seconds ?? (usage.metadata?.audio_seconds as number | undefined)

    const accurateCostCents = await calculateAccurateTokenCost(
      supabase,
      normalizedModel,
      usage.input_tokens || 0,
      usage.output_tokens || 0,
      audioSeconds
    )

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

    // If the pricing table did not produce a cost but the caller supplied a
    // known cost (e.g. provider returned an exact charge), prefer it.
    const finalCalculatedCostCents =
      accurateCostCents > 0
        ? accurateCostCents
        : (usage.actual_cost_cents && usage.actual_cost_cents > 0
            ? roundCents(usage.actual_cost_cents)
            : 0)

    // 1. Insert audit trail record (for user history)
    const { error: auditError } = await supabase
      .from('token_usage')
      .insert({
        user_id: usage.user_id,
        action_type: usage.action_type,
        model_used: normalizedModel,
        tokens_used: effectiveTokens,
        calculated_cost_cents: finalCalculatedCostCents, // Accurate cost from ai_model_pricing (fallback: caller-provided actual)
        input_tokens: usage.input_tokens || 0,
        output_tokens: usage.output_tokens || 0,
        // Audio-specific fields
        audio_seconds: audioSeconds ?? null,
        audio_duration_formatted: usage.audio_duration_formatted || null,
        // OpenAI reconciliation fields
        openai_request_id: usage.openai_request_id,
        openai_created: usage.openai_created,
        system_fingerprint: usage.system_fingerprint,
        reconciliation_status: usage.openai_request_id ? 'pending' : 'not_applicable',
        success: usage.success,
        error_message: usage.error_message,
        metadata: usage.metadata || {},
        created_at: new Date().toISOString()
      })

    if (auditError) {
      console.error('Failed to insert audit trail:', auditError)
    }

    // 2. Token deduction is automatic!
    // Balance calculated on-the-fly as: SUM(unexpired grants) - SUM(usage)
    // No need for complex FIFO deduction - token_usage record above handles it
    
    if (usage.success && effectiveTokens > 0) {
      console.log('✅ Token usage tracked:', {
        user_id: usage.user_id,
        tokens: effectiveTokens,
        action: usage.action_type
      })
    }
    
    // Balance automatically reflects this usage via get_user_token_balance()

  } catch (error) {
    console.error('Token tracking error:', error)
    // Silent fail - tracking shouldn't break the main functionality
  }
}

/**
 * ⚠️ DEPRECATED: Legacy cost calculation using hardcoded prices
 * Use calculateAccurateTokenCost instead
 */
function calculateTokenCostLegacy(model: string, inputTokens: number, outputTokens: number): number {
  const costs = TOKEN_COSTS_LEGACY[model]
  if (!costs) {
    console.warn(`Unknown model for legacy cost calculation: ${model}`)
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
      .select('id, user_id, action_type, model_used, tokens_used, input_tokens, output_tokens, calculated_cost_cents, openai_request_id, openai_created, system_fingerprint, actual_cost_cents, reconciliation_status, reconciled_at, success, error_message, metadata, created_at')
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
    const totalCost = usage.reduce((sum, record) => sum + (record.calculated_cost_cents || 0), 0)
    const actionsCount = usage.length

    // Model breakdown
    const modelBreakdown: Record<string, { tokens: number; cost: number; count: number }> = {}
    usage.forEach(record => {
      if (!modelBreakdown[record.model_used]) {
        modelBreakdown[record.model_used] = { tokens: 0, cost: 0, count: 0 }
      }
      modelBreakdown[record.model_used].tokens += record.tokens_used
      modelBreakdown[record.model_used].cost += (record.calculated_cost_cents || 0)
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
      dailyUsage[date].cost += (record.calculated_cost_cents || 0)
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
    const supabase = createServiceClient() // Use service role to bypass RLS
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: usage, error } = await supabase
      .from('token_usage')
      .select('id, user_id, action_type, model_used, tokens_used, input_tokens, output_tokens, calculated_cost_cents, openai_request_id, openai_created, system_fingerprint, actual_cost_cents, reconciliation_status, reconciled_at, success, error_message, metadata, created_at')
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
    // Use calculated_cost_cents for accurate costs
    const totalTokens = usage.reduce((sum, record) => sum + record.tokens_used, 0)
    const totalCost = usage.reduce((sum, record) => sum + (record.calculated_cost_cents ?? 0), 0)
    const actionsCount = usage.length

    // Model breakdown
    const modelBreakdown: Record<string, { tokens: number; cost: number; count: number }> = {}
    usage.forEach(record => {
      if (!modelBreakdown[record.model_used]) {
        modelBreakdown[record.model_used] = { tokens: 0, cost: 0, count: 0 }
      }
      modelBreakdown[record.model_used].tokens += record.tokens_used
      modelBreakdown[record.model_used].cost += (record.calculated_cost_cents ?? 0)
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
      dailyUsage[date].cost += (record.calculated_cost_cents ?? 0)
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
    const supabase = createServiceClient() // Use service role to bypass RLS
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: usage, error } = await supabase
      .from('token_usage')
      .select(`
        user_id,
        tokens_used,
        calculated_cost_cents,
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
      userTotals[userId].total_cost += (record.calculated_cost_cents ?? 0)
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

/**
 * Get reconciliation data - OpenAI cost tracking
 * Shows actual vs estimated costs, request IDs, and reconciliation status
 */
export async function getReconciliationData(days: number = 30, limit: number = 50) {
  try {
    const supabase = createServiceClient() // Use service role to bypass RLS
    
    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get reconciliation summary stats
    const { data: stats } = await supabase
      .from('token_usage')
      .select('reconciliation_status')
      .gte('created_at', startDate.toISOString())
    
    const statusCounts = {
      pending: 0,
      matched: 0,
      discrepancy: 0,
      not_applicable: 0
    }
    
    stats?.forEach(row => {
      if (row.reconciliation_status && row.reconciliation_status in statusCounts) {
        statusCounts[row.reconciliation_status as keyof typeof statusCounts]++
      }
    })

    // Get cost accuracy metrics from the view
    const { data: costData } = await supabase
      .from('token_usage_with_costs')
      .select('accurate_cost_usd, actual_cost_usd, reconciliation_accuracy_percentage')
      .gte('created_at', startDate.toISOString())
      .not('actual_cost_usd', 'is', null)
    
    const totalEstimated = costData?.reduce((sum, row) => sum + (row.accurate_cost_usd || 0), 0) || 0
    const totalActual = costData?.reduce((sum, row) => sum + (row.actual_cost_usd || 0), 0) || 0
    const avgAccuracy = costData?.length 
      ? costData.reduce((sum, row) => sum + (row.reconciliation_accuracy_percentage || 0), 0) / costData.length 
      : 0

    // Get recent requests with reconciliation data
    const { data: recentRequests } = await supabase
      .from('token_usage_with_costs')
      .select(`
        id,
        action_type,
        model_used,
        openai_request_id,
        accurate_cost_usd,
        actual_cost_usd,
        reconciliation_status,
        created_at
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    return {
      pending_count: statusCounts.pending,
      matched_count: statusCounts.matched,
      discrepancy_count: statusCounts.discrepancy,
      not_applicable_count: statusCounts.not_applicable,
      total_estimated_cost: totalEstimated,
      total_actual_cost: totalActual,
      average_accuracy: avgAccuracy,
      recent_requests: recentRequests?.map(req => ({
        id: req.id,
        action_type: req.action_type,
        model_used: req.model_used,
        openai_request_id: req.openai_request_id,
        estimated_cost_usd: req.accurate_cost_usd || 0,
        actual_cost_usd: req.actual_cost_usd,
        reconciliation_status: req.reconciliation_status || 'pending',
        created_at: req.created_at
      })) || []
    }

  } catch (error) {
    console.error('Reconciliation data error:', error)
    return {
      pending_count: 0,
      matched_count: 0,
      discrepancy_count: 0,
      not_applicable_count: 0,
      total_estimated_cost: 0,
      total_actual_cost: 0,
      average_accuracy: 0,
      recent_requests: []
    }
  }
}

export default {
  trackTokenUsage,
  getTokenSummary,
  getAdminTokenSummary,
  getTokenUsageByUser,
  getReconciliationData
}
