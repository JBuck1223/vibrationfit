/**
 * POST /api/music/share-link
 * Body: { url: string }  (the track's MP3/preview URL)
 *
 * Returns a public share URL (/music/[token]) for any track playable on
 * /audio/music. Any authenticated member can get a link — these tracks are
 * already community-shared (member library or official catalog):
 *  - song_tracks: in the member library, already shared, or owned by the caller
 *  - music_catalog: any active row
 *
 * Tokens are minted lazily on first request and permanent thereafter.
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { officialCatalogCreatorUserId } from '@/lib/songs/catalog-sync'

export const dynamic = 'force-dynamic'

function generateShareToken(): string {
  return randomBytes(12).toString('base64url')
}

function shareUrl(token: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'
  return `${siteUrl}/music/${token}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json().catch(() => ({}))
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Member song track (member library, already shared, or caller's own).
    const { data: track } = await adminDb
      .from('song_tracks')
      .select('id, user_id, share_token, is_shared, in_member_library')
      .eq('mp3_url', url)
      .maybeSingle()

    if (track && (track.in_member_library || track.is_shared || track.user_id === user.id)) {
      let token = track.share_token
      if (!token) {
        token = generateShareToken()
        const updates: Record<string, unknown> = { share_token: token }
        // Owner sharing a track that isn't community-visible yet: activate the link.
        if (!track.in_member_library && !track.is_shared && track.user_id === user.id) {
          updates.is_shared = true
          updates.shared_at = new Date().toISOString()
        }
        const { error: updateError } = await adminDb
          .from('song_tracks')
          .update(updates)
          .eq('id', track.id)
        if (updateError) {
          console.error('[MusicShareLink] Track update failed:', updateError)
          return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
        }
      }
      return NextResponse.json({
        share_url: shareUrl(token),
        source: 'song_track',
        is_creator: track.user_id === user.id,
      })
    }

    // Official catalog track.
    const { data: catalogRow } = await adminDb
      .from('music_catalog')
      .select('id, share_token, tags')
      .eq('preview_url', url)
      .eq('is_active', true)
      .maybeSingle()

    if (catalogRow) {
      let token = catalogRow.share_token
      if (!token) {
        token = generateShareToken()
        const { error: updateError } = await adminDb
          .from('music_catalog')
          .update({ share_token: token })
          .eq('id', catalogRow.id)
        if (updateError) {
          console.error('[MusicShareLink] Catalog update failed:', updateError)
          return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
        }
      }
      return NextResponse.json({
        share_url: shareUrl(token),
        source: 'catalog',
        is_creator: officialCatalogCreatorUserId(catalogRow) === user.id,
      })
    }

    return NextResponse.json({ error: 'Track not found' }, { status: 404 })
  } catch (err) {
    console.error('[MusicShareLink] Error:', err)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}
