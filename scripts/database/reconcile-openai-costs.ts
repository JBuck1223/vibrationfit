#!/usr/bin/env tsx
/**
 * OpenAI Cost Reconciliation Script
 * 
 * Usage:
 *   1. Download usage report from OpenAI dashboard
 *   2. Run: npx tsx scripts/database/reconcile-openai-costs.ts path/to/openai-usage.csv
 * 
 * This script:
 * - Parses OpenAI's billing CSV export
 * - Matches records against token_usage table by request_id
 * - Updates actual_cost_cents and reconciliation_status
 * - Reports matches, discrepancies, and not-found records
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface BillingRow {
  request_id?: string
  timestamp?: string
  model?: string
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  cost_usd?: number
}

function parseCSV(csvPath: string): BillingRow[] {
  const content = fs.readFileSync(csvPath, 'utf-8')
  const lines = content.trim().split('\n')
  
  if (lines.length < 2) {
    console.error('❌ CSV file is empty or has no data rows')
    return []
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const rows: BillingRow[] = []

  console.log('📋 CSV Headers:', headers)

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const row: BillingRow = {}

    headers.forEach((header, index) => {
      const value = values[index]?.trim()
      
      if (header.includes('request') && header.includes('id')) {
        row.request_id = value
      } else if (header.includes('timestamp') || header.includes('date') || header.includes('time')) {
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

async function reconcileRow(row: BillingRow): Promise<'matched' | 'discrepancy' | 'not_found' | 'error'> {
  try {
    if (!row.request_id) {
      console.log('⚠️  No request_id, skipping row')
      return 'not_found'
    }

    // Find matching record
    const { data: records, error: fetchError } = await supabase
      .from('token_usage')
      .select('id, calculated_cost_cents, openai_request_id')
      .eq('openai_request_id', row.request_id)
      .limit(1)

    if (fetchError) {
      console.error('❌ Error fetching record:', fetchError)
      return 'error'
    }

    if (!records || records.length === 0) {
      console.log(`⚠️  Request ${row.request_id} not found in database`)
      return 'not_found'
    }

    const record = records[0]
    const actualCostCents = row.cost_usd ? Math.round(row.cost_usd * 100) : 0
    const estimatedCostCents = record.calculated_cost_cents || 0
    
    const difference = actualCostCents - estimatedCostCents
    const differencePercent = estimatedCostCents > 0 
      ? Math.abs(difference / estimatedCostCents * 100)
      : 0

    // Consider it a match if within 5% or 5 cents
    const isMatch = differencePercent <= 5 || Math.abs(difference) <= 5

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
      console.error('❌ Error updating record:', updateError)
      return 'error'
    }

    if (!isMatch) {
      console.log(`⚠️  Discrepancy: ${row.request_id}`)
      console.log(`   Estimated: $${estimatedCostCents/100}, Actual: $${actualCostCents/100}, Diff: $${difference/100}`)
    }

    return isMatch ? 'matched' : 'discrepancy'
  } catch (error) {
    console.error('❌ Error reconciling row:', error)
    return 'error'
  }
}

async function main() {
  const csvPath = process.argv[2]

  if (!csvPath) {
    console.error('❌ Usage: npx tsx scripts/database/reconcile-openai-costs.ts <path-to-csv>')
    console.error('')
    console.error('Example:')
    console.error('  npx tsx scripts/database/reconcile-openai-costs.ts ~/Downloads/openai-usage-2024-12.csv')
    process.exit(1)
  }

  const resolvedPath = path.resolve(csvPath)

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ File not found: ${resolvedPath}`)
    process.exit(1)
  }

  console.log('🚀 Starting OpenAI Cost Reconciliation')
  console.log(`📁 CSV File: ${resolvedPath}`)
  console.log('')

  // Parse CSV
  console.log('📋 Parsing CSV...')
  const rows = parseCSV(resolvedPath)
  console.log(`✅ Found ${rows.length} billing rows`)
  console.log('')

  if (rows.length === 0) {
    console.error('❌ No valid rows found')
    process.exit(1)
  }

  // Show preview
  console.log('📊 Preview (first 3 rows):')
  rows.slice(0, 3).forEach((row, i) => {
    console.log(`  ${i + 1}. Request: ${row.request_id || 'N/A'}, Model: ${row.model}, Cost: $${row.cost_usd || 0}`)
  })
  console.log('')

  // Reconcile
  console.log('🔄 Reconciling...')
  const results = {
    matched: 0,
    discrepancies: 0,
    notFound: 0,
    errors: 0
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const result = await reconcileRow(row)

    switch (result) {
      case 'matched':
        results.matched++
        break
      case 'discrepancy':
        results.discrepancies++
        break
      case 'not_found':
        results.notFound++
        break
      case 'error':
        results.errors++
        break
    }

    // Progress indicator
    if ((i + 1) % 10 === 0) {
      console.log(`📊 Progress: ${i + 1}/${rows.length}`)
    }
  }

  console.log('')
  console.log('✅ Reconciliation Complete!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   ✅ Matched: ${results.matched}`)
  console.log(`   ⚠️  Discrepancies: ${results.discrepancies}`)
  console.log(`   ❓ Not Found: ${results.notFound}`)
  console.log(`   ❌ Errors: ${results.errors}`)
  console.log('')

  // Get overall summary from database
  const { data: summary } = await supabase
    .from('token_usage')
    .select('reconciliation_status, calculated_cost_cents, actual_cost_cents')
    .not('openai_request_id', 'is', null)

  if (summary) {
    const totalEstimated = summary.reduce((sum, r) => sum + (r.calculated_cost_cents || 0), 0)
    const totalActual = summary.reduce((sum, r) => sum + (r.actual_cost_cents || 0), 0)
    const difference = totalActual - totalEstimated

    console.log('💰 Cost Summary:')
    console.log(`   Estimated Total: $${(totalEstimated / 100).toFixed(2)}`)
    console.log(`   Actual Total: $${(totalActual / 100).toFixed(2)}`)
    console.log(`   Difference: $${(difference / 100).toFixed(2)} (${difference > 0 ? '+' : ''}${((difference / totalEstimated) * 100).toFixed(1)}%)`)
  }
}

main().catch(console.error)

