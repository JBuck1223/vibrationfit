// ============================================================================
// Fetch Real OpenAI Costs - Admin API
// ============================================================================
// Fetches actual costs from OpenAI API and updates database

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateRealCosts } from '@/lib/openai/fetch-real-costs'

/**
 * POST: Fetch real costs from OpenAI and update database
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { startDate, endDate } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate required (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    console.log(`Fetching real costs from ${startDate} to ${endDate}`)

    // Fetch and update
    const result = await updateRealCosts(supabase, start, end)

    return NextResponse.json({
      message: 'Real costs fetched and updated',
      updated: result.updated,
      totalActualCost: result.totalActualCost,
      totalActualCostUSD: (result.totalActualCost / 100).toFixed(2),
      errors: result.errors,
      success: result.errors.length === 0
    })

  } catch (error) {
    console.error('Error fetching real costs:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch real costs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET: Check pending reconciliations
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get pending count
    const { data: pending, error: pendingError } = await supabase
      .from('token_usage')
      .select('count')
      .eq('reconciliation_status', 'pending')
      .not('openai_request_id', 'is', null)
      .single()

    if (pendingError) {
      throw pendingError
    }

    // Get date range of pending records
    const { data: dateRange, error: dateError } = await supabase
      .from('token_usage')
      .select('created_at')
      .eq('reconciliation_status', 'pending')
      .not('openai_request_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)

    const oldestPending = dateRange && dateRange.length > 0 
      ? dateRange[0].created_at 
      : null

    return NextResponse.json({
      pendingCount: pending?.count || 0,
      oldestPending,
      recommendedAction: pending?.count && pending.count > 0
        ? 'Run reconciliation to update actual costs'
        : 'No pending reconciliations',
      success: true
    })

  } catch (error) {
    console.error('Error checking pending reconciliations:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

