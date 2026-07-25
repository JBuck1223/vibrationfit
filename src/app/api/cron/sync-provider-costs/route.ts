/**
 * Provider Cost Sync Cron Job
 *
 * GET /api/cron/sync-provider-costs
 *
 * Runs daily. Two responsibilities:
 * 1. Reconciles pending Vercel AI Gateway ledger rows against exact billed
 *    costs (GET /v1/generation), writing actual_cost_cents per request.
 * 2. Syncs provider billing APIs (OpenAI Costs API, Gateway credits, Mureka
 *    account billing) into provider_costs_daily — the source of truth used
 *    by the admin billing dashboard's variance panel.
 */

import { NextRequest, NextResponse } from 'next/server'
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

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // 1. Per-request gateway cost reconciliation
  const reconciliation = await reconcileGatewayCosts(supabase)

  // 2. Provider billing sync (independent — run all even if one fails)
  const [openai, vercelGateway, mureka, vercelInfra, aws, supabaseCosts] = await Promise.all([
    syncOpenAICosts(supabase, 7),
    syncGatewayCredits(supabase),
    syncMurekaBilling(supabase),
    syncVercelCosts(supabase, 7),
    syncAWSCosts(supabase, 7),
    syncSupabaseCosts(supabase, 7),
  ])

  const summary = {
    reconciliation,
    providers: {
      openai,
      vercel_gateway: vercelGateway,
      mureka,
      vercel_infra: vercelInfra,
      aws,
      supabase: supabaseCosts,
    },
    ran_at: new Date().toISOString(),
  }

  console.log('[cron/sync-provider-costs]', JSON.stringify(summary))

  return NextResponse.json(summary)
}
