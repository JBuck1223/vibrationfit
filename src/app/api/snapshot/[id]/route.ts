import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/snapshot/[id]
 * 
 * Fetches public profile information for a member.
 * Used by the /snapshot/[id] page to display member info alongside metrics.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verify the requesting user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the member's public profile
    const { data: member, error: memberError } = await supabase
      .from('user_accounts')
      .select('id, full_name, first_name, profile_picture_url, created_at')
      .eq('id', id)
      .maybeSingle()

    if (memberError) {
      console.error('Error fetching member profile:', memberError)
      return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 })
    }

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error in snapshot API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
