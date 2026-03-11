import { NextRequest, NextResponse } from 'next/server'
import { getAdminTokenSummary, getTokenUsageByUser, getReconciliationData } from '@/lib/tokens/tracking'
import { verifyAdminAccess } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '100')
    const type = searchParams.get('type') || 'summary'

    if (type === 'summary') {
      const summary = await getAdminTokenSummary(days)
      
      if (!summary) {
        return NextResponse.json({ error: 'Failed to fetch token summary' }, { status: 500 })
      }

      return NextResponse.json({
        summary,
        period_days: days,
        success: true
      })
    } else if (type === 'by-user') {
      const userUsage = await getTokenUsageByUser(days, limit)
      
      return NextResponse.json({
        user_usage: userUsage,
        period_days: days,
        limit,
        success: true
      })
    } else if (type === 'reconciliation') {
      const reconciliation = await getReconciliationData(days, limit)
      
      return NextResponse.json({
        reconciliation,
        period_days: days,
        limit,
        success: true
      })
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Admin token usage error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch token usage data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
