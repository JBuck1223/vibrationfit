import { NextResponse } from 'next/server'
import { createAdminClient, verifyAdminAccess } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/activations
 * Admin overview of the free Activation funnel: every activation row with the
 * owner's email/name and per-asset enrichment status.
 */
export async function GET() {
  const access = await verifyAdminAccess()
  if ('error' in access) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const admin = createAdminClient()

  const { data: activations, error } = await admin
    .from('activations')
    .select(
      'id, user_id, status, category, desired_emotional_state, vision_statement, asset_status, inspired_next_step, ready_at, entered_at, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = activations ?? []
  const userIds = Array.from(new Set(rows.map((a) => a.user_id)))

  let accountsById: Record<string, { email: string; full_name: string | null }> = {}
  if (userIds.length > 0) {
    const { data: accounts } = await admin
      .from('user_accounts')
      .select('id, email, full_name')
      .in('id', userIds)
    accountsById = Object.fromEntries(
      (accounts ?? []).map((a) => [a.id, { email: a.email, full_name: a.full_name }])
    )
  }

  const enriched = rows.map((a) => ({
    ...a,
    email: accountsById[a.user_id]?.email ?? null,
    name: accountsById[a.user_id]?.full_name ?? null,
  }))

  const total = rows.length
  const stats = {
    total,
    ready: rows.filter((a) => a.ready_at).length,
    entered: rows.filter((a) => a.entered_at).length,
    inProgress: rows.filter((a) => !a.ready_at).length,
    last7Days: rows.filter(
      (a) => Date.now() - new Date(a.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
    ).length,
  }

  return NextResponse.json({ activations: enriched, stats })
}
