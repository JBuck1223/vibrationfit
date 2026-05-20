import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveBoardSnapshot, snapshotDateToEndOfDay } from '@/lib/vision-board/snapshot'

/**
 * GET /api/vision-board/snapshot?date=YYYY-MM-DD
 * Returns vision board items resolved to their status at the end of the chosen day.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dateParam = new URL(request.url).searchParams.get('date')
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json({ error: 'Valid date query param required (YYYY-MM-DD)' }, { status: 400 })
    }

    const snapshotEnd = snapshotDateToEndOfDay(dateParam)
    if (Number.isNaN(snapshotEnd.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    const [{ data: items, error: itemsError }, { data: events, error: eventsError }] = await Promise.all([
      supabase
        .from('vision_board_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('vision_board_item_status_events')
        .select('*')
        .eq('user_id', user.id)
        .lte('changed_at', snapshotEnd.toISOString())
        .order('changed_at', { ascending: false }),
    ])

    if (itemsError) {
      console.error('Error fetching vision board items for snapshot:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    if (eventsError) {
      console.error('Error fetching vision board status events:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch status history' }, { status: 500 })
    }

    const snapshotItems = resolveBoardSnapshot(items || [], events || [], dateParam)

    return NextResponse.json({
      date: dateParam,
      items: snapshotItems,
      counts: {
        total: snapshotItems.length,
        active: snapshotItems.filter((item) => item.status === 'active').length,
        actualized: snapshotItems.filter((item) => item.status === 'actualized').length,
        inactive: snapshotItems.filter((item) => item.status === 'inactive').length,
      },
    })
  } catch (error: unknown) {
    console.error('Vision board snapshot error:', error)
    const message = error instanceof Error ? error.message : 'Failed to build snapshot'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
