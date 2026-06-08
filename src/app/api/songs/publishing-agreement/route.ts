import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  hasAcceptedSongPublishingAgreement,
  SONG_PUBLISHING_AGREEMENT_VERSION,
} from '@/lib/songs/publishing-agreement'

export const dynamic = 'force-dynamic'

/**
 * GET - Returns the current user's Song Publishing Agreement acceptance status
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: account } = await supabase
      .from('user_accounts')
      .select('song_publishing_agreement_accepted_at, song_publishing_agreement_version, song_publishing_legal_name')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      accepted: hasAcceptedSongPublishingAgreement(account),
      agreement_version: account?.song_publishing_agreement_version ?? null,
      accepted_at: account?.song_publishing_agreement_accepted_at ?? null,
      legal_name: account?.song_publishing_legal_name ?? null,
    })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to load agreement status',
    }, { status: 500 })
  }
}

/**
 * POST - Records one-time acceptance of the Song Publishing Agreement for the current user.
 * This is a blanket acceptance: once accepted, Vibration Fit may publish any VIVA song the user creates.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const legalName = typeof body?.songwriter_legal_name === 'string'
      ? body.songwriter_legal_name.trim()
      : ''

    if (!legalName) {
      return NextResponse.json({ error: 'Full legal name is required' }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const { data: account } = await adminDb
      .from('user_accounts')
      .select('song_publishing_agreement_accepted_at, song_publishing_agreement_version, song_publishing_legal_name')
      .eq('id', user.id)
      .single()

    // Idempotent: if the current version is already accepted, leave the original record intact.
    if (hasAcceptedSongPublishingAgreement(account)) {
      return NextResponse.json({
        accepted: true,
        agreement_version: SONG_PUBLISHING_AGREEMENT_VERSION,
        legal_name: account?.song_publishing_legal_name ?? legalName,
      })
    }

    const { error: updateError } = await adminDb
      .from('user_accounts')
      .update({
        song_publishing_agreement_accepted_at: new Date().toISOString(),
        song_publishing_agreement_version: SONG_PUBLISHING_AGREEMENT_VERSION,
        song_publishing_legal_name: legalName,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[PublishingAgreement] Update error:', updateError)
      return NextResponse.json({ error: 'Could not save your agreement' }, { status: 500 })
    }

    return NextResponse.json({
      accepted: true,
      agreement_version: SONG_PUBLISHING_AGREEMENT_VERSION,
      legal_name: legalName,
    })
  } catch (err) {
    console.error('[PublishingAgreement] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to save agreement',
    }, { status: 500 })
  }
}
