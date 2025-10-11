// /src/app/api/referral/rewards/route.ts
// Get user's referral rewards

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all rewards
    const { data: rewards, error } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 })
    }

    // Calculate total unclaimed rewards
    const unclaimedRewards = rewards?.filter(r => !r.is_claimed) || []

    return NextResponse.json({
      rewards: rewards || [],
      summary: {
        total: rewards?.length || 0,
        unclaimed: unclaimedRewards.length,
        freeMonths: unclaimedRewards.filter(r => r.reward_type === 'free_month').length,
      },
    })

  } catch (error) {
    console.error('Rewards fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

