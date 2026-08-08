import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdContext } from '@/lib/household/context'
import { getShareAllMemberIds } from '@/lib/household/sharing'
import { flightDistanceMiles } from '@/lib/travel/airports'
import type { TripDestination } from '@/lib/travel/types'

export const dynamic = 'force-dynamic'

function normalizeDestinations(value: unknown): TripDestination[] {
  if (!Array.isArray(value)) return []
  return value
    .map((d) => ({
      name: typeof d?.name === 'string' ? d.name.trim() : '',
      countryCode:
        typeof d?.countryCode === 'string' && d.countryCode.trim()
          ? d.countryCode.trim().toUpperCase()
          : null,
      lat: typeof d?.lat === 'number' ? d.lat : null,
      lng: typeof d?.lng === 'number' ? d.lng : null,
    }))
    .filter((d) => d.name.length > 0)
}

// GET /api/travel/trips - list trips (scope=all adds household-shared)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') === 'all' ? 'all' : 'mine'
    const status = searchParams.get('status')

    const household = await getHouseholdContext(user.id)

    let query = supabase
      .from('trips')
      .select('*, trip_flights(*)')

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

    if (status && ['past', 'upcoming', 'draft_import'].includes(status)) {
      query = query.eq('status', status)
    }

    // Newest travel first: start_date, falling back to year via created_at ordering below
    query = query
      .order('start_date', { ascending: false, nullsFirst: false })
      .order('year', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) {
      console.error('Error fetching trips:', error)
      return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
    }

    const trips = (data || []).map((t) => ({
      ...t,
      flights: t.trip_flights || [],
      trip_flights: undefined,
      isMine: t.user_id === user.id,
      member: household?.memberMap?.[t.user_id]
        ? {
            userId: t.user_id,
            displayName: household.memberMap[t.user_id].displayName,
            avatarUrl: household.memberMap[t.user_id].avatarUrl,
            isSelf: t.user_id === user.id,
          }
        : null,
    }))

    return NextResponse.json({
      trips,
      household: household?.isMultiMember
        ? {
            id: household.householdId,
            name: household.householdName,
            isMultiMember: household.isMultiMember,
            members: household.members,
          }
        : null,
    })
  } catch (error) {
    console.error('Error in trips GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/travel/trips - create a trip (optionally with flight segments)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      status,
      start_date,
      end_date,
      year,
      duration_text,
      destinations,
      trip_type,
      story,
      cover_image_url,
      source,
      flights,
      shareWithHousehold,
      dream_destination_id,
    } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    let householdId: string | null = null
    if (shareWithHousehold === true) {
      const household = await getHouseholdContext(user.id)
      if (household?.isMultiMember) {
        householdId = household.householdId
      }
    }

    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        title: title.trim(),
        status: ['past', 'upcoming'].includes(status) ? status : 'past',
        start_date: start_date || null,
        end_date: end_date || null,
        year: typeof year === 'number' ? year : null,
        duration_text: duration_text?.trim() || null,
        destinations: normalizeDestinations(destinations),
        trip_type: trip_type?.trim() || null,
        story: story?.trim() || null,
        cover_image_url: cover_image_url || null,
        source: source === 'email' ? 'email' : 'manual',
        household_id: householdId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating trip:', error)
      return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
    }

    // Optional flight segments (from the manual form or a confirmed import)
    let createdFlights: unknown[] = []
    if (Array.isArray(flights) && flights.length > 0) {
      const rows = flights
        .filter((f) => f && (f.depart_airport || f.arrive_airport || f.airline || f.flight_number))
        .map((f) => {
          const depart = f.depart_airport?.trim()?.toUpperCase() || null
          const arrive = f.arrive_airport?.trim()?.toUpperCase() || null
          return {
            trip_id: trip.id,
            airline: f.airline?.trim() || null,
            flight_number: f.flight_number?.trim() || null,
            depart_airport: depart,
            arrive_airport: arrive,
            depart_at: f.depart_at || null,
            arrive_at: f.arrive_at || null,
            distance_miles: flightDistanceMiles(depart, arrive),
          }
        })
      if (rows.length > 0) {
        const { data: flightRows, error: flightError } = await supabase
          .from('trip_flights')
          .insert(rows)
          .select()
        if (flightError) {
          console.error('Error creating trip flights:', flightError)
        } else {
          createdFlights = flightRows || []
        }
      }
    }

    // Actualize a dream destination into this trip
    if (dream_destination_id) {
      await supabase
        .from('dream_destinations')
        .update({ actualized_trip_id: trip.id })
        .eq('id', dream_destination_id)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ trip: { ...trip, flights: createdFlights } }, { status: 201 })
  } catch (error) {
    console.error('Error in trips POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
