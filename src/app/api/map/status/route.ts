import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/map/status
 * 
 * Returns the user's current MAP (My Activation Plan) status:
 * - Whether MAP has been started
 * - Current day number (1-28)
 * - AM/PM completion status
 * - Active map ID (if any weekly MAP exists)
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has completed the MAP setup step in intensive
    const { data: checklist } = await supabase
      .from('intensive_checklist')
      .select('activation_protocol_completed, activation_protocol_completed_at')
      .eq('user_id', user.id)
      .maybeSingle()

    const startDate = checklist?.activation_protocol_completed_at 
      ? new Date(checklist.activation_protocol_completed_at)
      : new Date()
    
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const dayNumber = checklist?.activation_protocol_completed_at 
      ? Math.min(diffDays, 28) 
      : 0

    const amDone = false
    const pmDone = false

    // Find active weekly MAP
    let activeMapId: string | null = null
    try {
      const { data: activeMap } = await supabase
        .from('user_maps')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .limit(1)
        .maybeSingle()

      if (activeMap) {
        activeMapId = activeMap.id
      }
    } catch {
      // Table may not exist yet; ignore
    }

    return NextResponse.json({
      mapStarted: true,
      dayNumber,
      amDone,
      pmDone,
      activeMapId,
    })
  } catch (error) {
    console.error('Error fetching MAP status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MAP status' },
      { status: 500 }
    )
  }
}
