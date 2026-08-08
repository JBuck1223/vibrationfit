import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdContext } from '@/lib/household/context'

export const dynamic = 'force-dynamic'

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
    const { name, country_code, notes, priority, cover_image_url, actualized_trip_id, shareWithHousehold } = body

    const updates: Record<string, unknown> = {}
    if (name !== undefined) {
      if (!name?.trim()) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      }
      updates.name = name.trim()
    }
    if (country_code !== undefined) updates.country_code = country_code?.trim()?.toUpperCase() || null
    if (notes !== undefined) updates.notes = notes?.trim() || null
    if (priority !== undefined) updates.priority = typeof priority === 'number' ? priority : 0
    if (cover_image_url !== undefined) updates.cover_image_url = cover_image_url || null
    if (actualized_trip_id !== undefined) updates.actualized_trip_id = actualized_trip_id || null

    if (shareWithHousehold === true) {
      const household = await getHouseholdContext(user.id)
      if (household?.isMultiMember) {
        updates.household_id = household.householdId
      }
    } else if (shareWithHousehold === false) {
      updates.household_id = null
    }

    const { data, error } = await supabase
      .from('dream_destinations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating dream destination:', error)
      return NextResponse.json({ error: 'Failed to update dream destination' }, { status: 500 })
    }

    return NextResponse.json({ dream: data })
  } catch (error) {
    console.error('Error in dream destination PATCH:', error)
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

    const { error } = await supabase
      .from('dream_destinations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting dream destination:', error)
      return NextResponse.json({ error: 'Failed to delete dream destination' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in dream destination DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
