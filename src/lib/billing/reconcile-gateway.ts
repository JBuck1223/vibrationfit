// ============================================================================
// Vercel AI Gateway per-request cost reconciliation
// ============================================================================
// The gateway records the exact billed cost of every generation. Call sites
// store the generation id in token_usage.provider_request_id; this job looks
// each one up via GET /v1/generation and writes the actual cost back onto the
// ledger row, turning gateway costs from estimates into exact per-user spend.

import { GATEWAY_BASE_URL } from '@/lib/ai/gateway'

interface GatewayGenerationData {
  id: string
  total_cost?: number // USD
  usage?: number // USD (same as total_cost)
  tokens_prompt?: number
  tokens_completion?: number
  model?: string
}

export interface GatewayReconcileResult {
  scanned: number
  matched: number
  discrepancies: number
  notFound: number
  errors: string[]
}

/** Difference thresholds for matched vs discrepancy (same rule as OpenAI reconciliation). */
const MATCH_TOLERANCE_PERCENT = 5
const MATCH_TOLERANCE_CENTS = 5

async function fetchGenerationCost(generationId: string): Promise<GatewayGenerationData | null | 'not_found'> {
  const apiKey = process.env.AI_GATEWAY_API_KEY
  if (!apiKey) throw new Error('AI_GATEWAY_API_KEY not configured')

  const res = await fetch(`${GATEWAY_BASE_URL}/generation?id=${encodeURIComponent(generationId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (res.status === 404) return 'not_found'
  if (!res.ok) {
    throw new Error(`Gateway generation lookup failed: ${res.status} ${await res.text().catch(() => '')}`)
  }

  const body = await res.json()
  // Response follows the OpenRouter schema: { data: { ...generation } }
  return (body?.data ?? body) as GatewayGenerationData
}

/**
 * Reconcile pending gateway ledger rows against actual billed costs.
 *
 * Rows older than `maxAgeDays` whose generation can no longer be found are
 * marked not_applicable so they don't get rescanned forever.
 */
export async function reconcileGatewayCosts(
  supabase: any,
  options?: { batchSize?: number; maxAgeDays?: number }
): Promise<GatewayReconcileResult> {
  const batchSize = options?.batchSize ?? 200
  const maxAgeDays = options?.maxAgeDays ?? 7

  const result: GatewayReconcileResult = {
    scanned: 0,
    matched: 0,
    discrepancies: 0,
    notFound: 0,
    errors: [],
  }

  const { data: rows, error } = await supabase
    .from('token_usage')
    .select('id, provider_request_id, calculated_cost_cents, created_at')
    .eq('provider', 'vercel_gateway')
    .eq('reconciliation_status', 'pending')
    .not('provider_request_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(batchSize)

  if (error) {
    result.errors.push(`Failed to fetch pending rows: ${error.message}`)
    return result
  }

  if (!rows || rows.length === 0) return result

  // Lookups run ~2-3s each against the gateway; serial processing of a full
  // batch would blow past Vercel's function timeout. Process in small
  // concurrent chunks instead.
  const CONCURRENCY = 10
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    if (result.errors.length >= 5) break
    await Promise.all(rows.slice(i, i + CONCURRENCY).map((row: any) => reconcileRow(row)))
  }

  return result

  async function reconcileRow(row: {
    id: string
    provider_request_id: string
    calculated_cost_cents: number | null
    created_at: string
  }): Promise<void> {
    result.scanned++
    try {
      const generation = await fetchGenerationCost(row.provider_request_id)

      if (generation === 'not_found' || !generation) {
        const ageMs = Date.now() - new Date(row.created_at).getTime()
        if (ageMs > maxAgeDays * 24 * 60 * 60 * 1000) {
          // Note: reconciled_at stays NULL — the table's consistency check
          // requires reconciled_at and actual_cost_cents to be set together.
          await supabase
            .from('token_usage')
            .update({ reconciliation_status: 'not_applicable' })
            .eq('id', row.id)
        }
        result.notFound++
        return
      }

      const totalCostUsd = generation.total_cost ?? generation.usage ?? 0
      const actualCents = totalCostUsd * 100
      const estimatedCents = Number(row.calculated_cost_cents || 0)

      const difference = Math.abs(actualCents - estimatedCents)
      const differencePercent = estimatedCents > 0 ? (difference / estimatedCents) * 100 : 0
      const status =
        differencePercent <= MATCH_TOLERANCE_PERCENT || difference <= MATCH_TOLERANCE_CENTS
          ? 'matched'
          : 'discrepancy'

      const { error: updateError } = await supabase
        .from('token_usage')
        .update({
          actual_cost_cents: Math.round(actualCents * 10000) / 10000,
          reconciliation_status: status,
          reconciled_at: new Date().toISOString(),
        })
        .eq('id', row.id)

      if (updateError) {
        result.errors.push(`Failed to update ${row.id}: ${updateError.message}`)
      } else if (status === 'matched') {
        result.matched++
      } else {
        result.discrepancies++
      }
    } catch (err) {
      // Auth/config failures will fail every row — the chunk loop stops early
      // once errors accumulate.
      result.errors.push(
        `Row ${row.id} (${row.provider_request_id}): ${err instanceof Error ? err.message : 'unknown error'}`
      )
    }
  }
}
