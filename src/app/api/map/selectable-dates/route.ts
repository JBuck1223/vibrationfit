import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMapSelectableDates } from '@/lib/map/snapshot'
import { todayDateString } from '@/lib/map/map-date-utils'
import type { CommitmentChangeEvent } from '@/lib/map/types'

/**
 * GET /api/map/selectable-dates
 * Returns YYYY-MM-DD dates when the member had an active MAP (for time travel picker).
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = todayDateString()

    const [{ data: events, error: eventsError }, { count: activeCount, error: activeError }] =
      await Promise.all([
        supabase
          .from('commitment_change_events')
          .select('id, commitment_id, user_id, event_type, state, changed_at, source, map_activation_id')
          .eq('user_id', user.id)
          .order('changed_at', { ascending: true }),
        supabase
          .from('commitments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active'),
      ])

    if (eventsError) {
      console.error('Error fetching commitment change events:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch plan history' }, { status: 500 })
    }

    if (activeError) {
      console.error('Error counting active commitments:', activeError)
      return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
    }

    const dates = getMapSelectableDates(
      (events || []) as CommitmentChangeEvent[],
      today,
      (activeCount ?? 0) > 0,
    )

    return NextResponse.json({ dates })
  } catch (error: unknown) {
    console.error('MAP selectable dates error:', error)
    const message = error instanceof Error ? error.message : 'Failed to load selectable dates'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
