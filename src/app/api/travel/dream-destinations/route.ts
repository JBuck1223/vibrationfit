import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdContext } from '@/lib/household/context'
import { getShareAllMemberIds } from '@/lib/household/sharing'

export const dynamic = 'force-dynamic'

// GET /api/travel/dream-destinations - list dream list entries (scope=all adds household)
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
      .from('dream_destinations')
      .select('*, travel_attachments(*), travel_reference_links(*)')

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

    const { data, error } = await query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching dream destinations:', error)
      return NextResponse.json({ error: 'Failed to fetch dream destinations' }, { status: 500 })
    }

    const dreams = (data || []).map((d) => ({
      ...d,
      attachments: d.travel_attachments || [],
      reference_links: d.travel_reference_links || [],
      travel_attachments: undefined,
      travel_reference_links: undefined,
      isMine: d.user_id === user.id,
    }))

    return NextResponse.json({ dreams })
  } catch (error) {
    console.error('Error in dream destinations GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/travel/dream-destinations - add a dream list entry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, country_code, notes, priority, cover_image_url, shareWithHousehold } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    let householdId: string | null = null
    if (shareWithHousehold === true) {
      const household = await getHouseholdContext(user.id)
      if (household?.isMultiMember) {
        householdId = household.householdId
      }
    }

    const { data, error } = await supabase
      .from('dream_destinations')
      .insert({
        user_id: user.id,
        name: name.trim(),
        country_code: country_code?.trim()?.toUpperCase() || null,
        notes: notes?.trim() || null,
        priority: typeof priority === 'number' ? priority : 0,
        cover_image_url: cover_image_url || null,
        household_id: householdId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating dream destination:', error)
      return NextResponse.json({ error: 'Failed to create dream destination' }, { status: 500 })
    }

    return NextResponse.json({ dream: data }, { status: 201 })
  } catch (error) {
    console.error('Error in dream destinations POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
