/**
 * Refinement Helpers
 * 
 * Helper functions for managing vision_refinements table
 */

import { createClient } from '@/lib/supabase/client'
import { RefinementInputs, WeaveInputs } from '@/lib/viva/prompts/refine-category-vision-prompt'

export interface VisionRefinement {
  id: string
  user_id: string
  vision_id: string
  category: string
  input_text: string
  output_text: string
  refinement_inputs: RefinementInputs
  weave_settings: WeaveInputs
  applied: boolean
  applied_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Save a new refinement to the database
 */
export async function saveRefinement({
  visionId,
  category,
  inputText,
  outputText,
  refinementInputs,
  weaveSettings,
}: {
  visionId: string
  category: string
  inputText: string
  outputText: string
  refinementInputs: RefinementInputs
  weaveSettings: WeaveInputs
}): Promise<VisionRefinement> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vision_refinements')
    .insert({
      vision_id: visionId,
      category,
      input_text: inputText,
      output_text: outputText,
      refinement_inputs: refinementInputs as any,
      weave_settings: weaveSettings as any,
      applied: false,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error saving refinement:', error)
    throw new Error(`Failed to save refinement: ${error.message}`)
  }
  
  return data as VisionRefinement
}

/**
 * Mark a refinement as applied
 */
export async function markRefinementApplied(refinementId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('vision_refinements')
    .update({
      applied: true,
      applied_at: new Date().toISOString(),
    })
    .eq('id', refinementId)
  
  if (error) {
    console.error('Error marking refinement as applied:', error)
    throw new Error(`Failed to mark refinement as applied: ${error.message}`)
  }
}

/**
 * Get refinement history for a category
 */
export async function getRefinementHistory(
  visionId: string,
  category: string
): Promise<VisionRefinement[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vision_refinements')
    .select('*')
    .eq('vision_id', visionId)
    .eq('category', category)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching refinement history:', error)
    throw new Error(`Failed to fetch refinement history: ${error.message}`)
  }
  
  return data as VisionRefinement[]
}

/**
 * Get latest unapplied refinement for a category
 */
export async function getLatestRefinement(
  visionId: string,
  category: string
): Promise<VisionRefinement | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vision_refinements')
    .select('*')
    .eq('vision_id', visionId)
    .eq('category', category)
    .eq('applied', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching latest refinement:', error)
    throw new Error(`Failed to fetch latest refinement: ${error.message}`)
  }
  
  return data as VisionRefinement | null
}

/**
 * Delete a refinement
 */
export async function deleteRefinement(refinementId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('vision_refinements')
    .delete()
    .eq('id', refinementId)
  
  if (error) {
    console.error('Error deleting refinement:', error)
    throw new Error(`Failed to delete refinement: ${error.message}`)
  }
}

