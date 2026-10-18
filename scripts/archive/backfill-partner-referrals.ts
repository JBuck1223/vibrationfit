/**
 * Backfill Partners referrals from past paid_conversion events.
 *
 * First verified referral wins: the earliest paid_conversion per referred
 * email. Customers with an active membership become 'active' referrals
 * (activated at their original purchase date); everyone else 'cancelled'.
 * No commissions are created: they start with each member's next payment.
 *
 *   npx tsx scripts/archive/backfill-partner-referrals.ts            # dry run
 *   npx tsx scripts/archive/backfill-partner-referrals.ts --apply    # write
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })

const apply = process.argv.includes('--apply')
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

async function main() {
  const { data: events, error } = await db
    .from('referral_events')
    .select('id, referrer_id, referred_email, referred_user_id, created_at')
    .eq('event_type', 'paid_conversion')
    .order('created_at', { ascending: true })
  if (error) throw error

  const { data: participants } = await db.from('referral_participants').select('id, user_id, email, referral_code')
  const { data: accounts } = await db.from('user_accounts').select('id, email')
  const { data: activeSubs } = await db
    .from('customer_subscriptions')
    .select('user_id, membership_tiers!inner(plan_category)')
    .eq('status', 'active')
    .eq('membership_tiers.plan_category', 'subscription')
  const { data: existing } = await db.from('referrals').select('referred_email, referred_user_id')

  const participantById = new Map((participants || []).map(p => [p.id, p]))
  const userIdByEmail = new Map((accounts || []).map(a => [a.email?.toLowerCase(), a.id]))
  const activeUsers = new Set((activeSubs || []).map(s => s.user_id))
  const existingEmails = new Set((existing || []).map(r => r.referred_email?.toLowerCase()))
  const existingUsers = new Set((existing || []).map(r => r.referred_user_id).filter(Boolean))

  const seen = new Set<string>()
  const rows: Record<string, unknown>[] = []
  const skipped: Record<string, number> = {}
  const skip = (reason: string) => (skipped[reason] = (skipped[reason] || 0) + 1)

  for (const ev of events || []) {
    const email = ev.referred_email?.trim().toLowerCase()
    if (!email) { skip('no_email'); continue }
    if (seen.has(email)) { skip('later_duplicate'); continue }
    seen.add(email)
    const referrer = participantById.get(ev.referrer_id)
    if (!referrer) { skip('referrer_missing'); continue }
    const userId = ev.referred_user_id || userIdByEmail.get(email) || null
    if ((userId && userId === referrer.user_id) || referrer.email?.toLowerCase() === email) { skip('self_referral'); continue }
    if (existingEmails.has(email) || (userId && existingUsers.has(userId))) { skip('already_recorded'); continue }

    const active = Boolean(userId && activeUsers.has(userId))
    rows.push({
      referrer_id: referrer.id,
      referred_user_id: userId,
      referred_email: email,
      source: 'organic_referral',
      attribution_event_id: ev.id,
      status: active ? 'active' : 'cancelled',
      first_paid_at: ev.created_at,
      activated_at: ev.created_at,
      status_changed_at: new Date().toISOString(),
    })
  }

  const byReferrer: Record<string, { active: number; cancelled: number }> = {}
  for (const r of rows) {
    const code = participantById.get(r.referrer_id as string)?.referral_code || '?'
    byReferrer[code] ||= { active: 0, cancelled: 0 }
    byReferrer[code][r.status as 'active' | 'cancelled']++
  }

  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', toInsert: rows.length, byReferrer, skipped }, null, 2))

  if (!apply || rows.length === 0) return
  const { error: insertError, count } = await db.from('referrals').insert(rows, { count: 'exact' })
  if (insertError) throw insertError
  console.log(`Inserted ${count ?? rows.length} referrals.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
