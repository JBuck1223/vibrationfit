import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { compareBoardOrder } from '@/lib/manifestations/board-order'

export const dynamic = 'force-dynamic'

/**
 * POST /api/manifestations/reorder
 * Persist the owner's board order. `orderedIds` is the visible order after a drag.
 * Items hidden by filters keep their relative place.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const rawIds: unknown = body?.orderedIds
    const orderedIds = Array.isArray(rawIds)
      ? rawIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : null
    if (!orderedIds || orderedIds.length === 0) {
      return NextResponse.json({ error: 'orderedIds is required' }, { status: 400 })
    }

    const { data: rows, error: loadError } = await supabase
      .from('manifestations')
      .select('id, sort_order, created_at')
      .eq('user_id', user.id)

    if (loadError || !rows) {
      console.error('[Manifestations] reorder load failed:', loadError)
      return NextResponse.json({ error: 'Failed to load manifestations' }, { status: 500 })
    }

    const owned = [...rows].sort(compareBoardOrder)
    const ownedIds = new Set(owned.map((row) => row.id))
    const visibleSet = new Set(orderedIds.filter((id) => ownedIds.has(id)))
    const queue = orderedIds.filter((id) => visibleSet.has(id))
    const rebuilt = owned.map((row) => {
      if (!visibleSet.has(row.id)) return row.id
      return queue.shift() ?? row.id
    })

    const results = await Promise.all(
      rebuilt.map((id, index) =>
        supabase
          .from('manifestations')
          .update({ sort_order: index })
          .eq('id', id)
          .eq('user_id', user.id),
      ),
    )
    const failed = results.find((result) => result.error)
    if (failed?.error) {
      console.error('[Manifestations] reorder update failed:', failed.error)
      return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Manifestations] reorder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
