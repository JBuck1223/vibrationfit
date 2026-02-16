import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/map/status
 * 
 * Returns the user's current MAP (My Activation Plan) status:
 * - Current day number (1-28)
 * - AM completion status (done/not started)
 * - PM completion status (done/not started)
 * - Whether MAP has been started
 * 
 * TODO: This is a temporary implementation. We need to create:
 * - A daily_activations table to track AM/PM completions
 * - A user_map_settings table to store MAP start date and preferences
 * 
 * For now, we'll return mock data to enable the UI.
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

    const mapStarted = checklist?.activation_protocol_completed || false
    
    if (!mapStarted) {
      return NextResponse.json({
        mapStarted: false,
        dayNumber: 0,
        amDone: false,
        pmDone: false,
      })
    }

    // Calculate day number based on when they completed the MAP setup
    const startDate = checklist?.activation_protocol_completed_at 
      ? new Date(checklist.activation_protocol_completed_at)
      : new Date()
    
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const dayNumber = Math.min(diffDays, 28) // Cap at 28 days

    // TODO: Query daily_activations table to check AM/PM completion for today
    // For now, return false for both (not completed yet)
    const amDone = false
    const pmDone = false

    return NextResponse.json({
      mapStarted: true,
      dayNumber,
      amDone,
      pmDone,
    })
  } catch (error) {
    console.error('Error fetching MAP status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MAP status' },
      { status: 500 }
    )
  }
}
