/**
 * Manage public sharing for a Song Track
 *
 * POST /api/songs/[id]/tracks/[trackId]/share
 * Body: { is_shared?: boolean, is_public?: boolean }
 *
 * - is_shared: enable/disable the public share link (/music/[token]).
 *   Generates a permanent share_token on first share.
 * - is_public: also list the track on the public /music discover page.
 *   Enabling is_public implies is_shared.
 *
 * GET /api/songs/[id]/tracks/[trackId]/share
 * Returns current sharing state + share URL for the track.
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function generateShareToken(): string {
  return randomBytes(12).toString('base64url')
}

function shareUrl(token: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'
  return `${siteUrl}/music/${token}`
}

async function getOwnedTrack(songId: string, trackId: string, userId: string) {
  const adminDb = createAdminClient()
  const { data: track, error } = await adminDb
    .from('song_tracks')
    .select('id, share_token, is_shared, is_public, shared_at')
    .eq('id', trackId)
    .eq('song_id', songId)
    .eq('user_id', userId)
    .single()
  return { adminDb, track, error }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; trackId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: songId, trackId } = await params
    const { track, error } = await getOwnedTrack(songId, trackId, user.id)

    if (error || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    return NextResponse.json({
      track_id: track.id,
      is_shared: track.is_shared,
      is_public: track.is_public,
      share_url: track.share_token ? shareUrl(track.share_token) : null,
    })
  } catch (err) {
    console.error('[SongShare] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to load sharing state',
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trackId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: songId, trackId } = await params
    const body = await request.json().catch(() => ({}))

    const { adminDb, track, error } = await getOwnedTrack(songId, trackId, user.id)

    if (error || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    let isShared = typeof body.is_shared === 'boolean' ? body.is_shared : track.is_shared
    let isPublic = typeof body.is_public === 'boolean' ? body.is_public : track.is_public

    // Public listing requires an active share link; revoking the link unlists.
    if (typeof body.is_public === 'boolean' && body.is_public) {
      isShared = true
    }
    if (typeof body.is_shared === 'boolean' && !body.is_shared) {
      isPublic = false
    }

    const shareToken = track.share_token || (isShared ? generateShareToken() : null)

    const nowSharing = isShared && !track.is_shared

    const { error: updateError } = await adminDb
      .from('song_tracks')
      .update({
        share_token: shareToken,
        is_shared: isShared,
        is_public: isPublic,
        ...(nowSharing ? { shared_at: new Date().toISOString() } : {}),
      })
      .eq('id', trackId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[SongShare] Update failed:', updateError)
      return NextResponse.json({ error: 'Failed to update sharing' }, { status: 500 })
    }

    return NextResponse.json({
      track_id: trackId,
      is_shared: isShared,
      is_public: isPublic,
      share_url: shareToken ? shareUrl(shareToken) : null,
    })
  } catch (err) {
    console.error('[SongShare] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to update sharing',
    }, { status: 500 })
  }
}
