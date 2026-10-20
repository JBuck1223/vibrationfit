/**
 * Your World draft.
 *
 * POST: open a draft from the active version (or return the open one).
 * PATCH { id, snapshot }: save draft edits.
 * DELETE ?id=: discard the draft.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDraftFromActive, discardDraft, updateDraft } from '@/lib/your-world/store'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json({ draft: await createDraftFromActive(supabase, user.id) })
  } catch (error) {
    console.error('[YourWorld API] draft create error:', error)
    return NextResponse.json({ error: 'Could not start an update' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.id || !body?.snapshot) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  try {
    return NextResponse.json({ draft: await updateDraft(supabase, user.id, body.id, body.snapshot) })
  } catch (error) {
    console.error('[YourWorld API] draft update error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    await discardDraft(supabase, user.id, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[YourWorld API] draft discard error:', error)
    return NextResponse.json({ error: 'Failed to discard' }, { status: 500 })
  }
}
