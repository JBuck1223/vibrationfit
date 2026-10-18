/**
 * Daily Partners maintenance (run by /api/cron/partners):
 *  1. Finalize profit snapshots for cycles that have ended, using real usage.
 *     Commissions still waiting out the refund window move to 'held' if the
 *     member fell below the profit floor.
 *  2. Approve commissions whose refund hold has passed.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { loadPartnerSettings } from './settings'
import { writeProfitSnapshot } from './ledger'

/** Give provider cost reconciliation a couple of days to land before finalizing. */
const FINALIZE_LAG_MS = 2 * 24 * 60 * 60 * 1000
const BATCH = 200

export interface DailyResult {
  finalized: number
  heldBelowFloor: number
  approved: number
  errors: number
}

export async function runPartnersDaily(db: SupabaseClient, now = new Date()): Promise<DailyResult> {
  const result: DailyResult = { finalized: 0, heldBelowFloor: 0, approved: 0, errors: 0 }
  const s = await loadPartnerSettings(db)
  const nowIso = now.toISOString()

  // 1. Finalize ended cycles
  const { data: open } = await db
    .from('profit_snapshots')
    .select('payment_id, subscription_id, cycle_start, cycle_end')
    .eq('costs_final', false)
    .lte('cycle_end', new Date(now.getTime() - FINALIZE_LAG_MS).toISOString())
    .limit(BATCH)

  for (const snap of open || []) {
    try {
      const { data: payment } = await db
        .from('payment_history')
        .select('id, user_id, subscription_id, amount, status, paid_at, created_at, tax_cents, discount_cents, processing_fee_cents, refunded_cents, chargeback_cents, membership_tier_id, cycle_start, cycle_end, metadata')
        .eq('id', snap.payment_id)
        .maybeSingle()
      if (!payment) continue
      const intervalDays = Math.max(
        1,
        Math.round((new Date(snap.cycle_end).getTime() - new Date(snap.cycle_start).getTime()) / (24 * 60 * 60 * 1000)),
      )
      const { belowFloor } = await writeProfitSnapshot(db, { ...payment, cycle_start: snap.cycle_start, cycle_end: snap.cycle_end }, s, {
        intervalDays,
        final: true,
      })
      result.finalized++

      if (belowFloor) {
        const { data: held } = await db
          .from('commission_ledger')
          .update({ status: 'held', hold_reason: 'below_profit_floor' })
          .eq('source_payment_id', payment.id)
          .eq('entry_type', 'referral_commission')
          .eq('status', 'pending')
          .select('id')
        result.heldBelowFloor += held?.length || 0
      }
    } catch (err) {
      console.error('[partners daily] finalize failed for payment', snap.payment_id, err)
      result.errors++
    }
  }

  // 2. Release commissions (and their partial reversals) past the refund hold
  const { data: approved, error } = await db
    .from('commission_ledger')
    .update({ status: 'approved', decided_at: nowIso })
    .eq('status', 'pending')
    .in('entry_type', ['referral_commission', 'reversal', 'adjustment'])
    .lte('hold_until', nowIso)
    .select('id')
  if (error) {
    console.error('[partners daily] release failed', error)
    result.errors++
  } else {
    result.approved = approved?.length || 0
  }

  return result
}
