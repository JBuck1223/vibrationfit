/**
 * Client-side intensive utilities
 * Use these in React components (with useState/useEffect)
 */

import { createClient } from '@/lib/supabase/client'

export interface IntensiveData {
  id: string
  user_id: string
  intensive_id: string
  status: 'pending' | 'in_progress' | 'completed'
  started_at: string | null
  completed_at: string | null
  created_at: string
  // Step completion booleans
  profile_completed: boolean
  assessment_completed: boolean
  call_scheduled: boolean
  vision_built: boolean
  vision_refined: boolean
  audio_generated: boolean
  vision_board_completed: boolean
  first_journal_entry: boolean
  calibration_call_completed: boolean
  activation_protocol_completed: boolean
}

/**
 * Get current user's active intensive
 * SINGLE SOURCE OF TRUTH: intensive_checklist.status
 */
export async function getActiveIntensiveClient(): Promise<IntensiveData | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('intensive_checklist')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching active intensive:', error)
    return null
  }
  
  return data
}

/**
 * Start the intensive timer
 * Called when user clicks "Start My Intensive" button
 * Updates intensive_checklist (source of truth)
 */
export async function startIntensive(checklistId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  const startedAt = new Date()
  
  const { error } = await supabase
    .from('intensive_checklist')
    .update({
      status: 'in_progress',
      started_at: startedAt.toISOString()
    })
    .eq('id', checklistId)
  
  if (error) {
    console.error('Error starting intensive:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

/**
 * Mark intensive as completed
 * Called when user clicks "Enter Your Dashboard" after 100% completion
 * Updates intensive_checklist (source of truth)
 */
export async function completeIntensive(checklistId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('intensive_checklist')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', checklistId)
  
  if (error) {
    console.error('Error completing intensive:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

