import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGraduateChecklist } from '@/lib/graduate-checklist'

export type { GraduateChecklistProgress, GraduateChecklistResult as GraduateChecklistResponse } from '@/lib/graduate-checklist'

/**
 * GET /api/graduate-checklist
 *
 * Returns whether the user is an intensive graduate and progress for the
 * "Getting Started as a Graduate" 7-day checklist. Only graduates get progress.
 */
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

    const result = await getGraduateChecklist(supabase, user.id)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Error fetching graduate checklist:', err)
    return NextResponse.json(
      { error: 'Failed to fetch graduate checklist' },
      { status: 500 }
    )
  }
}
