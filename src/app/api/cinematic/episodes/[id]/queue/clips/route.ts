import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { runClipQueue } from '@/lib/cinematic/queue-runner'

/**
 * POST: Kick off the full clip generation queue.
 * Runs server-side until all clips are terminal.
 * Safe to fire-and-forget -- leaving the page won't kill it.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params

  try {
    const result = await runClipQueue(id)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET: Poll current clip generation status without triggering new work.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const supabase = createAdminClient()

  const { data: clips } = await supabase
    .from('cu_clips')
    .select('id, sort_order, status')
    .eq('episode_id', id)
    .order('sort_order')

  const cs = clips ?? []
  return NextResponse.json({
    total: cs.length,
    pending: cs.filter((c) => c.status === 'pending' || c.status === 'rejected' || c.status === 'waiting_keyframes').length,
    generating: cs.filter((c) => c.status === 'generating').length,
    complete: cs.filter((c) => c.status === 'complete').length,
    approved: cs.filter((c) => c.status === 'approved').length,
    failed: cs.filter((c) => c.status === 'failed').length,
    allTerminal: cs.every((c) => ['approved', 'failed', 'complete'].includes(c.status)),
    clips: cs,
  })
}
