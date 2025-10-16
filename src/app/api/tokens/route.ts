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

    // Get usage history from centralized token_usage table
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

    // Calculate stats from centralized data
    const totalUsed = profile?.vibe_assistant_tokens_used || 0
    const totalGranted = (usageHistory || [])
      .filter((usage: any) => usage.action_type === 'admin_grant')
      .reduce((sum: number, usage: any) => sum + usage.tokens_used, 0)

    const actionBreakdown = (usageHistory || [])
      .filter((usage: any) => usage.tokens_used > 0 && usage.action_type !== 'admin_grant')
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

    return NextResponse.json({
      balance: profile?.vibe_assistant_tokens_remaining || 0,
      totalUsed,
      totalGranted,
      transactions: usageHistory || [],
      actionBreakdown,
    })

  } catch (error: any) {
    console.error('Token API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

