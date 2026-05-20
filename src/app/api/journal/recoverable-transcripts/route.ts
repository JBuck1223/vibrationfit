import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listRecoverableJournalTranscripts } from '@/lib/journal/recoverable-transcripts'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const items = await listRecoverableJournalTranscripts(supabase, user.id)

    return NextResponse.json({
      items,
      count: items.length,
      lookbackDays: 14,
    })
  } catch (error) {
    console.error('[recoverable-transcripts]', error)
    return NextResponse.json(
      { error: 'Failed to load recoverable transcripts' },
      { status: 500 }
    )
  }
}
