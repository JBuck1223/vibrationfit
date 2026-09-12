/**
 * Member roster — "here's who I'll remember."
 *
 * GET: the member's roster row (or null).
 * PATCH: member edits from the confirm card. Unlike the background extractor
 * (which merges non-destructively), the member's edits are authoritative and
 * replace the submitted sections. `confirm: true` stamps confirmed_at.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadRoster } from '@/lib/roster/store'
import type { RosterUpdate } from '@/lib/roster/types'

export const dynamic = 'force-dynamic'

const EDITABLE_KEYS = [
  'partner',
  'children',
  'pets',
  'people',
  'place',
  'named_things',
  'tender_ground',
  'days_that_matter',
  'vocation',
  'pronouns',
] as const

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roster = await loadRoster(supabase, user.id)
  return NextResponse.json({ roster })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const incoming = (body.roster || {}) as Record<string, unknown>
  const update: Record<string, unknown> = {}
  for (const key of EDITABLE_KEYS) {
    if (key in incoming) update[key] = incoming[key] as RosterUpdate[typeof key]
  }
  if (body.confirm === true) update.confirmed_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('member_roster')
    .upsert({ user_id: user.id, ...update }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    console.error('[Roster API] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
  return NextResponse.json({ roster: data })
}
