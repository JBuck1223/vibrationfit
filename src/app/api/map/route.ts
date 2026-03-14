import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateMapPayload } from '@/lib/map/types'

/**
 * GET /api/map
 * List all maps for the authenticated user, ordered by version_number desc.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: maps, error } = await supabase
      .from('user_maps')
      .select('*, items:user_map_items(*)')
      .eq('user_id', user.id)
      .order('version_number', { ascending: false })

    if (error) {
      console.error('Error fetching maps:', error)
      return NextResponse.json({ error: 'Failed to fetch maps' }, { status: 500 })
    }

    return NextResponse.json({ maps: maps ?? [] })
  } catch (err) {
    console.error('Error in GET /api/map:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/map
 * Create a new MAP with items in a single request.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateMapPayload = await request.json()

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'At least one activity is required' }, { status: 400 })
    }

    const { data: map, error: mapError } = await supabase
      .from('user_maps')
      .insert({
        user_id: user.id,
        title: body.title.trim(),
        status: 'draft',
        week_start_date: body.week_start_date || null,
        timezone: body.timezone || 'America/New_York',
      })
      .select()
      .single()

    if (mapError || !map) {
      console.error('Error creating map:', mapError)
      return NextResponse.json({ error: 'Failed to create map' }, { status: 500 })
    }

    const itemRows = body.items.map((item, idx) => ({
      map_id: map.id,
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

    const { error: itemsError } = await supabase
      .from('user_map_items')
      .insert(itemRows)

    if (itemsError) {
      console.error('Error creating map items:', itemsError)
      await supabase.from('user_maps').delete().eq('id', map.id)
      return NextResponse.json({ error: 'Failed to create map items' }, { status: 500 })
    }

    const { data: fullMap } = await supabase
      .from('user_maps')
      .select('*, items:user_map_items(*)')
      .eq('id', map.id)
      .single()

    return NextResponse.json({ map: fullMap }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/map:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
