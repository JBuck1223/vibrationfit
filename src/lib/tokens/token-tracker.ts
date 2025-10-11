// /src/lib/tokens/token-tracker.ts
// Precise token tracking for all AI operations

import { createClient } from '@/lib/supabase/server'

// ============================================================================
// TOKEN COSTS (OpenAI Pricing - January 2025)
// ============================================================================

export const TOKEN_COSTS = {
  // GPT-5 pricing (per 1M tokens)
  GPT5_INPUT: 10.00,   // $10 per 1M input tokens
  GPT5_OUTPUT: 30.00,  // $30 per 1M output tokens
  
  // GPT-4 Turbo pricing (per 1M tokens)
  GPT4_TURBO_INPUT: 10.00,
  GPT4_TURBO_OUTPUT: 30.00,
  
  // GPT-4o pricing (per 1M tokens) - Cheaper option
  GPT4O_INPUT: 2.50,
  GPT4O_OUTPUT: 10.00,
  
  // Whisper pricing (per minute)
  WHISPER_PER_MINUTE: 0.006,
  
  // DALL-E 3 pricing (per image)
  DALLE3_STANDARD: 0.040,
  DALLE3_HD: 0.080,
} as const

// ============================================================================
// TOKEN EQUIVALENTS (For non-token-based APIs)
// ============================================================================

export const TOKEN_EQUIVALENTS = {
  // DALL-E: Convert image cost to token equivalent
  // $0.040 per image ÷ $0.00002 per token (GPT-5 avg) = 2,000 tokens
  DALLE3_STANDARD: 2000,
  DALLE3_HD: 4000,
  
  // Whisper: Convert per-minute cost to token equivalent
  // $0.006 per minute ÷ $0.00002 per token = 300 tokens per minute
  WHISPER_PER_MINUTE: 300,
} as const

// ============================================================================
// CORE TOKEN TRACKING FUNCTIONS
// ============================================================================

/**
 * Calculate cost in USD for a token transaction
 */
export function calculateCost(params: {
  model: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}): number {
  const { model, promptTokens = 0, completionTokens = 0, totalTokens = 0 } = params
  
  // For models that report prompt/completion separately
  if (promptTokens > 0 || completionTokens > 0) {
    if (model.includes('gpt-5')) {
      return (
        (promptTokens / 1_000_000) * TOKEN_COSTS.GPT5_INPUT +
        (completionTokens / 1_000_000) * TOKEN_COSTS.GPT5_OUTPUT
      )
    }
    if (model.includes('gpt-4-turbo')) {
      return (
        (promptTokens / 1_000_000) * TOKEN_COSTS.GPT4_TURBO_INPUT +
        (completionTokens / 1_000_000) * TOKEN_COSTS.GPT4_TURBO_OUTPUT
      )
    }
    if (model.includes('gpt-4o')) {
      return (
        (promptTokens / 1_000_000) * TOKEN_COSTS.GPT4O_INPUT +
        (completionTokens / 1_000_000) * TOKEN_COSTS.GPT4O_OUTPUT
      )
    }
  }
  
  // Fallback: use average cost for total tokens
  const avgCostPerMillion = 20.00 // Conservative estimate
  return (totalTokens / 1_000_000) * avgCostPerMillion
}

/**
 * Deduct tokens from user's balance and log the transaction
 */
export async function deductTokens({
  userId,
  actionType,
  tokensUsed,
  model,
  promptTokens,
  completionTokens,
  metadata = {},
}: {
  userId: string
  actionType: string
  tokensUsed: number
  model?: string
  promptTokens?: number
  completionTokens?: number
  metadata?: any
}): Promise<{ success: boolean; remaining: number; error?: string }> {
  try {
    const supabase = await createClient()
    
    // 1. Get current user balance
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('vibe_assistant_tokens_remaining, vibe_assistant_tokens_used')
      .eq('user_id', userId)
      .single()
    
    if (profileError || !profile) {
      console.error('❌ TOKEN DEDUCTION: Profile not found', profileError)
      return { success: false, remaining: 0, error: 'Profile not found' }
    }
    
    // 2. Check if user has enough tokens
    const currentBalance = profile.vibe_assistant_tokens_remaining || 0
    
    if (currentBalance < tokensUsed) {
      console.warn('⚠️ TOKEN DEDUCTION: Insufficient balance', {
        userId,
        needed: tokensUsed,
        available: currentBalance,
      })
      return { 
        success: false, 
        remaining: currentBalance, 
        error: 'Insufficient tokens' 
      }
    }
    
    // 3. Calculate new balance
    const newBalance = currentBalance - tokensUsed
    const newUsed = (profile.vibe_assistant_tokens_used || 0) + tokensUsed
    
    // 4. Calculate cost
    const estimatedCost = model ? calculateCost({
      model,
      promptTokens,
      completionTokens,
      totalTokens: tokensUsed,
    }) : null
    
    // 5. Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        vibe_assistant_tokens_remaining: newBalance,
        vibe_assistant_tokens_used: newUsed,
      })
      .eq('user_id', userId)
    
    if (updateError) {
      console.error('❌ TOKEN DEDUCTION: Failed to update profile', updateError)
      return { success: false, remaining: currentBalance, error: 'Update failed' }
    }
    
    // 6. Log transaction
    const { error: logError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        action_type: actionType,
        tokens_used: tokensUsed,
        tokens_remaining: newBalance,
        estimated_cost_usd: estimatedCost,
        openai_model: model || null,
        prompt_tokens: promptTokens || null,
        completion_tokens: completionTokens || null,
        metadata,
      })
    
    if (logError) {
      console.error('⚠️ TOKEN DEDUCTION: Failed to log transaction', logError)
      // Don't fail the whole operation if logging fails
    }
    
    console.log('✅ TOKEN DEDUCTION SUCCESS:', {
      userId,
      actionType,
      tokensUsed,
      newBalance,
      estimatedCost: estimatedCost ? `$${estimatedCost.toFixed(4)}` : 'N/A',
    })
    
    return { success: true, remaining: newBalance }
    
  } catch (error) {
    console.error('❌ TOKEN DEDUCTION ERROR:', error)
    return { success: false, remaining: 0, error: 'Unexpected error' }
  }
}

/**
 * Grant tokens to a user (for subscriptions, renewals, packs)
 */
export async function grantTokens({
  userId,
  tokensToGrant,
  actionType = 'manual_adjustment',
  metadata = {},
}: {
  userId: string
  tokensToGrant: number
  actionType?: string
  metadata?: any
}): Promise<{ success: boolean; newBalance: number }> {
  try {
    const supabase = await createClient()
    
    // 1. Get current balance
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('vibe_assistant_tokens_remaining')
      .eq('user_id', userId)
      .single()
    
    if (profileError || !profile) {
      console.error('❌ TOKEN GRANT: Profile not found', profileError)
      return { success: false, newBalance: 0 }
    }
    
    // 2. Calculate new balance
    const currentBalance = profile.vibe_assistant_tokens_remaining || 0
    const newBalance = currentBalance + tokensToGrant
    
    // 3. Update profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        vibe_assistant_tokens_remaining: newBalance,
      })
      .eq('user_id', userId)
    
    if (updateError) {
      console.error('❌ TOKEN GRANT: Failed to update profile', updateError)
      return { success: false, newBalance: currentBalance }
    }
    
    // 4. Log transaction (negative tokens_used = grant)
    await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        action_type: actionType,
        tokens_used: -tokensToGrant, // Negative = grant
        tokens_remaining: newBalance,
        metadata,
      })
    
    console.log('✅ TOKEN GRANT SUCCESS:', {
      userId,
      tokensGranted: tokensToGrant,
      newBalance,
    })
    
    return { success: true, newBalance }
    
  } catch (error) {
    console.error('❌ TOKEN GRANT ERROR:', error)
    return { success: false, newBalance: 0 }
  }
}

/**
 * Check if user has enough tokens for an action
 */
export async function checkTokenBalance(
  userId: string,
  tokensNeeded: number
): Promise<{ hasEnough: boolean; balance: number }> {
  try {
    const supabase = await createClient()
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('vibe_assistant_tokens_remaining')
      .eq('user_id', userId)
      .single()
    
    const balance = profile?.vibe_assistant_tokens_remaining || 0
    
    return {
      hasEnough: balance >= tokensNeeded,
      balance,
    }
  } catch (error) {
    console.error('❌ TOKEN BALANCE CHECK ERROR:', error)
    return { hasEnough: false, balance: 0 }
  }
}

/**
 * Get user's token transaction history
 */
export async function getTokenHistory(
  userId: string,
  limit = 50
): Promise<any[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ TOKEN HISTORY ERROR:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('❌ TOKEN HISTORY ERROR:', error)
    return []
  }
}

/**
 * Format tokens for display (e.g., 5000000 -> "5M" or "5,000,000")
 */
export function formatTokens(tokens: number, abbreviated = false): string {
  if (abbreviated) {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(1)}M`
    }
    if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(1)}K`
    }
    return tokens.toString()
  }
  
  return tokens.toLocaleString()
}

