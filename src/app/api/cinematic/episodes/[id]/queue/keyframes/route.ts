import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { runKeyframeQueue } from '@/lib/cinematic/queue-runner'

/**
 * POST: Kick off the full keyframe generation queue.
 * Runs server-side until all keyframes are terminal.
 * Safe to fire-and-forget -- leaving the page won't kill it.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params

  try {
    const result = await runKeyframeQueue(id)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET: Poll current keyframe generation status without triggering new work.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const supabase = createAdminClient()

  const { data: keyframes } = await supabase
    .from('cu_keyframes')
    .select('id, sort_order, status')
    .eq('episode_id', id)
    .order('sort_order')

  const kfs = keyframes ?? []
  return NextResponse.json({
    total: kfs.length,
    pending: kfs.filter((k) => k.status === 'pending' || k.status === 'rejected').length,
    generating: kfs.filter((k) => k.status === 'generating').length,
    complete: kfs.filter((k) => k.status === 'complete').length,
    approved: kfs.filter((k) => k.status === 'approved').length,
    failed: kfs.filter((k) => k.status === 'failed').length,
    allTerminal: kfs.every((k) => ['approved', 'failed', 'complete'].includes(k.status)),
    keyframes: kfs,
  })
}
