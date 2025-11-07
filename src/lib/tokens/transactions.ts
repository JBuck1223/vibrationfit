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
 * This updates the user balance AND records the transaction
 * Note: token_transactions table uses action_type, tokens_used, tokens_remaining
 */
export async function recordTokenTransaction(
  transaction: TokenTransactionInput,
  supabaseClient?: any
): Promise<void> {
  try {
    const supabase = supabaseClient || await createServerClient()
    
    // Calculate balance from transactions (source of truth)
    // Don't read from user_profiles.vibe_assistant_tokens_remaining - it's unreliable
    const { data: allTransactions } = await supabase
      .from('token_transactions')
      .select('tokens_used, action_type')
      .eq('user_id', transaction.user_id)
    
    const { data: allUsage } = await supabase
      .from('token_usage')
      .select('tokens_used, action_type, success')
      .eq('user_id', transaction.user_id)
    
    // Calculate grants
    const totalGrants = (allTransactions || [])
      .filter((tx: any) => 
        ['admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase'].includes(tx.action_type) &&
        tx.tokens_used > 0
      )
      .reduce((sum: number, tx: any) => sum + tx.tokens_used, 0)
    
    // Calculate usage
    const totalUsed = (allUsage || [])
      .filter((u: any) => 
        !['admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct'].includes(u.action_type) &&
        u.tokens_used > 0 &&
        u.success !== false
      )
      .reduce((sum: number, u: any) => sum + u.tokens_used, 0)
    
    // Calculate deductions
    const totalDeductions = (allTransactions || [])
      .filter((tx: any) => tx.action_type === 'admin_deduct' || tx.tokens_used < 0)
      .reduce((sum: number, tx: any) => sum + Math.abs(tx.tokens_used), 0)
    
    // Balance before this transaction
    const balanceBefore = Math.max(0, totalGrants - totalUsed - totalDeductions)
    
    // Ensure user profile exists (for backwards compatibility)
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', transaction.user_id)

    if (!profiles || profiles.length === 0) {
      // Profile doesn't exist, create it
      // NOTE: No default tokens - users start at 0
      console.log('Profile not found, creating default profile for user:', transaction.user_id)
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: transaction.user_id,
          vibe_assistant_tokens_remaining: 0, // No default tokens
          vibe_assistant_tokens_used: 0,
          storage_quota_gb: 1
        })
      
      if (createError) {
        console.error('Failed to create user profile:', createError)
        throw new Error(`Failed to create user profile: ${createError.message}`)
      }
    }
    const tokensUsed = transaction.tokens_used // Can be positive (grants) or negative (deductions)
    const balanceAfter = balanceBefore + tokensUsed

    // Ensure balance doesn't go negative (unless it's a deduction)
    const finalBalanceAfter = transaction.action_type === 'admin_deduct' 
      ? Math.max(0, balanceAfter)
      : balanceAfter

    // Build insert object matching actual schema
    const insertData: any = {
      user_id: transaction.user_id,
      action_type: transaction.action_type, // Required
      tokens_used: tokensUsed, // Required - positive for grants, negative for deductions
      tokens_remaining: finalBalanceAfter, // Required - balance after transaction
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

    console.log('✅ Token transaction inserted successfully:', insertedTransaction?.id)

    // Update user balance
    // NOTE: This update is approved because it's part of recordTokenTransaction
    // which creates the transaction record first. All token changes should go through this function.
    const { error: balanceError } = await supabase
      .from('user_profiles')
      .update({
        vibe_assistant_tokens_remaining: finalBalanceAfter,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', transaction.user_id)

    if (balanceError) {
      console.error('Failed to update user balance:', balanceError)
    } else {
      console.log('Token transaction recorded and balance updated:', {
        user_id: transaction.user_id,
        action_type: transaction.action_type,
        tokens_used: tokensUsed,
        balance_before: balanceBefore,
        balance_after: finalBalanceAfter
      })
    }

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

