/**
 * Activation enrichment — vision audio, personalized song, manifestation images.
 *
 * POST /api/activation/[id]/enrich
 * Called by the Immersion screen after entry; never gates the core experience.
 * Idempotent: ready assets are skipped, in-flight ones (fresher than 5 min)
 * are left alone, failed ones retry. The song completes asynchronously via
 * Mureka — the client polls /api/songs/poll/[taskId] and the activation GET
 * flips its state to ready.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runEnrichment, type ActivationRow } from '@/lib/activation/orchestrator'

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
    if (!['ready', 'entered'].includes(row.status)) {
      return NextResponse.json({ error: 'Activation is not ready yet' }, { status: 409 })
    }

    const { errors } = await runEnrichment(supabase, row)

    return NextResponse.json({
      asset_status: row.asset_status,
      song_id: row.song_id,
      audio_set_id: row.audio_set_id,
      errors,
    })
  } catch (error) {
    console.error('[activation/enrich] error:', error)
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 })
  }
}
