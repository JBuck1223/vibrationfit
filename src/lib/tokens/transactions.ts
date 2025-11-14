// ============================================================================
// Token Transactions System
// ============================================================================
// Handles financial transactions: grants, purchases, deductions
// Separate from token_usage which tracks AI operations

import { createClient as createServerClient } from '@/lib/supabase/server'

// Note: token_transactions table uses action_type (like token_usage), not transaction_type
// Schema: action_type, tokens_used, tokens_remaining (not balance_before/balance_after)
export interface TokenTransactionInput {
  user_id: string
  action_type: string // Uses token_action_type enum (admin_grant, token_pack_purchase, etc.)
  tokens_used: number // Positive for grants/purchases, negative for deductions
  estimated_cost_usd?: number
  openai_model?: string
  prompt_tokens?: number
  completion_tokens?: number
  metadata?: Record<string, any>
  amount_paid_cents?: number // For purchases
  currency?: string
  stripe_payment_intent_id?: string
  stripe_session_id?: string
  subscription_id?: string
  token_pack_id?: string
  notes?: string
  created_by?: string
}

export interface TokenTransaction extends TokenTransactionInput {
  id?: string
  tokens_remaining: number // Calculated - balance after this transaction
  created_at?: string
}

/**
 * Record a token transaction (grant, purchase, deduction)
 * This inserts into token_balances AND records in token_transactions for audit trail
 * Note: token_transactions table uses action_type, tokens_used, tokens_remaining
 */
export async function recordTokenTransaction(
  transaction: TokenTransactionInput,
  supabaseClient?: any
): Promise<void> {
  try {
    const supabase = supabaseClient || await createServerClient()
    
    // Get current balance from token_balances
    const { data: balanceData } = await supabase
      .rpc('get_user_token_balance', { p_user_id: transaction.user_id })
      .single()
    
    const balanceBefore = balanceData?.total_active || 0
    
    // Ensure user profile exists (for backwards compatibility with other parts of system)
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', transaction.user_id)

    if (!profiles || profiles.length === 0) {
      // Profile doesn't exist, create it (no token fields)
      console.log('Profile not found, creating default profile for user:', transaction.user_id)
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: transaction.user_id,
          storage_quota_gb: 1
        })
      
      if (createError) {
        console.error('Failed to create user profile:', createError)
        throw new Error(`Failed to create user profile: ${createError.message}`)
      }
    }
    const tokensUsed = transaction.tokens_used
    const isGrant = tokensUsed > 0 && ['admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase'].includes(transaction.action_type)
    const isDeduction = tokensUsed < 0 || transaction.action_type === 'admin_deduct'
    
    // Handle grants: insert into token_balances
    if (isGrant) {
      let grantType = 'admin'
      let expiresAt: string | null = null
      
      if (transaction.action_type === 'token_pack_purchase') {
        grantType = 'purchase'
        expiresAt = null // Never expires
      } else if (transaction.action_type === 'admin_grant') {
        grantType = 'admin'
        expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      } else if (transaction.action_type === 'subscription_grant') {
        grantType = '28day'
        expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      } else if (transaction.action_type === 'trial_grant') {
        grantType = 'trial'
        expiresAt = new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      await supabase.from('token_balances').insert({
        user_id: transaction.user_id,
        grant_type: grantType,
        tokens_granted: tokensUsed,
        tokens_remaining: tokensUsed,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt,
        subscription_id: transaction.subscription_id || null,
        token_pack_id: transaction.token_pack_id || null,
        metadata: transaction.metadata || {}
      })
    } else if (isDeduction) {
      // Handle deductions: use FIFO
      const { data: deductResult, error: deductError } = await supabase
        .rpc('deduct_tokens_with_fifo', {
          p_user_id: transaction.user_id,
          p_tokens_to_deduct: Math.abs(tokensUsed)
        })
      
      if (deductError || !deductResult?.success) {
        throw new Error('Failed to deduct tokens')
      }
    }
    
    // Get balance after operation
    const { data: balanceAfterData } = await supabase
      .rpc('get_user_token_balance', { p_user_id: transaction.user_id })
      .single()
    
    const finalBalanceAfter = balanceAfterData?.total_active || 0

    // Build audit trail record
    const insertData: any = {
      user_id: transaction.user_id,
      action_type: transaction.action_type,
      tokens_used: tokensUsed,
      tokens_remaining: finalBalanceAfter,
    }
    // Add optional fields
    if (transaction.estimated_cost_usd !== undefined) {
      insertData.estimated_cost_usd = transaction.estimated_cost_usd
    }
    if (transaction.openai_model) {
      insertData.openai_model = transaction.openai_model
    }
    if (transaction.prompt_tokens !== undefined) {
      insertData.prompt_tokens = transaction.prompt_tokens
    }
    if (transaction.completion_tokens !== undefined) {
      insertData.completion_tokens = transaction.completion_tokens
    }
    if (transaction.metadata) {
      insertData.metadata = transaction.metadata
    }
    if (transaction.amount_paid_cents !== undefined) {
      insertData.amount_paid_cents = transaction.amount_paid_cents
    }
    if (transaction.currency) {
      insertData.currency = transaction.currency
    }
    if (transaction.stripe_payment_intent_id) {
      insertData.stripe_payment_intent_id = transaction.stripe_payment_intent_id
    }
    if (transaction.stripe_session_id) {
      insertData.stripe_session_id = transaction.stripe_session_id
    }
    if (transaction.subscription_id) {
      insertData.subscription_id = transaction.subscription_id
    }
    if (transaction.token_pack_id) {
      insertData.token_pack_id = transaction.token_pack_id
    }
    if (transaction.notes) {
      insertData.notes = transaction.notes
    }
    if (transaction.created_by) {
      insertData.created_by = transaction.created_by
    }

    // Insert transaction record
    const { data: insertedTransaction, error: transactionError } = await supabase
      .from('token_transactions')
      .insert(insertData)
      .select()
      .single()

    if (transactionError) {
      console.error('Failed to insert token transaction:', {
        error: transactionError,
        message: transactionError.message,
        details: transactionError.details,
        hint: transactionError.hint,
        code: transactionError.code,
        insertData
      })
      // Include more details in the error message
      const errorMsg = transactionError.message || 'Unknown database error'
      const hint = transactionError.hint ? ` Hint: ${transactionError.hint}` : ''
      const details = transactionError.details ? ` Details: ${transactionError.details}` : ''
      throw new Error(`Failed to insert token transaction: ${errorMsg}${hint}${details}`)
    }

    console.log('✅ Token transaction recorded successfully:', {
      id: insertedTransaction?.id,
      user_id: transaction.user_id,
      action_type: transaction.action_type,
      tokens_used: tokensUsed,
      balance_before: balanceBefore,
      balance_after: finalBalanceAfter
    })
    
    // Note: Balance now managed via token_balances table, no need to update user_profiles

  } catch (error: any) {
    console.error('Token transaction error:', error)
    // Re-throw so caller knows it failed
    throw error
  }
}

/**
 * Grant tokens to a user (subscription, trial, admin grant)
 */
export async function grantTokens(
  userId: string,
  amount: number,
  source: 'admin' | 'subscription' | 'trial',
  metadata?: Record<string, any>,
  supabaseClient?: any
): Promise<void> {
  // Map source to action_type
  const actionTypeMap: Record<string, string> = {
    'admin': 'admin_grant',
    'subscription': 'subscription_grant',
    'trial': 'trial_grant',
  }
  
  await recordTokenTransaction({
    user_id: userId,
    action_type: actionTypeMap[source] || 'admin_grant',
    tokens_used: amount, // Positive for grants
    metadata: metadata,
  }, supabaseClient)
}

/**
 * Record a token pack purchase
 */
export async function recordTokenPackPurchase(
  userId: string,
  packId: string,
  tokenAmount: number,
  amountPaidCents: number,
  stripePaymentIntentId: string,
  stripeSessionId: string,
  metadata?: Record<string, any>,
  supabaseClient?: any
): Promise<void> {
  await recordTokenTransaction({
    user_id: userId,
    action_type: 'token_pack_purchase',
    tokens_used: tokenAmount, // Positive for purchases
    amount_paid_cents: amountPaidCents,
    stripe_payment_intent_id: stripePaymentIntentId,
    stripe_session_id: stripeSessionId,
    token_pack_id: packId,
    metadata: metadata,
  }, supabaseClient)
}

/**
 * Record an admin deduction
 */
export async function recordAdminDeduction(
  userId: string,
  amount: number,
  notes?: string,
  createdBy?: string,
  supabaseClient?: any
): Promise<void> {
  await recordTokenTransaction({
    user_id: userId,
    action_type: 'admin_deduct',
    tokens_used: -amount, // Negative for deduction
    notes: notes,
    created_by: createdBy,
  }, supabaseClient)
}

