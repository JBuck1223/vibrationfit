/**
 * POST /api/music/artist-share-link
 * Body: { userId: string }  (the artist's user id)
 *
 * Returns the public artist page URL (/music/artist/[handle]) for a member
 * artist shown on /audio/music. The handle is the member's referral code
 * when they have one, otherwise their user id.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { artistHandleForUser } from '@/lib/songs/public-artist'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json().catch(() => ({}))
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const handle = await artistHandleForUser(adminDb, userId)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'
    return NextResponse.json({
      share_url: `${siteUrl}/music/artist/${encodeURIComponent(handle)}`,
      is_self: userId === user.id,
    })
  } catch (err) {
    console.error('[ArtistShareLink] Error:', err)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}
