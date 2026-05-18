// Utility functions for updating intensive checklist
// Updated for 12-step Activation Intensive flow

import { createClient } from '@/lib/supabase/client'
import { invalidateIntensiveSnapshot } from '@/lib/intensive/intensive-snapshot'

// All possible intensive steps that can be marked complete
// Note: Step 1 (Settings) is tracked via user_accounts table directly
export type IntensiveStepType = 
  // Phase 1: Setup
  | 'intake_completed'           // Step 2: Baseline Intake
  // Phase 2: Foundation
  | 'profile_completed'          // Step 3: Profile
  | 'assessment_completed'       // Step 4: Assessment
  // Phase 3: Vision Creation
  | 'vision_built'               // Step 5: Build Life Vision
  // Phase 4: Audio
  | 'audio_generated'            // Step 6: Generate Audio
  // Step 7: Record Audio - optional, uses audio_generated or can be skipped
  | 'audios_generated'           // Step 8: Audio Mix
  // Phase 5: Activation
  | 'vision_board_completed'     // Step 9: Vision Board
  | 'first_journal_entry'        // Step 10: Journal
  // Phase 6: Completion
  | 'activation_protocol_completed' // Step 11: MAP — My Alignment Plan
  | 'unlock_completed'           // Step 12: Full Platform Unlock

export async function markIntensiveStep(step: IntensiveStepType) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('No user found')
      return false
    }

    const { data: checklist, error: checklistError } = await supabase
      .from('intensive_checklist')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (checklistError || !checklist) {
      console.error('No active intensive checklist found:', checklistError)
      return false
    }

    const updateData: any = {
      [step]: true,
      [`${step}_at`]: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('intensive_checklist')
      .update(updateData)
      .eq('id', checklist.id)
    
    if (updateError) {
      console.error('Error updating intensive checklist:', updateError)
      return false
    }

    console.log(`Intensive: ${step} marked complete`)
    invalidateIntensiveSnapshot()
    return true
  } catch (err) {
    console.error('Error in markIntensiveStep:', err)
    return false
  }
}

export async function getActiveIntensiveId(): Promise<string | null> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: checklist } = await supabase
      .from('intensive_checklist')
      .select('intensive_id')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    return checklist?.intensive_id || null
  } catch (err) {
    console.error('Error getting active intensive:', err)
    return null
  }
}

/**
 * Check if user is currently in intensive mode
 * Returns true if they have an active intensive checklist
 */
export async function isInIntensiveMode(): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: checklist } = await supabase
      .from('intensive_checklist')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .maybeSingle()
    
    return !!checklist
  } catch (err) {
    console.error('Error checking intensive mode:', err)
    return false
  }
}

/**
 * Get step progress for the 12-step intensive
 * Returns an object with each step's completion status
 */
export async function getIntensiveStepProgress(): Promise<Record<IntensiveStepType, boolean> | null> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: checklist } = await supabase
      .from('intensive_checklist')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .maybeSingle()
    
    if (!checklist) return null

    return {
      intake_completed: checklist.intake_completed || false,
      profile_completed: checklist.profile_completed || false,
      assessment_completed: checklist.assessment_completed || false,
      vision_built: checklist.vision_built || false,
      audio_generated: checklist.audio_generated || false,
      audios_generated: checklist.audios_generated || false,
      vision_board_completed: checklist.vision_board_completed || false,
      first_journal_entry: checklist.first_journal_entry || false,
      activation_protocol_completed: checklist.activation_protocol_completed || false,
      unlock_completed: checklist.unlock_completed || false,
    }
  } catch (err) {
    console.error('Error getting intensive progress:', err)
    return null
  }
}

