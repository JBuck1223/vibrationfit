// ============================================================================
// Fetch Real Costs from OpenAI API
// ============================================================================
// Fetches actual billed costs from OpenAI and updates database

interface OpenAIUsageData {
  aggregation_timestamp: number
  n_requests: number
  operation: string
  snapshot_id: string
  n_context_tokens_total: number
  n_generated_tokens_total: number
  cost?: number
}

interface OpenAICostData {
  object: string
  data: {
    amount: {
      value: number
      currency: string
    }
    aggregation_timestamp: number
  }[]
}

/**
 * Fetch usage data from OpenAI (daily aggregated)
 */
export async function fetchOpenAIUsageData(
  startDate: Date,
  endDate: Date
): Promise<OpenAIUsageData[] | null> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  try {
    const start = Math.floor(startDate.getTime() / 1000)
    const end = Math.floor(endDate.getTime() / 1000)
    
    // OpenAI Usage API endpoint
    const url = `https://api.openai.com/v1/organization/usage?start_time=${start}&end_time=${end}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`OpenAI Usage API error: ${response.status} - ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching OpenAI usage:', error)
    return null
  }
}

/**
 * Fetch actual costs from OpenAI Costs API
 */
export async function fetchOpenAICosts(
  startDate: Date,
  endDate: Date
): Promise<OpenAICostData | null> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  try {
    const start = startDate.toISOString().split('T')[0]  // YYYY-MM-DD
    const end = endDate.toISOString().split('T')[0]      // YYYY-MM-DD
    
    // OpenAI Costs API endpoint
    const url = `https://api.openai.com/v1/organization/costs?start_date=${start}&end_date=${end}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`OpenAI Costs API error: ${response.status} - ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching OpenAI costs:', error)
    return null
  }
}

/**
 * Calculate cost per request from aggregated daily data
 * Note: OpenAI's API gives aggregated data, not per-request costs
 * This estimates cost per request based on token usage
 */
export function calculateCostPerRequest(
  usageData: OpenAIUsageData[],
  totalCost: number
): number {
  const totalRequests = usageData.reduce((sum, d) => sum + d.n_requests, 0)
  return totalRequests > 0 ? totalCost / totalRequests : 0
}

/**
 * Update database with real costs for a date range
 * This uses the aggregated cost data to update individual records
 */
export async function updateRealCosts(
  supabase: any,
  startDate: Date,
  endDate: Date
): Promise<{
  updated: number
  totalActualCost: number
  errors: string[]
}> {
  const result = {
    updated: 0,
    totalActualCost: 0,
    errors: [] as string[]
  }

  try {
    // Fetch actual costs from OpenAI
    const costsData = await fetchOpenAICosts(startDate, endDate)
    
    if (!costsData || !costsData.data || costsData.data.length === 0) {
      result.errors.push('No cost data returned from OpenAI')
      return result
    }

    // Calculate total actual cost for the period
    const totalCostUSD = costsData.data.reduce((sum, item) => {
      return sum + (item.amount.value || 0)
    }, 0)
    
    result.totalActualCost = Math.round(totalCostUSD * 100) // Convert to cents

    // Get all pending records in this date range
    const { data: pendingRecords, error: fetchError } = await supabase
      .from('token_usage')
      .select('id, calculated_cost_cents, openai_request_id, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('reconciliation_status', 'pending')
      .not('openai_request_id', 'is', null)

    if (fetchError) {
      result.errors.push(`Database fetch error: ${fetchError.message}`)
      return result
    }

    if (!pendingRecords || pendingRecords.length === 0) {
      result.errors.push('No pending records found in date range')
      return result
    }

    // Calculate total estimated cost for these records
    const totalEstimatedCents = pendingRecords.reduce((sum: number, r: any) => sum + (r.calculated_cost_cents || 0), 0)

    // Calculate scaling factor (actual / estimated)
    const scalingFactor = totalEstimatedCents > 0 
      ? result.totalActualCost / totalEstimatedCents
      : 1

    console.log(`Reconciling ${pendingRecords.length} records`)
    console.log(`Total estimated: $${totalEstimatedCents / 100}`)
    console.log(`Total actual: $${result.totalActualCost / 100}`)
    console.log(`Scaling factor: ${scalingFactor.toFixed(4)}`)

    // Update each record with proportional actual cost
    for (const record of pendingRecords) {
      const estimatedCents = record.calculated_cost_cents || 0
      const actualCents = Math.round(estimatedCents * scalingFactor)
      
      const difference = Math.abs(actualCents - estimatedCents)
      const differencePercent = estimatedCents > 0 
        ? (difference / estimatedCents * 100)
        : 0

      // Determine status
      const status = (differencePercent <= 5 || difference <= 5) ? 'matched' : 'discrepancy'

      const { error: updateError } = await supabase
        .from('token_usage')
        .update({
          actual_cost_cents: actualCents,
          reconciliation_status: status,
          reconciled_at: new Date().toISOString()
        })
        .eq('id', record.id)

      if (updateError) {
        result.errors.push(`Failed to update ${record.id}: ${updateError.message}`)
      } else {
        result.updated++
      }
    }

    return result

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    return result
  }
}

