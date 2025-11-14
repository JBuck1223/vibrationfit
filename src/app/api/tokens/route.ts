// /src/app/api/tokens/route.ts
// API route for fetching token balance, transactions, and usage history

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface TokenBalanceData {
  total_active: number
  total_expired: number
  grants_breakdown: any[]
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get token balance - calculated as: SUM(unexpired grants) - SUM(usage)
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('get_user_token_balance', { p_user_id: user.id })
      .single()

    if (balanceError) {
      console.error('Error fetching token balance:', balanceError)
      return NextResponse.json({ error: 'Failed to fetch token balance' }, { status: 500 })
    }

    const balance = balanceData as TokenBalanceData
    const actualBalance = balance?.total_active || 0
    const totalExpired = balance?.total_expired || 0
    const grantsBreakdown = balance?.grants_breakdown || []

    // Get recent transactions for audit trail (last 50)
    const { data: transactions, error: transactionsError } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
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

    // Calculate total granted from token_transactions (includes expired)
    const { data: allGrants, error: grantsError } = await supabase
      .from('token_transactions')
      .select('tokens_used')
      .eq('user_id', user.id)
      .in('action_type', ['subscription_grant', 'renewal_grant', 'trial_grant', 'token_pack_purchase', 'pack_purchase', 'admin_grant'])
      .gt('tokens_used', 0) // Grants are positive

    const totalGranted = (allGrants || []).reduce((sum: number, grant: any) => sum + grant.tokens_used, 0)

    // Calculate total used from token_usage
    const { data: allUsage, error: allUsageError } = await supabase
      .from('token_usage')
      .select('tokens_used')
      .eq('user_id', user.id)
      .eq('success', true)
      .not('action_type', 'in', '(admin_grant,subscription_grant,trial_grant,token_pack_purchase,admin_deduct)')

    const totalUsed = (allUsage || []).reduce((sum: number, usage: any) => sum + usage.tokens_used, 0)

    // Calculate usage breakdown (only AI operations, not grants)
    const actionBreakdown = (usageHistory || [])
      .filter((usage: any) => 
        usage.tokens_used > 0 && 
        !['admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct'].includes(usage.action_type)
      )
      .reduce((acc: any, usage: any) => {
        const action = usage.action_type
        if (!acc[action]) {
          acc[action] = { count: 0, tokens: 0 }
        }
        acc[action].count++
        acc[action].tokens += usage.tokens_used
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
      balance: actualBalance, // Active tokens calculated from token_transactions and token_usage
      totalExpired, // Expired tokens (not counted in balance)
      totalUsed, // Total consumed tokens from token_usage
      totalGranted, // Total granted from token_transactions (includes expired)
      grantsBreakdown, // Breakdown by grant type
      transactions: formattedTransactions,
      transactionsOnly: transactions || [],
      usageOnly: usageHistory || [],
      actionBreakdown,
      // Debug info
      _debug: {
        activeBalance: actualBalance,
        expiredTokens: totalExpired,
        grantsCount: (allGrants || []).length,
        recentTransactionsCount: (transactions || []).length,
        recentUsageCount: (usageHistory || []).length,
      }
    })

  } catch (error: any) {
    console.error('Token API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
