// ============================================================================
// OpenAI Cost Reconciliation Admin API
// ============================================================================
// Upload OpenAI billing CSV and reconcile against database records

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  parseOpenAIBillingCSV, 
  reconcileBillingData, 
  getReconciliationSummary 
} from '@/lib/openai/reconciliation'

/**
 * POST: Upload OpenAI billing CSV and reconcile
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
    const { csvContent, dryRun = false } = body

    if (!csvContent) {
      return NextResponse.json(
        { error: 'CSV content required' },
        { status: 400 }
      )
    }

    // Parse CSV
    const billingRows = parseOpenAIBillingCSV(csvContent)
    
    if (billingRows.length === 0) {
      return NextResponse.json(
        { error: 'No valid billing rows found in CSV' },
        { status: 400 }
      )
    }

    console.log(`Parsed ${billingRows.length} billing rows from CSV`)

    // Dry run mode - just preview what would happen
    if (dryRun) {
      const preview = billingRows.slice(0, 10).map(row => ({
        request_id: row.request_id || 'N/A',
        model: row.model || 'N/A',
        tokens: row.total_tokens || 0,
        cost_usd: row.cost_usd || 0
      }))

      return NextResponse.json({
        message: 'Dry run - no changes made',
        totalRows: billingRows.length,
        preview,
        success: true
      })
    }

    // Reconcile billing data
    const result = await reconcileBillingData(billingRows, supabase)

    // Get updated summary
    const summary = await getReconciliationSummary(supabase)

    return NextResponse.json({
      message: 'Reconciliation complete',
      result,
      summary,
      success: true
    })

  } catch (error) {
    console.error('Reconciliation error:', error)
    return NextResponse.json(
      { 
        error: 'Reconciliation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET: Get reconciliation summary
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

    // Get summary
    const summary = await getReconciliationSummary(supabase)

    // Get recent discrepancies
    const { data: discrepancies } = await supabase
      .from('token_usage')
      .select('id, action_type, model_used, calculated_cost_cents, actual_cost_cents, openai_request_id, created_at')
      .eq('reconciliation_status', 'discrepancy')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get pending reconciliations
    const { data: pending } = await supabase
      .from('token_usage')
      .select('count')
      .eq('reconciliation_status', 'pending')
      .single()

    return NextResponse.json({
      summary,
      discrepancies: discrepancies || [],
      pendingCount: pending?.count || 0,
      success: true
    })

  } catch (error) {
    console.error('Error fetching reconciliation summary:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

