import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  applyContinuityAction,
  continuityAction,
  normalizeContinuity,
} from '@/lib/rooms/continuity'
import { ROOM_TOOLS, toolForHref } from '@/lib/rooms/catalog'
import { updateMemberState } from '@/lib/rooms/save-member-state'
export async function GET() {
  const client = await createClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await client
    .from('member_dashboard_layouts')
    .select('layout')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error)
    return NextResponse.json(
      { error: 'Unable to load your saved activity' },
      { status: 503 },
    )
  return NextResponse.json(
    { userId: user.id, state: normalizeContinuity(data?.layout?.continuity) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
export async function POST(request: NextRequest) {
  const client = await createClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let input: unknown
  try {
    const raw = await request.text()
    if (raw.length > 150000)
      return NextResponse.json({ error: 'Too large' }, { status: 413 })
    input = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const parsed = continuityAction.safeParse(input)
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid activity' }, { status: 400 })
  const action = parsed.data
  if ('toolId' in action && !ROOM_TOOLS.some((t) => t.id === action.toolId))
    return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })
  if (action.type === 'visit' && toolForHref(action.href)?.id !== action.toolId)
    return NextResponse.json({ error: 'Invalid tool link' }, { status: 400 })
  try {
    const saved = await updateMemberState(client, user.id, (layout) => ({
      ...layout,
      continuity: applyContinuityAction(
        normalizeContinuity(layout.continuity),
        action,
      ),
    }))
    return NextResponse.json({ state: normalizeContinuity(saved.continuity) })
  } catch {
    return NextResponse.json(
      { error: 'Unable to save your activity. Please try again.' },
      { status: 503 },
    )
  }
}
