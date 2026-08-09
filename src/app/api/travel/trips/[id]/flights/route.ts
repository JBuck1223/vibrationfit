import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { flightDistanceMiles } from '@/lib/travel/airports'

export const dynamic = 'force-dynamic'

interface FlightInput {
  airline?: string | null
  flight_number?: string | null
  depart_airport?: string | null
  arrive_airport?: string | null
  depart_at?: string | null
  arrive_at?: string | null
}

async function assertAccess(supabase: SupabaseClient, tripId: string) {
  const { data } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .single()
  return !!data
}

function buildFlightRow(tripId: string, f: FlightInput) {
  const depart = f.depart_airport?.trim()?.toUpperCase() || null
  const arrive = f.arrive_airport?.trim()?.toUpperCase() || null
  return {
    trip_id: tripId,
    airline: f.airline?.trim() || null,
    flight_number: f.flight_number?.trim() || null,
    depart_airport: depart,
    arrive_airport: arrive,
    depart_at: f.depart_at || null,
    arrive_at: f.arrive_at || null,
    distance_miles: flightDistanceMiles(depart, arrive),
  }
}

// POST /api/travel/trips/[id]/flights - add flight segment(s)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!(await assertAccess(supabase, id))) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const body = await request.json()
    const items: FlightInput[] = Array.isArray(body.flights) ? body.flights : [body]

    const rows = items
      .filter((f) => f && (f.depart_airport || f.arrive_airport || f.airline || f.flight_number))
      .map((f) => buildFlightRow(id, f))

    if (rows.length === 0) {
      return NextResponse.json({ error: 'At least one flight field is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('trip_flights')
      .insert(rows)
      .select()

    if (error) {
      console.error('Trip flight creation error:', error)
      return NextResponse.json({ error: 'Failed to save flights' }, { status: 500 })
    }

    return NextResponse.json({ flights: data }, { status: 201 })
  } catch (error) {
    console.error('Error in trip flights POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/travel/trips/[id]/flights - update one segment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { flight_id } = body

    if (!flight_id) {
      return NextResponse.json({ error: 'flight_id is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (body.airline !== undefined) updates.airline = body.airline?.trim() || null
    if (body.flight_number !== undefined) updates.flight_number = body.flight_number?.trim() || null
    if (body.depart_airport !== undefined) updates.depart_airport = body.depart_airport?.trim()?.toUpperCase() || null
    if (body.arrive_airport !== undefined) updates.arrive_airport = body.arrive_airport?.trim()?.toUpperCase() || null
    if (body.depart_at !== undefined) updates.depart_at = body.depart_at || null
    if (body.arrive_at !== undefined) updates.arrive_at = body.arrive_at || null

    // Recompute distance when either airport changes
    if (updates.depart_airport !== undefined || updates.arrive_airport !== undefined) {
      const { data: existing } = await supabase
        .from('trip_flights')
        .select('depart_airport, arrive_airport')
        .eq('id', flight_id)
        .eq('trip_id', id)
        .single()
      const depart = (updates.depart_airport !== undefined ? updates.depart_airport : existing?.depart_airport) as string | null
      const arrive = (updates.arrive_airport !== undefined ? updates.arrive_airport : existing?.arrive_airport) as string | null
      updates.distance_miles = flightDistanceMiles(depart, arrive)
    }

    const { data, error } = await supabase
      .from('trip_flights')
      .update(updates)
      .eq('id', flight_id)
      .eq('trip_id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update flight' }, { status: 500 })
    }

    return NextResponse.json({ flight: data })
  } catch (error) {
    console.error('Error in trip flights PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const flightId = searchParams.get('flight_id')

    if (!flightId) {
      return NextResponse.json({ error: 'flight_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('trip_flights')
      .delete()
      .eq('id', flightId)
      .eq('trip_id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete flight' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in trip flights DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
