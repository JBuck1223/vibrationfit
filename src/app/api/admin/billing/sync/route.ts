// ============================================================================
// Admin Billing Sync — manual trigger
// ============================================================================
// POST /api/admin/billing/sync
// Runs the same work as the daily cron on demand: gateway per-request cost
// reconciliation plus provider billing sync into provider_costs_daily.

import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createServiceClient } from '@/lib/supabase/service'
import { reconcileGatewayCosts } from '@/lib/billing/reconcile-gateway'
import {
  syncOpenAICosts,
  syncGatewayCredits,
  syncMurekaBilling,
} from '@/lib/billing/sync-provider-costs'
import {
  syncVercelCosts,
  syncAWSCosts,
  syncSupabaseCosts,
} from '@/lib/billing/sync-infra-costs'

export const maxDuration = 300

export async function POST() {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createServiceClient()

    const reconciliation = await reconcileGatewayCosts(supabase)
    const [openai, vercelGateway, mureka, vercelInfra, aws, supabaseCosts] = await Promise.all([
      // Manual sync pulls deep history so newly-added keys backfill past
      // months; the daily cron only needs a 7-day window.
      syncOpenAICosts(supabase, 180),
      syncGatewayCredits(supabase),
      syncMurekaBilling(supabase),
      syncVercelCosts(supabase, 180),
      syncAWSCosts(supabase, 180),
      syncSupabaseCosts(supabase, 90),
    ])

    return NextResponse.json({
      reconciliation,
      providers: {
        openai,
        vercel_gateway: vercelGateway,
        mureka,
        vercel_infra: vercelInfra,
        aws,
        supabase: supabaseCosts,
      },
      success: true,
    })
  } catch (error) {
    console.error('Admin billing sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
