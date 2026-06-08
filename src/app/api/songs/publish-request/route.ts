import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  hasAcceptedSongPublishingAgreement,
  SONG_PUBLISHING_AGREEMENT_VERSION,
} from '@/lib/songs/publishing-agreement'

export const dynamic = 'force-dynamic'

/**
 * POST /api/songs/publish-request
 *
 * User-facing endpoint to submit a specific track version for streaming.
 * Auto-fills life_categories from the song's source entity.
 * Requires the user to have already accepted the Song Publishing Agreement.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { song_id, track_id } = await request.json()

    if (!song_id || !track_id) {
      return NextResponse.json({ error: 'song_id and track_id are required' }, { status: 400 })
    }

    const { data: track, error: trackError } = await supabase
      .from('song_tracks')
      .select('id, song_id')
      .eq('id', track_id)
      .eq('song_id', song_id)
      .single()

    if (trackError || !track) {
      return NextResponse.json({ error: 'Track not found or not owned by you' }, { status: 404 })
    }

    const adminDb = createAdminClient()

    const { data: existing } = await adminDb
      .from('song_publish_requests')
      .select('id, status')
      .eq('track_id', track_id)
      .in('status', ['pending', 'approved', 'published'])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        error: `This track already has a ${existing.status} publish request`,
        status: existing.status,
      }, { status: 409 })
    }

    const { data: account } = await adminDb
      .from('user_accounts')
      .select('song_publishing_agreement_accepted_at, song_publishing_agreement_version, song_publishing_legal_name')
      .eq('id', user.id)
      .single()

    if (!hasAcceptedSongPublishingAgreement(account)) {
      return NextResponse.json({ error: 'Song Publishing Agreement required' }, { status: 403 })
    }

    const legalName = account?.song_publishing_legal_name?.trim()
    if (!legalName) {
      return NextResponse.json({ error: 'Legal name not found. Please accept the agreement again.' }, { status: 403 })
    }

    // Auto-fill life_categories from the song's source entity
    let lifeCategories: string[] = []
    const { data: song } = await adminDb
      .from('songs')
      .select('entity_type, entity_id')
      .eq('id', song_id)
      .single()

    if (song?.entity_id) {
      if (song.entity_type === 'life_vision') {
        const { data: vision } = await adminDb
          .from('life_visions')
          .select('category')
          .eq('id', song.entity_id)
          .single()
        if (vision?.category) lifeCategories = [vision.category]
      } else if (song.entity_type === 'vision_board_item') {
        const { data: item } = await adminDb
          .from('vision_board_items')
          .select('life_category')
          .eq('id', song.entity_id)
          .single()
        if (item?.life_category) lifeCategories = [item.life_category]
      } else if (song.entity_type === 'journal_entry') {
        const { data: entry } = await adminDb
          .from('journal_entries')
          .select('life_category')
          .eq('id', song.entity_id)
          .single()
        if (entry?.life_category) lifeCategories = [entry.life_category]
      }
    }

    const { data: inserted, error: insertError } = await adminDb
      .from('song_publish_requests')
      .insert({
        user_id: user.id,
        song_id,
        track_id,
        songwriter_legal_name: legalName,
        life_categories: lifeCategories,
        royalty_split_percent: 50,
        status: 'pending',
        agreement_version: SONG_PUBLISHING_AGREEMENT_VERSION,
      })
      .select('id, status')
      .single()

    if (insertError) {
      console.error('[PublishRequest] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
    }

    return NextResponse.json(inserted, { status: 201 })
  } catch (err) {
    console.error('[PublishRequest] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Submission failed',
    }, { status: 500 })
  }
}
