import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getEarliestMapSnapshotDate,
  isHistoricalMapDate,
  resolveMapPlanSnapshot,
  snapshotDateToEndOfDay,
} from '@/lib/map/snapshot'
import { todayDateString } from '@/lib/map/map-date-utils'
import type { CommitmentChangeEvent } from '@/lib/map/types'

/**
 * GET /api/map/snapshot?date=YYYY-MM-DD
 * Returns commitments active on the MAP at end of the chosen day.
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
      return NextResponse.json(
        { error: 'Valid date query param required (YYYY-MM-DD)' },
        { status: 400 },
      )
    }

    const snapshotEnd = snapshotDateToEndOfDay(dateParam)
    if (Number.isNaN(snapshotEnd.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    const today = todayDateString()
    const isHistorical = isHistoricalMapDate(dateParam, today)

    if (!isHistorical) {
      const { data: active, error: activeError } = await supabase
        .from('commitments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (activeError) {
        console.error('Error fetching active commitments:', activeError)
        return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
      }

      const { data: allEvents } = await supabase
        .from('commitment_change_events')
        .select('id, commitment_id, user_id, event_type, state, changed_at, source, map_activation_id')
        .eq('user_id', user.id)
        .order('changed_at', { ascending: true })

      const earliestFromEvents = getEarliestMapSnapshotDate(
        (allEvents || []) as CommitmentChangeEvent[],
      )

      return NextResponse.json({
        date: dateParam,
        plan: active ?? [],
        meta: {
          isHistorical: false,
          earliestDate: earliestFromEvents,
          date: dateParam,
        },
      })
    }

    const [{ data: events, error: eventsError }, { data: allEventsForEarliest }] = await Promise.all([
      supabase
        .from('commitment_change_events')
        .select('*')
        .eq('user_id', user.id)
        .lte('changed_at', snapshotEnd.toISOString())
        .order('changed_at', { ascending: false }),
      supabase
        .from('commitment_change_events')
        .select('id, commitment_id, user_id, event_type, state, changed_at, source, map_activation_id')
        .eq('user_id', user.id)
        .order('changed_at', { ascending: true }),
    ])

    if (eventsError) {
      console.error('Error fetching commitment change events:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch plan history' }, { status: 500 })
    }

    const plan = resolveMapPlanSnapshot(
      (events || []) as CommitmentChangeEvent[],
      dateParam,
    )

    const earliestDate = getEarliestMapSnapshotDate(
      (allEventsForEarliest || []) as CommitmentChangeEvent[],
    )

    return NextResponse.json({
      date: dateParam,
      plan,
      meta: {
        isHistorical: true,
        earliestDate,
        date: dateParam,
      },
    })
  } catch (error: unknown) {
    console.error('MAP snapshot error:', error)
    const message = error instanceof Error ? error.message : 'Failed to build snapshot'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
