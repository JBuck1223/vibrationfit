import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdContext } from '@/lib/household/context'
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

export async function GET(
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

    // No user_id filter: RLS grants access to the owner and to household
    // members the trip is shared with (explicitly or via share-all).
    const { data: trip, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
      }
      console.error('Error fetching trip:', error)
      return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 })
    }

    const [flightsRes, linksRes, attachmentsRes] = await Promise.all([
      supabase
        .from('trip_flights')
        .select('*')
        .eq('trip_id', id)
        .order('depart_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true }),
      supabase
        .from('travel_reference_links')
        .select('*')
        .eq('trip_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('travel_attachments')
        .select('*')
        .eq('trip_id', id)
        .order('created_at', { ascending: false }),
    ])

    let member = null
    if (trip.user_id !== user.id) {
      const household = await getHouseholdContext(user.id)
      const info = household?.memberMap?.[trip.user_id]
      if (info) {
        member = {
          userId: trip.user_id,
          displayName: info.displayName,
          avatarUrl: info.avatarUrl,
          isSelf: false,
        }
      }
    }

    return NextResponse.json({
      trip: {
        ...trip,
        flights: flightsRes.data || [],
        reference_links: linksRes.data || [],
        attachments: attachmentsRes.data || [],
        isMine: trip.user_id === user.id,
        member,
      },
    })
  } catch (error) {
    console.error('Error in trip GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      shareWithHousehold,
    } = body

    const updates: Record<string, unknown> = {}
    if (title !== undefined) {
      if (!title?.trim()) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      }
      updates.title = title.trim()
    }
    if (status !== undefined && ['past', 'upcoming', 'draft_import'].includes(status)) {
      updates.status = status
    }
    if (start_date !== undefined) updates.start_date = start_date || null
    if (end_date !== undefined) updates.end_date = end_date || null
    if (year !== undefined) updates.year = typeof year === 'number' ? year : null
    if (duration_text !== undefined) updates.duration_text = duration_text?.trim() || null
    if (destinations !== undefined) updates.destinations = normalizeDestinations(destinations)
    if (trip_type !== undefined) updates.trip_type = trip_type?.trim() || null
    if (story !== undefined) updates.story = story?.trim() || null
    if (cover_image_url !== undefined) updates.cover_image_url = cover_image_url || null

    if (shareWithHousehold === true) {
      const household = await getHouseholdContext(user.id)
      if (household?.isMultiMember) {
        updates.household_id = household.householdId
      }
    } else if (shareWithHousehold === false) {
      updates.household_id = null
    }

    // RLS allows the owner and household collaborators to edit.
    const { data: trip, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating trip:', error)
      return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error('Error in trip PATCH:', error)
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

    // RLS enforces delete rights (owner; household admin for shared trips).
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting trip:', error)
      return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in trip DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
