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

    let { data: member, error: memberError } = await supabase
      .from('user_accounts')
      .select('id, full_name, first_name, profile_picture_url, created_at, about_me, favorite_quote, role')
      .eq('id', id)
      .maybeSingle()

    // Fallback if favorite_quote column doesn't exist yet
    if (memberError?.code === 'PGRST204' || memberError?.message?.includes('favorite_quote')) {
      ({ data: member, error: memberError } = await supabase
        .from('user_accounts')
        .select('id, full_name, first_name, profile_picture_url, created_at, about_me, role')
        .eq('id', id)
        .maybeSingle())
    }

    if (memberError) {
      console.error('Error fetching member profile:', memberError)
      return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 })
    }

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json({ ...member, favorite_quote: (member as any).favorite_quote ?? null, isOwner: user.id === id })
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

    const updates: Record<string, string | null> = {}
    const result: Record<string, string | null> = { success: 'true' as any }

    if ('about_me' in body) {
      const aboutMe = typeof body.about_me === 'string' ? body.about_me.trim().slice(0, 500) : null
      updates.about_me = aboutMe || null
      result.about_me = updates.about_me
    }

    if ('favorite_quote' in body) {
      const quote = typeof body.favorite_quote === 'string' ? body.favorite_quote.trim().slice(0, 300) : null
      updates.favorite_quote = quote || null
      result.favorite_quote = updates.favorite_quote
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    let { error: updateError } = await supabase
      .from('user_accounts')
      .update(updates)
      .eq('id', id)

    // If favorite_quote column doesn't exist yet, retry without it
    if (updateError && updates.favorite_quote !== undefined) {
      const { favorite_quote, ...safeUpdates } = updates
      if (Object.keys(safeUpdates).length > 0) {
        ({ error: updateError } = await supabase
          .from('user_accounts')
          .update(safeUpdates)
          .eq('id', id))
      } else {
        return NextResponse.json({ error: 'Favorite quote feature requires a database migration. Please run the pending migration.' }, { status: 400 })
      }
    }

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error in snapshot PATCH:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
