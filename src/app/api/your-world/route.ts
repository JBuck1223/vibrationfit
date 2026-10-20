/**
 * Your World.
 *
 * GET: active version, open draft, every version, and the starting snapshot.
 * POST { snapshot, source? }: save a committed version and make it active
 * (Getting Started). Saving with no changes keeps the current version.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { diffSnapshots } from '@/lib/your-world/snapshot'
import { commitNewVersion, loadWorldState } from '@/lib/your-world/store'
import type { YourWorldSnapshot } from '@/lib/your-world/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [state, { data: account }] = await Promise.all([
    loadWorldState(supabase, user.id),
    supabase.from('user_accounts').select('first_name').eq('id', user.id).maybeSingle(),
  ])
  return NextResponse.json({ ...state, firstName: account?.first_name || '' })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const snapshot = body?.snapshot as YourWorldSnapshot | undefined
  if (!snapshot || typeof snapshot !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  try {
    const state = await loadWorldState(supabase, user.id)
    if (state.active && diffSnapshots(state.active.snapshot, snapshot).length === 0) {
      return NextResponse.json({ version: state.active, changed: false })
    }
    const version = await commitNewVersion(supabase, user.id, snapshot, {
      source: body.source === 'getting_started' ? 'getting_started' : 'member',
      notes: typeof body.notes === 'string' ? body.notes : null,
    })
    return NextResponse.json({ version, changed: true })
  } catch (error) {
    console.error('[YourWorld API] POST error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
