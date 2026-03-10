import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getUserHousehold } from '@/lib/supabase/household'

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
