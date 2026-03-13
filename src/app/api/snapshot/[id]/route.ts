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
    const { id: rawId } = await params
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = rawId === 'me' ? user.id : rawId

    const { data: member, error: memberError } = await supabase
      .from('user_accounts')
      .select('id, full_name, first_name, profile_picture_url, created_at, about_me')
      .eq('id', id)
      .maybeSingle()

    if (memberError) {
      console.error('Error fetching member profile:', memberError)
      return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 })
    }

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json({ ...member, isOwner: user.id === id })
  } catch (error) {
    console.error('Error in snapshot API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/snapshot/[id]
 * 
 * Updates the authenticated user's own about_me blurb.
 * Users can only update their own profile.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.id !== id) {
      return NextResponse.json({ error: 'You can only edit your own profile' }, { status: 403 })
    }

    const body = await request.json()
    const aboutMe = typeof body.about_me === 'string' ? body.about_me.trim().slice(0, 500) : null

    const { error: updateError } = await supabase
      .from('user_accounts')
      .update({ about_me: aboutMe || null })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating about_me:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, about_me: aboutMe || null })
  } catch (error) {
    console.error('Error in snapshot PATCH:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
