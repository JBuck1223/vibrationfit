/**
 * Server-side intensive utilities
 * Automatically detect if user is in intensive mode (no URL parameters needed!)
 */

import { createClient } from '@/lib/supabase/server'

/** Human-readable label for email templates and UI (full -> Paid in Full, 2pay -> 2 Payment Plan, etc.) */
export function getPaymentPlanLabel(plan: string): string {
  switch (plan) {
    case 'full': return 'Paid in Full'
    case '2pay': return '2 Payment Plan'
    case '3pay': return '3 Payment Plan'
    default: return plan || 'Paid in Full'
  }
}

export interface IntensiveData {
  id: string
  payment_plan: string
  status: 'pending' | 'in_progress' | 'completed' | 'refunded'
  created_at: string
  started_at: string | null
  completed_at: string | null
}

/**
 * Get user's active intensive (pending or in_progress)
 * Returns null if no active intensive or if completed
 */
export async function getActiveIntensive(userId: string): Promise<IntensiveData | null> {
  const supabase = await createClient()
  
  const { data: checklist, error } = await supabase
    .from('intensive_checklist')
    .select('intensive_id, status, started_at, completed_at, created_at')
    .eq('user_id', userId)
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching active intensive:', error)
  }

  if (!checklist?.intensive_id) return null

  return {
    id: checklist.intensive_id,
    payment_plan: 'full',
    status: checklist.status as 'pending' | 'in_progress',
    created_at: checklist.created_at,
    started_at: checklist.started_at,
    completed_at: checklist.completed_at,
  }
}

/**
 * Check if user is currently in intensive mode
 * Simple boolean check
 */
export async function isInIntensiveMode(userId: string): Promise<boolean> {
  const intensive = await getActiveIntensive(userId)
  return !!intensive
}

/**
 * Check if user has started their intensive
 * (has clicked the "Start" button)
 */
export async function hasStartedIntensive(userId: string): Promise<boolean> {
  const intensive = await getActiveIntensive(userId)
  return !!intensive?.started_at
}

/**
 * Get intensive progress (0-100%)
 */
export async function getIntensiveProgress(intensiveId: string): Promise<number> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('intensive_checklist')
    .select('*')
    .eq('intensive_id', intensiveId)
    .maybeSingle()
  
  if (!data) return 0
  
  const steps = [
    'profile_completed',
    'assessment_completed',
    'call_scheduled',
    'vision_built',
    'vision_refined',
    'audio_generated',
    'vision_board_completed',
    'first_journal_entry',
    'calibration_call_completed',
    'activation_protocol_completed',
  ]
  
  const completed = steps.filter(step => data[step]).length
  return Math.round((completed / steps.length) * 100)
}

