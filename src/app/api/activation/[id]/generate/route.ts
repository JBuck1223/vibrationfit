/**
 * Activation core generation — gates "Activation Ready".
 *
 * POST /api/activation/[id]/generate
 * Builds the vision object then the Future-Self Story, Incantation, and
 * SparkQuery in parallel, plus text-only manifestation rows. Idempotent:
 * re-running only regenerates missing/failed assets. Records activation_ready
 * the first time the core payload exists.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateCoreAssets, type ActivationRow } from '@/lib/activation/orchestrator'
import { recordActivationEvent } from '@/lib/activation/events'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const { data: activation } = await supabase
      .from('activations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!activation) return NextResponse.json({ error: 'Activation not found' }, { status: 404 })

    const row = activation as ActivationRow
    if (!row.current_state?.trim() || !row.dream_response?.want?.trim() || !row.category) {
      return NextResponse.json({ error: 'VIVA still needs a little more from your conversation' }, { status: 400 })
    }

    const wasReady = !!row.ready_at
    const firstName =
      (user.user_metadata?.first_name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
      null

    let result
    try {
      result = await generateCoreAssets(supabase, row, { firstName })
    } catch (err) {
      const e = err as Error & { insufficientTokens?: boolean; status?: number }
      await recordActivationEvent(createAdminClient(), {
        eventType: 'activation_generate_failed',
        activationId: row.id,
        userId: user.id,
        eventData: { message: e.message, insufficientTokens: !!e.insufficientTokens },
      })
      if (e.insufficientTokens) {
        return NextResponse.json({ error: e.message, insufficientTokens: true }, { status: e.status || 402 })
      }
      throw err
    }

    if (result.ready && !wasReady) {
      await recordActivationEvent(createAdminClient(), {
        eventType: 'activation_ready',
        activationId: row.id,
        userId: user.id,
        eventData: { category: row.category, partial_errors: result.errors },
      })
    }

    return NextResponse.json({
      ready: result.ready,
      errors: result.errors,
      activation: {
        id: row.id,
        status: row.status,
        vision_statement: row.vision_statement,
        essence: row.essence,
        story_id: row.story_id,
        incantation_id: row.incantation_id,
        spark_query_id: row.spark_query_id,
        manifestation_ids: row.manifestation_ids,
        asset_status: row.asset_status,
      },
    })
  } catch (error) {
    console.error('[activation/generate] error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Generation failed',
    }, { status: 500 })
  }
}
