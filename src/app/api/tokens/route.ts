// /src/app/api/tokens/route.ts
// API route for fetching token balance and transaction history

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current balance
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('vibe_assistant_tokens_remaining, vibe_assistant_tokens_used')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Get transaction history
    const { data: transactions, error: txError } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (txError) {
      console.error('Error fetching transactions:', txError)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Calculate stats
    const totalUsed = profile?.vibe_assistant_tokens_used || 0
    const totalGranted = (transactions || [])
      .filter((tx: any) => tx.tokens_used < 0)
      .reduce((sum: number, tx: any) => sum + Math.abs(tx.tokens_used), 0)

    const actionBreakdown = (transactions || [])
      .filter((tx: any) => tx.tokens_used > 0)
      .reduce((acc: any, tx: any) => {
        const action = tx.action_type
        if (!acc[action]) {
          acc[action] = { count: 0, tokens: 0, cost: 0 }
        }
        acc[action].count++
        acc[action].tokens += tx.tokens_used
        acc[action].cost += tx.estimated_cost_usd || 0
        return acc
      }, {})

    return NextResponse.json({
      balance: profile?.vibe_assistant_tokens_remaining || 0,
      totalUsed,
      totalGranted,
      transactions: transactions || [],
      actionBreakdown,
    })

  } catch (error: any) {
    console.error('Token API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

