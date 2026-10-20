/** POST { id, notes? }: commit the draft as the active version. */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { commitDraft } from '@/lib/your-world/store'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null
    return NextResponse.json({ version: await commitDraft(supabase, user.id, body.id, notes) })
  } catch (error) {
    console.error('[YourWorld API] commit error:', error)
    return NextResponse.json({ error: 'Failed to commit' }, { status: 500 })
  }
}
