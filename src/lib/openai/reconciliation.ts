// ============================================================================
// OpenAI Cost Reconciliation Service
// ============================================================================
// Fetches actual usage from OpenAI and reconciles against our database records

interface OpenAIUsageRequest {
  id: string
  object: string
  created: number
  model: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface OpenAIUsageResponse {
  object: string
  data: OpenAIUsageRequest[]
  has_more: boolean
}

interface ReconciliationResult {
  matched: number
  discrepancies: number
  notFound: number
  errors: string[]
}

/**
 * Fetch usage data from OpenAI for a specific date range
 * Note: OpenAI's usage API has limitations - it may not include all request-level details
 * This is more useful for aggregate billing reconciliation
 */
export async function fetchOpenAIUsage(
  startDate: Date,
  endDate: Date
): Promise<OpenAIUsageResponse | null> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  try {
    // Note: OpenAI doesn't have a public API endpoint for detailed per-request billing
    // You'll need to use their usage dashboard or exported billing reports
    // This is a placeholder for when/if OpenAI provides this API
    
    console.warn('OpenAI does not currently provide a public API for per-request billing')
    console.warn('You need to:')
    console.warn('1. Download usage reports from OpenAI dashboard')
    console.warn('2. Use the importOpenAIBillingReport function instead')
    
    return null
  } catch (error) {
    console.error('Error fetching OpenAI usage:', error)
    throw error
  }
}

/**
 * Calculate actual cost based on OpenAI's pricing
 * This matches the calculation in our ai_model_pricing table
 */
export function calculateOpenAICost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Prices per 1M tokens (as of Dec 2024)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4': { input: 30.00, output: 60.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'gpt-3.5-turbo-16k': { input: 3.00, output: 4.00 },
  }

  const modelPricing = pricing[model]
  if (!modelPricing) {
    console.warn(`Unknown model pricing: ${model}`)
    return 0
  }

  const inputCost = (promptTokens / 1_000_000) * modelPricing.input
  const outputCost = (completionTokens / 1_000_000) * modelPricing.output
  
  // Return in cents
  return Math.round((inputCost + outputCost) * 100)
}

/**
 * Import billing data from OpenAI's CSV export
 * OpenAI provides usage reports that can be downloaded from their dashboard
 */
export interface OpenAIBillingRow {
  request_id?: string
  timestamp?: string
  model?: string
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  cost_usd?: number
}

/**
 * Parse OpenAI billing CSV export
 * Format varies - this handles common formats
 */
export function parseOpenAIBillingCSV(csvContent: string): OpenAIBillingRow[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const rows: OpenAIBillingRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const row: OpenAIBillingRow = {}

    headers.forEach((header, index) => {
      const value = values[index]?.trim()
      
      if (header.includes('request') && header.includes('id')) {
        row.request_id = value
      } else if (header.includes('timestamp') || header.includes('date')) {
        row.timestamp = value
      } else if (header.includes('model')) {
        row.model = value
      } else if (header.includes('prompt') && header.includes('token')) {
        row.prompt_tokens = parseInt(value) || 0
      } else if (header.includes('completion') && header.includes('token')) {
        row.completion_tokens = parseInt(value) || 0
      } else if (header.includes('total') && header.includes('token')) {
        row.total_tokens = parseInt(value) || 0
      } else if (header.includes('cost') || header.includes('amount')) {
        row.cost_usd = parseFloat(value) || 0
      }
    })

    if (row.request_id || row.timestamp) {
      rows.push(row)
    }
  }

  return rows
}

/**
 * Reconcile billing data against our database
 * Updates actual_cost_cents and reconciliation_status
 */
export async function reconcileBillingData(
  billingRows: OpenAIBillingRow[],
  supabase: any
): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    matched: 0,
    discrepancies: 0,
    notFound: 0,
    errors: []
  }

  for (const row of billingRows) {
    try {
      // Match by request_id if available
      if (row.request_id) {
        await reconcileByRequestId(row, supabase, result)
      } 
      // Otherwise match by timestamp + model + tokens (less precise)
      else if (row.timestamp && row.model) {
        await reconcileByTimestamp(row, supabase, result)
      }
    } catch (error) {
      result.errors.push(`Error reconciling row: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return result
}

async function reconcileByRequestId(
  row: OpenAIBillingRow,
  supabase: any,
  result: ReconciliationResult
) {
  // Find matching record in our database
  const { data: usageRecords, error } = await supabase
    .from('token_usage')
    .select('id, calculated_cost_cents, openai_request_id')
    .eq('openai_request_id', row.request_id)
    .limit(1)

  if (error) {
    throw error
  }

  if (!usageRecords || usageRecords.length === 0) {
    result.notFound++
    return
  }

  const record = usageRecords[0]
  const actualCostCents = row.cost_usd 
    ? Math.round(row.cost_usd * 100)
    : calculateOpenAICost(
        row.model || '',
        row.prompt_tokens || 0,
        row.completion_tokens || 0
      )

  const estimatedCostCents = record.calculated_cost_cents || 0
  const differencePercent = estimatedCostCents > 0 
    ? Math.abs((actualCostCents - estimatedCostCents) / estimatedCostCents * 100)
    : 0

  // Consider it a match if within 5% or 5 cents
  const isMatch = differencePercent <= 5 || Math.abs(actualCostCents - estimatedCostCents) <= 5

  // Update the record
  const { error: updateError } = await supabase
    .from('token_usage')
    .update({
      actual_cost_cents: actualCostCents,
      reconciliation_status: isMatch ? 'matched' : 'discrepancy',
      reconciled_at: new Date().toISOString()
    })
    .eq('id', record.id)

  if (updateError) {
    throw updateError
  }

  if (isMatch) {
    result.matched++
  } else {
    result.discrepancies++
    console.log(`Discrepancy found for ${row.request_id}: estimated $${estimatedCostCents/100}, actual $${actualCostCents/100}`)
  }
}

async function reconcileByTimestamp(
  row: OpenAIBillingRow,
  supabase: any,
  result: ReconciliationResult
) {
  // Match by timestamp (within 1 minute), model, and token count
  const timestamp = new Date(row.timestamp!)
  const startTime = new Date(timestamp.getTime() - 60000).toISOString()
  const endTime = new Date(timestamp.getTime() + 60000).toISOString()

  const { data: usageRecords, error } = await supabase
    .from('token_usage')
    .select('id, calculated_cost_cents, tokens_used, model_used')
    .eq('model_used', row.model)
    .gte('created_at', startTime)
    .lte('created_at', endTime)
    .is('reconciliation_status', null)
    .limit(1)

  if (error) {
    throw error
  }

  if (!usageRecords || usageRecords.length === 0) {
    result.notFound++
    return
  }

  // Use the same reconciliation logic
  const record = usageRecords[0]
  const actualCostCents = row.cost_usd 
    ? Math.round(row.cost_usd * 100)
    : calculateOpenAICost(
        row.model || '',
        row.prompt_tokens || 0,
        row.completion_tokens || 0
      )

  const estimatedCostCents = record.calculated_cost_cents || 0
  const differencePercent = estimatedCostCents > 0 
    ? Math.abs((actualCostCents - estimatedCostCents) / estimatedCostCents * 100)
    : 0

  const isMatch = differencePercent <= 5 || Math.abs(actualCostCents - estimatedCostCents) <= 5

  const { error: updateError } = await supabase
    .from('token_usage')
    .update({
      actual_cost_cents: actualCostCents,
      reconciliation_status: isMatch ? 'matched' : 'discrepancy',
      reconciled_at: new Date().toISOString()
    })
    .eq('id', record.id)

  if (updateError) {
    throw updateError
  }

  if (isMatch) {
    result.matched++
  } else {
    result.discrepancies++
  }
}

/**
 * Get reconciliation summary
 */
export async function getReconciliationSummary(supabase: any) {
  const { data, error } = await supabase
    .from('token_usage')
    .select('reconciliation_status, calculated_cost_cents, actual_cost_cents')
    .not('openai_request_id', 'is', null)

  if (error) {
    throw error
  }

  const summary = {
    total: data.length,
    pending: 0,
    matched: 0,
    discrepancies: 0,
    notApplicable: 0,
    totalEstimatedCents: 0,
    totalActualCents: 0,
    totalDifferenceCents: 0
  }

  for (const record of data) {
    switch (record.reconciliation_status) {
      case 'pending':
        summary.pending++
        break
      case 'matched':
        summary.matched++
        break
      case 'discrepancy':
        summary.discrepancies++
        break
      case 'not_applicable':
        summary.notApplicable++
        break
    }

    summary.totalEstimatedCents += record.calculated_cost_cents || 0
    summary.totalActualCents += record.actual_cost_cents || 0
    summary.totalDifferenceCents += (record.actual_cost_cents || 0) - (record.calculated_cost_cents || 0)
  }

  return summary
}




