/**
 * GET /api/songs/shared/[token]
 *
 * Public (unauthenticated) endpoint for the /music/[token] share page.
 * Returns limited track info for a publicly shared song track, gated on
 * song_tracks.is_shared = true (see src/lib/songs/public-sharing.ts).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSharedTrackByToken } from '@/lib/songs/public-sharing'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const result = await getSharedTrackByToken(token)

    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[SharedSong] Error:', err)
    return NextResponse.json({ error: 'Failed to load song' }, { status: 500 })
  }
}
