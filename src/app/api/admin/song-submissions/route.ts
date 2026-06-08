import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'
import {
  hasAcceptedSongPublishingAgreement,
  SONG_PUBLISHING_AGREEMENT_VERSION,
} from '@/lib/songs/publishing-agreement'

export const dynamic = 'force-dynamic'

const VALID_LIFE_CATEGORIES = new Set<string>(LIFE_CATEGORY_KEYS)

function normalizeLifeCategories(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const categories = [...new Set(
    value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean),
  )]
  if (categories.length === 0) return null
  if (!categories.every((item) => VALID_LIFE_CATEGORIES.has(item))) return null
  return categories
}

/**
 * POST - Authenticated user submits a track for publishing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { song_id, track_id, songwriter_legal_name, life_categories } = await request.json()

    if (!song_id || !track_id || !songwriter_legal_name?.trim()) {
      return NextResponse.json({ error: 'song_id, track_id, and songwriter_legal_name are required' }, { status: 400 })
    }

    const normalizedLifeCategories = normalizeLifeCategories(life_categories)
    if (!normalizedLifeCategories) {
      return NextResponse.json({ error: 'Select at least one life category' }, { status: 400 })
    }

    const { data: track, error: trackError } = await supabase
      .from('song_tracks')
      .select('id, song_id')
      .eq('id', track_id)
      .eq('song_id', song_id)
      .eq('user_id', user.id)
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
      }, { status: 409 })
    }

    const { data: account } = await adminDb
      .from('user_accounts')
      .select('song_publishing_agreement_accepted_at, song_publishing_agreement_version, song_publishing_legal_name')
      .eq('id', user.id)
      .single()

    const trimmedLegalName = songwriter_legal_name.trim()
    const alreadyAccepted = hasAcceptedSongPublishingAgreement(account)

    if (alreadyAccepted) {
      const storedName = account?.song_publishing_legal_name?.trim()
      if (!storedName) {
        return NextResponse.json({ error: 'Song Publishing Agreement required' }, { status: 403 })
      }
    }

    const { data: inserted, error: insertError } = await adminDb
      .from('song_publish_requests')
      .insert({
        user_id: user.id,
        song_id,
        track_id,
        songwriter_legal_name: alreadyAccepted
          ? account!.song_publishing_legal_name!.trim()
          : trimmedLegalName,
        life_categories: normalizedLifeCategories,
        royalty_split_percent: 50,
        status: 'pending',
        agreement_version: SONG_PUBLISHING_AGREEMENT_VERSION,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[SongSubmission] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
    }

    if (!alreadyAccepted) {
      const { error: agreementError } = await adminDb
        .from('user_accounts')
        .update({
          song_publishing_agreement_accepted_at: new Date().toISOString(),
          song_publishing_agreement_version: SONG_PUBLISHING_AGREEMENT_VERSION,
          song_publishing_legal_name: trimmedLegalName,
        })
        .eq('id', user.id)

      if (agreementError) {
        console.error('[SongSubmission] Agreement update error:', agreementError)
      }
    }

    return NextResponse.json(inserted, { status: 201 })
  } catch (err) {
    console.error('[SongSubmission] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Submission failed',
    }, { status: 500 })
  }
}

/**
 * GET - Admin lists all publish requests (with optional status filter)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = createAdminClient()

    const { data: profile } = await adminDb
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const statusFilter = request.nextUrl.searchParams.get('status')

    let query = adminDb
      .from('song_publish_requests')
      .select(`
        *,
        songs:song_id (id, title, entity_type, lyrics),
        song_tracks:track_id (id, title, version, mp3_url, cover_url, duration_ms, metadata)
      `)
      .order('created_at', { ascending: false })

    if (statusFilter && ['pending', 'approved', 'rejected', 'published'].includes(statusFilter)) {
      query = query.eq('status', statusFilter)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      console.error('[SongSubmission] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    const userIds = [...new Set((data || []).map((r: any) => r.user_id))]
    let userMap: Record<string, any> = {}
    if (userIds.length > 0) {
      const { data: users } = await adminDb
        .from('user_accounts')
        .select('id, email, full_name, first_name, last_name')
        .in('id', userIds)
      if (users) {
        userMap = Object.fromEntries(users.map((u: any) => [u.id, u]))
      }
    }

    const submissions = (data || []).map((r: any) => ({
      ...r,
      user_accounts: userMap[r.user_id] || null,
    }))

    return NextResponse.json({ submissions })
  } catch (err) {
    console.error('[SongSubmission] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to fetch',
    }, { status: 500 })
  }
}
