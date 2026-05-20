import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureOccurrencesForDate, generateOccurrences } from '@/lib/map/occurrence-generator'

/**
 * POST /api/map/occurrences/ensure
 * Body: { date?: string } — materialize occurrences for active commitments on that date.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let date: string | undefined
    try {
      const body = await request.json()
      date = body?.date
    } catch {
      date = undefined
    }

    const targetDate = date || new Date().toISOString().split('T')[0]

    await generateOccurrences(user.id, targetDate)
    const result = await ensureOccurrencesForDate(user.id, targetDate)

    return NextResponse.json({ generated: result.generated, date: targetDate })
  } catch (err) {
    console.error('Error in POST /api/map/occurrences/ensure:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
