import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getUserHousehold, getHouseholdWithMembers } from '@/lib/supabase/household'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const household = await getUserHousehold(user.id)
    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    const serviceClient = createServiceClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'personal') {
      const householdWithMembers = await getHouseholdWithMembers(household.id)
      const memberIds = householdWithMembers?.members.map(m => m.user_id) || []

      if (memberIds.length === 0) {
        return NextResponse.json({ visions: [] })
      }

      const { data: visions, error: visionError } = await serviceClient
        .from('vision_versions')
        .select('id, user_id, title, created_at, is_active, is_draft')
        .in('user_id', memberIds)
        .is('household_id', null)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })

      if (visionError) {
        console.error('Error fetching personal visions:', visionError)
        return NextResponse.json(
          { error: 'Failed to load personal visions' },
          { status: 500 }
        )
      }

      return NextResponse.json({ visions: visions || [] })
    }

    const { data: visions, error: visionError } = await serviceClient
      .from('vision_versions')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })

    if (visionError) {
      console.error('Error fetching household visions:', visionError)
      return NextResponse.json(
        { error: 'Failed to load household visions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ visions: visions || [] })
  } catch (error) {
    console.error('Error in GET /api/household/visions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
