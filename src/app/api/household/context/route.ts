// Household Context API
//
// GET /api/household/context - lightweight household summary for client pages
// that fetch feature data directly from Supabase (e.g. Stories) and need
// member names/avatars for the household lens and attribution badges.
//
// Returns { household: null } when the user has no household, so callers can
// treat "no household" and "solo household" uniformly.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdContext } from '@/lib/household/context'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const household = await getHouseholdContext(user.id)
    return NextResponse.json({ household })
  } catch (error) {
    console.error('Error in GET /api/household/context:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
