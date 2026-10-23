import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cleanSocialLinks } from '@/lib/profile/social-links'

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
      .from('member_public_profiles')
      .select('id, full_name, first_name, profile_picture_url, cover_image_url, occupation, social_links, created_at, about_me, favorite_quote, role')
      .eq('id', id)
      .maybeSingle()

    // Fallback if favorite_quote column doesn't exist yet
    if (memberError?.code === 'PGRST204' || memberError?.message?.includes('favorite_quote') || memberError?.message?.includes('cover_image_url') || memberError?.message?.includes('occupation') || memberError?.message?.includes('social_links')) {
      ({ data: member, error: memberError } = await supabase
        .from('member_public_profiles')
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

    // Profile stats: posts shared and hearts those posts received.
    const { data: postRows } = await supabase
      .from('vibe_posts')
      .select('hearts_count')
      .eq('user_id', id)
      .eq('is_deleted', false)
    const stats = {
      posts: postRows?.length ?? 0,
      hearts: (postRows ?? []).reduce((sum, p) => sum + (Number((p as { hearts_count?: number }).hearts_count) || 0), 0),
    }

    // Owner only: their private life-profile occupation, offered as a suggestion
    // in Edit profile. Never shown to others unless they save it publicly.
    let suggestedOccupation: string | null = null
    if (user.id === id && !(member as any).occupation) {
      const { data: lifeProfile } = await supabase
        .from('user_profiles')
        .select('occupation')
        .eq('user_id', id)
        .not('occupation', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      suggestedOccupation = (lifeProfile as { occupation?: string } | null)?.occupation?.trim() || null
    }

    return NextResponse.json({
      ...member,
      suggested_occupation: suggestedOccupation,
      favorite_quote: (member as any).favorite_quote ?? null,
      cover_image_url: (member as any).cover_image_url ?? null,
      occupation: (member as any).occupation ?? null,
      social_links: cleanSocialLinks((member as any).social_links),
      stats,
      isOwner: user.id === id,
    })
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
 * Updates the authenticated user's own profile: about_me, favorite_quote,
 * full_name, profile_picture_url and cover_image_url.
 * Users can only update their own profile.
 */
export async function PATCH(
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

    if ('full_name' in body) {
      const name = typeof body.full_name === 'string' ? body.full_name.trim().replace(/\s+/g, ' ').slice(0, 80) : ''
      if (!name) return NextResponse.json({ error: 'Your name can\'t be empty' }, { status: 400 })
      updates.full_name = name
      updates.first_name = name.split(' ')[0]
      result.full_name = name
    }

    if ('occupation' in body) {
      const occupation = typeof body.occupation === 'string' ? body.occupation.trim().replace(/\s+/g, ' ').slice(0, 80) : ''
      updates.occupation = occupation || null
      result.occupation = updates.occupation
    }

    // Image URLs must be https links (uploads land on the media CDN).
    for (const key of ['profile_picture_url', 'cover_image_url'] as const) {
      if (key in body) {
        const url = typeof body[key] === 'string' ? body[key].trim() : ''
        if (url && !/^https:\/\//.test(url)) return NextResponse.json({ error: 'Invalid image link' }, { status: 400 })
        updates[key] = url || null
        result[key] = updates[key]
      }
    }

    // Social handles are a JSON object; stored apart from the text fields.
    const socialLinks = 'social_links' in body ? cleanSocialLinks(body.social_links) : null

    if (Object.keys(updates).length === 0 && !socialLinks) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    let { error: updateError } = await supabase
      .from('user_accounts')
      .update(socialLinks ? { ...updates, social_links: socialLinks } : updates)
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

    return NextResponse.json({ success: true, ...result, ...(socialLinks ? { social_links: socialLinks } : {}) })
  } catch (error) {
    console.error('Error in snapshot PATCH:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
