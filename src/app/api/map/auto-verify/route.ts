import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { autoVerifyOccurrence } from '@/lib/map/auto-verify'

/**
 * POST /api/map/auto-verify
 *
 * Client-callable endpoint to auto-verify a pending commitment occurrence
 * when the user completes an on-platform action.
 *
 * Body: { area: string } — e.g. 'journal', 'vision-audio', 'vibe-tribe'
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { area } = body as { area?: string }

    if (!area) {
      return NextResponse.json({ error: 'area is required' }, { status: 400 })
    }

    const result = await autoVerifyOccurrence(user.id, area)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Error in POST /api/map/auto-verify:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
