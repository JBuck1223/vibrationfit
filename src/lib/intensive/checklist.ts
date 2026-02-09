// Utility functions for updating intensive checklist
// Updated for 14-step Activation Intensive flow

import { createClient } from '@/lib/supabase/client'

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
  | 'vision_refined'             // Step 6: Refine Vision
  // Phase 4: Audio
  | 'audio_generated'            // Step 7: Generate Audio
  // Step 8: Record Audio - optional, uses audio_generated or can be skipped
  | 'audios_generated'           // Step 9: Audio Mix
  // Phase 5: Activation
  | 'vision_board_completed'     // Step 10: Vision Board
  | 'first_journal_entry'        // Step 11: Journal
  | 'call_scheduled'             // Step 12: Book Calibration Call
  // Phase 6: Completion
  | 'activation_protocol_completed' // Step 13: My Activation Plan
  | 'unlock_completed'           // Step 14: Full Platform Unlock

export async function markIntensiveStep(step: IntensiveStepType) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('No user found')
      return false
    }

    // Get active intensive
    const { data: intensiveData, error: intensiveError } = await supabase
      .from('order_items')
      .select('id, orders!inner(user_id), products!inner(product_type), completion_status')
      .eq('orders.user_id', user.id)
      .eq('products.product_type', 'intensive')
      .in('completion_status', ['pending', 'in_progress'])
      .maybeSingle()
    
    if (intensiveError || !intensiveData) {
      console.error('No active intensive found:', intensiveError)
      return false
    }

    // Mark step as completed
    const updateData: any = {
      [step]: true,
      [`${step}_at`]: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('intensive_checklist')
      .update(updateData)
      .eq('intensive_id', intensiveData.id)
    
    if (updateError) {
      console.error('Error updating intensive checklist:', updateError)
      return false
    }

    console.log(`✅ Intensive: ${step} marked complete`)
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

    const { data: intensiveData } = await supabase
      .from('order_items')
      .select('id, orders!inner(user_id), products!inner(product_type), completion_status')
      .eq('orders.user_id', user.id)
      .eq('products.product_type', 'intensive')
      .in('completion_status', ['pending', 'in_progress'])
      .maybeSingle()
    
    return intensiveData?.id || null
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
 * Get step progress for the 14-step intensive
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
      vision_refined: checklist.vision_refined || false,
      audio_generated: checklist.audio_generated || false,
      audios_generated: checklist.audios_generated || false,
      vision_board_completed: checklist.vision_board_completed || false,
      first_journal_entry: checklist.first_journal_entry || false,
      call_scheduled: checklist.call_scheduled || false,
      activation_protocol_completed: checklist.activation_protocol_completed || false,
      unlock_completed: checklist.unlock_completed || false,
    }
  } catch (err) {
    console.error('Error getting intensive progress:', err)
    return null
  }
}

