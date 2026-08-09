import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdContext } from '@/lib/household/context'
import { getShareAllMemberIds } from '@/lib/household/sharing'
import type { TravelStats, TripDestination } from '@/lib/travel/types'

export const dynamic = 'force-dynamic'

// GET /api/travel/stats - aggregate travel insights (scope=mine|all)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') === 'all' ? 'all' : 'mine'

    const household = await getHouseholdContext(user.id)

    let query = supabase
      .from('trips')
      .select('id, status, start_date, year, destinations, trip_flights(distance_miles)')
      .neq('status', 'draft_import')

    if (scope === 'all' && household?.isMultiMember) {
      const shareAllIds = await getShareAllMemberIds(supabase, household.householdId, 'travel')
      const conditions = [`user_id.eq.${user.id}`, `household_id.eq.${household.householdId}`]
      if (shareAllIds.length > 0) {
        conditions.push(`user_id.in.(${shareAllIds.join(',')})`)
      }
      query = query.or(conditions.join(','))
    } else {
      query = query.eq('user_id', user.id)
    }

    const { data: trips, error } = await query
    if (error) {
      console.error('Error fetching travel stats:', error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const countrySet = new Set<string>()
    const destinationCounts = new Map<string, number>()
    const yearCounts = new Map<number, number>()
    let milesFlown = 0
    let flightCount = 0
    let upcomingCount = 0
    let destinationCount = 0

    for (const trip of trips || []) {
      if (trip.status === 'upcoming') upcomingCount++

      const destinations = (Array.isArray(trip.destinations) ? trip.destinations : []) as TripDestination[]
      for (const d of destinations) {
        destinationCount++
        if (d.countryCode) countrySet.add(d.countryCode.toUpperCase())
        if (d.name) {
          const key = d.name.trim()
          destinationCounts.set(key, (destinationCounts.get(key) || 0) + 1)
        }
      }

      // Trips per year: prefer start_date, fall back to the year column.
      // Only count taken trips in the timeline.
      if (trip.status === 'past') {
        const y = trip.start_date
          ? new Date(trip.start_date).getFullYear()
          : trip.year
        if (y) yearCounts.set(y, (yearCounts.get(y) || 0) + 1)
      }

      for (const f of trip.trip_flights || []) {
        flightCount++
        if (typeof f.distance_miles === 'number') milesFlown += f.distance_miles
      }
    }

    const stats: TravelStats = {
      tripCount: (trips || []).filter((t) => t.status === 'past').length,
      upcomingCount,
      countryCount: countrySet.size,
      countryCodes: Array.from(countrySet).sort(),
      destinationCount,
      milesFlown: Math.round(milesFlown),
      flightCount,
      tripsPerYear: Array.from(yearCounts.entries())
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year),
      topDestinations: Array.from(destinationCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error in travel stats GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
