/**
 * GET /api/music/artists
 *
 * Returns the list of "artists" for the /audio/music browse experience:
 *  - One official "Vibration Fit" artist for the admin-curated catalog.
 *  - One artist per member who has at least one track in their Member Library
 *    (song_tracks.in_member_library = true), sourced from all members.
 *
 * song_tracks SELECT RLS is owner-only, so this reads cross-member data with
 * the admin client (same pattern as /api/songs/member-library).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isOfficialMusicCatalogTrack } from '@/lib/songs/catalog-sync'

export const dynamic = 'force-dynamic'

export const OFFICIAL_ARTIST_ID = 'vibrationfit'

export interface MusicArtist {
  id: string
  name: string
  avatarUrl: string | null
  songCount: number
  isOfficial: boolean
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = createAdminClient()

    // Community member-library tracks across all members.
    const { data: libraryTracks, error: tracksError } = await adminDb
      .from('song_tracks')
      .select('user_id, song_id')
      .eq('in_member_library', true)
      .not('mp3_url', 'is', null)

    if (tracksError) {
      console.error('[MusicArtists] Failed to load library tracks:', tracksError)
      return NextResponse.json({ error: 'Failed to load artists' }, { status: 500 })
    }

    // Distinct songs per member.
    const songsByUser = new Map<string, Set<string>>()
    for (const row of libraryTracks || []) {
      if (!row.user_id) continue
      let set = songsByUser.get(row.user_id)
      if (!set) {
        set = new Set<string>()
        songsByUser.set(row.user_id, set)
      }
      if (row.song_id) set.add(row.song_id)
    }

    const userIds = [...songsByUser.keys()]
    let accountsById: Record<string, { full_name: string | null; first_name: string | null; last_name: string | null; profile_picture_url: string | null }> = {}
    if (userIds.length > 0) {
      const { data: accounts } = await adminDb
        .from('user_accounts')
        .select('id, full_name, first_name, last_name, profile_picture_url')
        .in('id', userIds)
      if (accounts) {
        accountsById = Object.fromEntries(accounts.map(a => [a.id, a]))
      }
    }

    const communityArtists: MusicArtist[] = userIds.map(userId => {
      const account = accountsById[userId]
      const name = account?.full_name
        || [account?.first_name, account?.last_name].filter(Boolean).join(' ').trim()
        || 'VibrationFit Member'
      return {
        id: userId,
        name,
        avatarUrl: account?.profile_picture_url || null,
        songCount: songsByUser.get(userId)?.size || 0,
        isOfficial: false,
      }
    }).sort((a, b) => b.songCount - a.songCount || a.name.localeCompare(b.name))

    // Official Vibration Fit catalog tile.
    const { data: officialRows } = await adminDb
      .from('music_catalog')
      .select('preview_url')
      .eq('is_active', true)
    const officialCount = (officialRows || []).filter(r => isOfficialMusicCatalogTrack(r)).length

    const artists: MusicArtist[] = []
    if (officialCount > 0) {
      artists.push({
        id: OFFICIAL_ARTIST_ID,
        name: 'Vibration Fit',
        avatarUrl: null,
        songCount: officialCount,
        isOfficial: true,
      })
    }
    artists.push(...communityArtists)

    return NextResponse.json({ artists })
  } catch (err) {
    console.error('[MusicArtists] Error:', err)
    return NextResponse.json({ error: 'Failed to load artists' }, { status: 500 })
  }
}
