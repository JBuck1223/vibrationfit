#!/usr/bin/env tsx
/**
 * Fetch Real OpenAI Costs and Update Database
 * 
 * This fetches ACTUAL billed costs from OpenAI's API (not estimates)
 * and updates the actual_cost_cents field in your database.
 * 
 * Usage:
 *   npx tsx scripts/database/fetch-real-openai-costs.ts [start-date] [end-date]
 * 
 * Examples:
 *   npx tsx scripts/database/fetch-real-openai-costs.ts
 *   npx tsx scripts/database/fetch-real-openai-costs.ts 2024-12-01 2024-12-13
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { updateRealCosts } from '../../src/lib/openai/fetch-real-costs'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  console.log('🚀 Fetching Real OpenAI Costs\n')

  // Parse date arguments or use defaults
  let startDate: Date
  let endDate: Date

  if (process.argv[2] && process.argv[3]) {
    startDate = new Date(process.argv[2])
    endDate = new Date(process.argv[3])
  } else {
    // Default: yesterday
    endDate = new Date()
    endDate.setDate(endDate.getDate() - 1)
    endDate.setHours(23, 59, 59, 999)
    
    startDate = new Date(endDate)
    startDate.setDate(startDate.getDate())
    startDate.setHours(0, 0, 0, 0)
  }

  console.log(`📅 Date Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)
  console.log('')

  // Check pending records
  const { data: pendingRecords, error: checkError } = await supabase
    .from('token_usage')
    .select('count')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('reconciliation_status', 'pending')
    .not('openai_request_id', 'is', null)
    .single()

  if (checkError) {
    console.error('❌ Error checking pending records:', checkError)
    process.exit(1)
  }

  console.log(`📊 Found ${pendingRecords?.count || 0} pending records to reconcile`)
  console.log('')

  if (!pendingRecords?.count || pendingRecords.count === 0) {
    console.log('✅ No pending records to reconcile')
    process.exit(0)
  }

  // Fetch and update
  console.log('🔄 Fetching real costs from OpenAI...')
  const result = await updateRealCosts(supabase, startDate, endDate)

  console.log('')
  console.log('✅ Reconciliation Complete!\n')
  console.log('📊 Summary:')
  console.log(`   Records Updated: ${result.updated}`)
  console.log(`   Total Actual Cost: $${(result.totalActualCost / 100).toFixed(2)}`)
  
  if (result.errors.length > 0) {
    console.log(`\n⚠️  Errors (${result.errors.length}):`)
    result.errors.forEach(err => console.log(`   - ${err}`))
  }

  // Show updated status
  const { data: statusData } = await supabase
    .from('token_usage')
    .select('reconciliation_status, count')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .not('openai_request_id', 'is', null)

  if (statusData) {
    console.log('\n📈 Reconciliation Status:')
    const statusCounts: Record<string, number> = {}
    statusData.forEach((row: any) => {
      statusCounts[row.reconciliation_status] = row.count
    })
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })
  }
}

main().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})

