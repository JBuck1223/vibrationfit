// Utility functions for updating intensive checklist

import { createClient } from '@/lib/supabase/client'

export async function markIntensiveStep(step: 
  | 'profile_completed'
  | 'assessment_completed'
  | 'call_scheduled'
  | 'vision_built'
  | 'vision_refined'
  | 'audio_generated'
  | 'vision_board_completed'
  | 'first_journal_entry'
  | 'calibration_call_completed'
  | 'activation_protocol_completed'
) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('No user found')
      return false
    }

    // Get active intensive
    const { data: intensiveData, error: intensiveError } = await supabase
      .from('intensive_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('completion_status', 'pending')
      .single()
    
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
      .from('intensive_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('completion_status', 'pending')
      .single()
    
    return intensiveData?.id || null
  } catch (err) {
    console.error('Error getting active intensive:', err)
    return null
  }
}

