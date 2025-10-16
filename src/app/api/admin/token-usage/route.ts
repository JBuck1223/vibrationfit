import { NextRequest, NextResponse } from 'next/server'
import { getAdminTokenSummary, getTokenUsageByUser } from '@/lib/tokens/tracking'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Admin token usage API called')
    
    // Check admin authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('User:', user?.email, 'Auth error:', authError)
    
    if (authError || !user) {
      console.log('Authentication failed')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is admin
    const adminEmails = ['buckinghambliss@gmail.com']
    const isAdmin = adminEmails.includes(user.email || '') || user.user_metadata?.is_admin
    
    console.log('Is admin:', isAdmin, 'Email:', user.email)
    
    if (!isAdmin) {
      console.log('Admin access denied')
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '100')
    const type = searchParams.get('type') || 'summary' // 'summary' or 'by-user'

    if (type === 'summary') {
      // Get overall token usage summary
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
      // Get token usage by user
      const userUsage = await getTokenUsageByUser(days, limit)
      
      return NextResponse.json({
        user_usage: userUsage,
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
