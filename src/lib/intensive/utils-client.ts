/**
 * Client-side intensive utilities
 * Use these in React components (with useState/useEffect)
 */

import { createClient } from '@/lib/supabase/client'

export interface IntensiveData {
  id: string
  user_id: string
  payment_plan: string
  completion_status: 'pending' | 'in_progress' | 'completed' | 'refunded'
  created_at: string
  started_at: string | null
  completed_at: string | null
  activation_deadline: string | null
  continuity_plan: string
}

/**
 * Get current user's active intensive
 */
export async function getActiveIntensiveClient(): Promise<IntensiveData | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('intensive_purchases')
    .select('*')
    .eq('user_id', user.id)
    .in('completion_status', ['pending', 'in_progress'])
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
 */
export async function startIntensive(intensiveId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  const startedAt = new Date()
  const deadline = new Date(startedAt.getTime() + 72 * 60 * 60 * 1000) // 72 hours later
  
  const { error } = await supabase
    .from('intensive_purchases')
    .update({
      started_at: startedAt.toISOString(),
      activation_deadline: deadline.toISOString(),
      completion_status: 'in_progress'
    })
    .eq('id', intensiveId)
  
  if (error) {
    console.error('Error starting intensive:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

/**
 * Mark intensive as completed
 * Called when user clicks "Enter Your Dashboard" after 100% completion
 */
export async function completeIntensive(intensiveId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('intensive_purchases')
    .update({
      completion_status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', intensiveId)
  
  if (error) {
    console.error('Error completing intensive:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

