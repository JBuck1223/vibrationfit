// /src/app/api/tokens/route.ts
// API route for fetching token balance, transactions, and usage history

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current balance from user_profiles
    let profile: any = null
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('vibe_assistant_tokens_remaining, vibe_assistant_tokens_used, vibe_assistant_total_cost')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      // Don't fail - use defaults
      profile = {
        vibe_assistant_tokens_remaining: 0, // No default tokens
        vibe_assistant_tokens_used: 0,
        vibe_assistant_total_cost: 0
      }
    } else if (!profileData) {
      // Profile doesn't exist - create it with defaults
      console.log('Profile does not exist, creating default profile for user:', user.id)
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          vibe_assistant_tokens_remaining: 0, // No default tokens
          vibe_assistant_tokens_used: 0,
          vibe_assistant_total_cost: 0
        })
        .select('vibe_assistant_tokens_remaining, vibe_assistant_tokens_used, vibe_assistant_total_cost')
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        // Use defaults even if creation fails
        profile = {
          vibe_assistant_tokens_remaining: 0, // No default tokens
          vibe_assistant_tokens_used: 0,
          vibe_assistant_total_cost: 0
        }
      } else {
        profile = newProfile
      }
    } else {
      profile = profileData
    }

    // Get ALL transactions for accurate totals (not just last 50)
    const { data: allTransactions, error: allTransactionsError } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', user.id)

    if (allTransactionsError) {
      console.error('Error fetching all transactions:', allTransactionsError)
      // Don't fail - transactions might not exist yet
    }

    // Get recent transactions for display (last 50)
    const { data: transactions, error: transactionsError } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
    }

    // Get ALL usage history for accurate totals (not just last 50)
    const { data: allUsageHistory, error: allUsageError } = await supabase
      .from('token_usage')
      .select('*')
      .eq('user_id', user.id)

    if (allUsageError) {
      console.error('Error fetching all usage history:', allUsageError)
      return NextResponse.json({ error: 'Failed to fetch usage history' }, { status: 500 })
    }

    // Get recent usage for display (last 50)
    const { data: usageHistory, error: usageError } = await supabase
      .from('token_usage')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (usageError) {
      console.error('Error fetching usage history:', usageError)
      return NextResponse.json({ error: 'Failed to fetch usage history' }, { status: 500 })
    }

    // Calculate total granted from ALL token_transactions (source of truth for financial transactions)
    // Only count grants/purchases (positive tokens_used and grant action types)
    const grantActionTypes = ['admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase']
    const totalGrantedFromTransactions = (allTransactions || [])
      .filter((tx: any) => 
        grantActionTypes.includes(tx.action_type) && 
        tx.tokens_used > 0
      )
      .reduce((sum: number, tx: any) => sum + tx.tokens_used, 0)

    // Also check ALL token_usage for grants (for backward compatibility with old data)
    // But only if we don't have transactions yet (to avoid double-counting)
    const grantsFromUsage = totalGrantedFromTransactions === 0 
      ? (allUsageHistory || [])
          .filter((usage: any) => 
            ['admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase'].includes(usage.action_type)
          )
          .reduce((sum: number, usage: any) => sum + usage.tokens_used, 0)
      : 0

    // Total granted: prefer transactions, fallback to usage if no transactions exist
    const totalGranted = totalGrantedFromTransactions > 0 
      ? totalGrantedFromTransactions 
      : grantsFromUsage

    // Calculate total used from ALL actual records (more accurate than user_profiles which might be stale)
    // Sum all AI usage (exclude grants and deductions)
    const totalUsedFromRecords = (allUsageHistory || [])
      .filter((usage: any) => 
        usage.success !== false && // Only successful operations
        usage.tokens_used > 0 &&
        !['admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct'].includes(usage.action_type)
      )
      .reduce((sum: number, usage: any) => sum + usage.tokens_used, 0)

    // Also check ALL token_transactions for deductions (if they're tracked there)
    const deductionsFromTransactions = (allTransactions || [])
      .filter((tx: any) => 
        tx.action_type === 'admin_deduct' || 
        tx.tokens_used < 0
      )
      .reduce((sum: number, tx: any) => sum + Math.abs(tx.tokens_used), 0)

    // Use calculated value from records (more accurate)
    const totalUsed = totalUsedFromRecords

    // Calculate actual balance from records
    // Balance = Total Granted - Total Used - Deductions
    const calculatedBalance = totalGranted - totalUsed - deductionsFromTransactions
    
    // ALWAYS use calculated balance from transactions (source of truth)
    // Ignore user_profiles.vibe_assistant_tokens_remaining - it's unreliable
    const actualBalance = Math.max(0, calculatedBalance) // Don't allow negative balance

    // Calculate usage breakdown (only AI operations, not grants)
    const actionBreakdown = (usageHistory || [])
      .filter((usage: any) => 
        usage.tokens_used > 0 && 
        !['admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct'].includes(usage.action_type)
      )
      .reduce((acc: any, usage: any) => {
        const action = usage.action_type
        if (!acc[action]) {
          acc[action] = { count: 0, tokens: 0, cost: 0 }
        }
        acc[action].count++
        acc[action].tokens += usage.tokens_used
        acc[action].cost += (usage.cost_estimate || 0) / 100 // Convert cents to dollars
        return acc
      }, {})

    // Combine transactions and usage for unified history view
    // Format transactions to match the expected interface
    const formattedTransactions = [
      ...(transactions || []).map((tx: any) => ({
        id: tx.id,
        type: 'transaction',
        action_type: tx.action_type, // Already in correct format
        tokens_used: tx.tokens_used, // Positive for grants, negative for deductions
        tokens_remaining: tx.tokens_remaining || 0,
        openai_model: tx.openai_model || null,
        created_at: tx.created_at,
        metadata: tx.metadata || {},
        amount_paid_cents: tx.amount_paid_cents,
        token_pack_id: tx.token_pack_id,
      })),
      // Format usage records
      ...(usageHistory || []).map((usage: any) => ({
        id: usage.id,
        type: 'usage',
        action_type: usage.action_type,
        tokens_used: usage.tokens_used,
        tokens_remaining: 0, // Will be calculated from balance
        openai_model: usage.model_used,
        created_at: usage.created_at,
        metadata: usage.metadata || {},
        cost_estimate: usage.cost_estimate,
      }))
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50) // Limit to 50 most recent

    return NextResponse.json({
      balance: actualBalance, // Calculated from records or from user_profiles
      totalUsed, // Calculated from records or from user_profiles
      totalGranted, // From token_transactions (preferred) or token_usage (fallback)
      totalCost: (profile?.vibe_assistant_total_cost || 0) / 100, // From user_profiles - convert cents to dollars
      transactions: formattedTransactions,
      transactionsOnly: transactions || [],
      usageOnly: usageHistory || [],
      actionBreakdown,
      // Debug info (can remove later)
      _debug: {
        profileBalance: profile?.vibe_assistant_tokens_remaining,
        profileUsed: profile?.vibe_assistant_tokens_used,
        calculatedBalance,
        totalGrantedFromTransactions,
        grantsFromUsage,
        totalUsedFromRecords,
        deductionsFromTransactions,
        allTransactionsCount: (allTransactions || []).length,
        allUsageCount: (allUsageHistory || []).length,
        recentTransactionsCount: (transactions || []).length,
        recentUsageCount: (usageHistory || []).length,
      }
    })

  } catch (error: any) {
    console.error('Token API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
