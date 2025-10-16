import { NextRequest, NextResponse } from 'next/server'
import { getTokenSummary } from '@/lib/tokens/tracking'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get user's token usage summary
    const summary = await getTokenSummary(user.id, days)
    
    if (!summary) {
      return NextResponse.json({ error: 'Failed to fetch token usage' }, { status: 500 })
    }

    // Get detailed usage history
    const { data: usageHistory, error: historyError } = await supabase
      .from('token_usage')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (historyError) {
      console.error('Failed to fetch usage history:', historyError)
    }

    return NextResponse.json({
      summary,
      usage: usageHistory || [],
      period_days: days,
      success: true
    })

  } catch (error) {
    console.error('User token usage error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch token usage data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
