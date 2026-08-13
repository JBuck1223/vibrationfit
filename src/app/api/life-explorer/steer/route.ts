import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * The lead explorer's console. Accepts either or both:
 * - queue: ordered wonder-item ids — position 1 is the question the next
 *   lesson is built around. Wonders not in the queue get priority = null.
 * - direction: continue | deepen | wrap_up (expedition-level steer).
 *
 * Lessons are still generated one at a time at full freshness — the
 * instructor reorders the plan (questions), never stale pre-built lessons.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const expeditionId = body.expedition_id as string | undefined
  if (!expeditionId) {
    return NextResponse.json({ error: 'expedition_id required' }, { status: 400 })
  }

  if (Array.isArray(body.queue)) {
    const queue = body.queue as string[]
    // Clear all priorities for the expedition, then set queue order.
    const { error: clearError } = await supabase
      .from('le_wonder_items')
      .update({ priority: null, updated_at: new Date().toISOString() })
      .eq('expedition_id', expeditionId)
      .not('priority', 'is', null)
    if (clearError) {
      return NextResponse.json({ error: clearError.message }, { status: 500 })
    }
    for (let i = 0; i < queue.length; i++) {
      const { error } = await supabase
        .from('le_wonder_items')
        .update({ priority: i + 1, updated_at: new Date().toISOString() })
        .eq('id', queue[i])
        .eq('expedition_id', expeditionId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  if (body.direction) {
    if (!['continue', 'deepen', 'wrap_up'].includes(body.direction)) {
      return NextResponse.json({ error: 'invalid direction' }, { status: 400 })
    }
    const { error } = await supabase
      .from('le_expeditions')
      .update({
        steer: { direction: body.direction, updated_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      })
      .eq('id', expeditionId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
