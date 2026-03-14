import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateMapPayload } from '@/lib/map/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/map/[id]
 * Get a single MAP with its items.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: map, error } = await supabase
      .from('user_maps')
      .select('*, items:user_map_items(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 })
    }

    return NextResponse.json({ map })
  } catch (err) {
    console.error('Error in GET /api/map/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/map/[id]
 * Update a MAP's metadata and/or replace its items.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existing } = await supabase
      .from('user_maps')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 })
    }

    const body: UpdateMapPayload = await request.json()

    const updates: Record<string, unknown> = {}
    if (body.title !== undefined) updates.title = body.title.trim()
    if (body.week_start_date !== undefined) updates.week_start_date = body.week_start_date
    if (body.timezone !== undefined) updates.timezone = body.timezone
    if (body.status !== undefined) {
      if (!['draft', 'archived'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status. Use activate endpoint to set active.' }, { status: 400 })
      }
      updates.status = body.status
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('user_maps')
        .update(updates)
        .eq('id', id)

      if (updateError) {
        console.error('Error updating map:', updateError)
        return NextResponse.json({ error: 'Failed to update map' }, { status: 500 })
      }
    }

    if (body.items) {
      await supabase.from('user_map_items').delete().eq('map_id', id)

      const itemRows = body.items.map((item, idx) => ({
        map_id: id,
        category: item.category,
        activity_type: item.activity_type,
        label: item.label,
        days_of_week: item.days_of_week,
        time_of_day: item.time_of_day || null,
        notify_sms: item.notify_sms ?? false,
        deep_link: item.deep_link || null,
        notes: item.notes || null,
        sort_order: item.sort_order ?? idx,
      }))

      if (itemRows.length > 0) {
        const { error: itemsError } = await supabase
          .from('user_map_items')
          .insert(itemRows)

        if (itemsError) {
          console.error('Error updating map items:', itemsError)
          return NextResponse.json({ error: 'Failed to update items' }, { status: 500 })
        }
      }
    }

    const { data: fullMap } = await supabase
      .from('user_maps')
      .select('*, items:user_map_items(*)')
      .eq('id', id)
      .single()

    return NextResponse.json({ map: fullMap })
  } catch (err) {
    console.error('Error in PATCH /api/map/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/map/[id]
 * Delete a draft MAP. Active/archived maps cannot be deleted.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existing } = await supabase
      .from('user_maps')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 })
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft maps can be deleted. Archive it instead.' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('user_maps').delete().eq('id', id)
    if (error) {
      console.error('Error deleting map:', error)
      return NextResponse.json({ error: 'Failed to delete map' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in DELETE /api/map/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
