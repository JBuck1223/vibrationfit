import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncKitRunStatus, type KitRunRow } from '@/lib/activation-kit/orchestrator'

/**
 * GET /api/activation-kit/runs/[id]
 *
 * Status for the kit progress card. Lazily syncs async assets (the mix
 * finishes in the audio-mixer Lambda) before returning.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('activation_kit_runs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!data) return NextResponse.json({ error: 'Run not found' }, { status: 404 })

  const run = await syncKitRunStatus(supabase, data as KitRunRow)
  return NextResponse.json({ run })
}
