import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/vibe-tribe/members/search?q=<search_term>
 * Search members by name for @mention autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 1) {
      return NextResponse.json({ members: [] })
    }

    const adminClient = createAdminClient()
    const term = `%${query}%`

    const { data: members, error } = await adminClient
      .from('user_accounts')
      .select('id, full_name, profile_picture_url, role')
      .or(`full_name.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`)
      .neq('id', user.id)
      .order('full_name', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Error searching members:', error)
      return NextResponse.json({ error: 'Failed to search members' }, { status: 500 })
    }

    return NextResponse.json({ members: members || [] })
  } catch (error: any) {
    console.error('MEMBER SEARCH ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search members' },
      { status: 500 }
    )
  }
}
