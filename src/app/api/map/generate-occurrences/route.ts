import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateOccurrences } from '@/lib/map/occurrence-generator'

/**
 * POST /api/map/generate-occurrences
 *
 * Materializes commitment occurrences for the 14-day rolling window.
 * Can be called by cron (with CRON_SECRET) or by an authenticated user
 * (generates only their own occurrences).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`

    if (isCron) {
      const result = await generateOccurrences()
      return NextResponse.json({
        message: `Generated ${result.generated} occurrences, expired ${result.expired}`,
        ...result,
      })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await generateOccurrences(user.id)
    return NextResponse.json({
      message: `Generated ${result.generated} occurrences, expired ${result.expired}`,
      ...result,
    })
  } catch (err) {
    console.error('Error in POST /api/map/generate-occurrences:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
