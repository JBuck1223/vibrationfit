/**
 * Draft Vision Helper Functions
 * Utilities for managing draft vision_versions rows
 */

import { createClient } from '@/lib/supabase/client'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

export interface VisionData {
  id: string
  user_id: string
  version_number: number
  title?: string
  is_draft: boolean
  is_active: boolean
  completion_percent: number
  
  // Category fields
  forward: string
  fun: string
  travel: string
  home: string
  family: string
  love: string
  health: string
  money: string
  work: string
  social: string
  stuff: string
  giving: string
  spirituality: string
  conclusion: string
  
  // Draft flags
  is_active: boolean
  is_draft: boolean
  
  // Refinement tracking
  refined_categories?: string[]
  
  created_at: string
  updated_at: string
}

/**
 * Get or create draft vision for user
 * If draft exists, returns it. If not, creates one based on active vision.
 */
export async function ensureDraftExists(activeVisionId: string): Promise<VisionData> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // Check for existing draft
  const { data: draft } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_draft', true)
    .eq('is_active', false)
    .maybeSingle()
  
  if (draft) {
    return draft as VisionData
  }
  
  // Create draft from active vision
  const response = await fetch('/api/vision/draft/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visionId: activeVisionId })
  })
  
  if (!response.ok) {
    throw new Error('Failed to create draft vision')
  }
  
  const { draft: newDraft } = await response.json()
  return newDraft as VisionData
}

/**
 * Get active vision for user
 */
export async function getActiveVision(userId: string): Promise<VisionData | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_draft', false)
    .maybeSingle()
  
  return data as VisionData | null
}

/**
 * Get draft vision for user (if exists)
 */
export async function getDraftVision(userId: string): Promise<VisionData | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_draft', true)
    .eq('is_active', false)
    .maybeSingle()
  
  return data as VisionData | null
}

/**
 * Update a specific category in draft vision
 */
export async function updateDraftCategory(
  draftId: string, 
  category: string, 
  content: string
): Promise<VisionData> {
  const response = await fetch('/api/vision/draft/update', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draftId, category, content })
  })
  
  if (!response.ok) {
    throw new Error('Failed to update draft category')
  }
  
  const { draft } = await response.json()
  return draft as VisionData
}

/**
 * Commit draft as new active vision
 */
export async function commitDraft(draftId: string): Promise<VisionData> {
  const response = await fetch('/api/vision/draft/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draftId })
  })
  
  if (!response.ok) {
    throw new Error('Failed to commit draft')
  }
  
  const { vision } = await response.json()
  return vision as VisionData
}

/**
 * Delete draft vision
 */
export async function deleteDraft(draftId: string): Promise<void> {
  const response = await fetch(`/api/vision/draft?draftId=${draftId}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete draft')
  }
}

/**
 * Get categories that differ between draft and active
 * Uses refined_categories tracking if available, otherwise compares values
 */
export function getDraftCategories(
  draft: VisionData, 
  active: VisionData
): string[] {
  // If draft has refined_categories tracking, use that
  if (draft.refined_categories && draft.refined_categories.length > 0) {
    return draft.refined_categories
  }
  
  // Fallback: Compare values directly
  return VISION_CATEGORIES
    .filter(cat => {
      const categoryKey = cat.key as keyof VisionData
      const draftValue = draft[categoryKey] as string
      const activeValue = active[categoryKey] as string
      
      // Normalize values for comparison
      const draftNormalized = (draftValue || '').trim()
      const activeNormalized = (activeValue || '').trim()
      
      return draftNormalized !== activeNormalized
    })
    .map(cat => cat.key)
}

/**
 * Get refined categories directly from draft (faster than comparing)
 */
export function getRefinedCategories(draft: VisionData): string[] {
  return draft.refined_categories || []
}

/**
 * Check if a specific category has been refined
 */
export function isCategoryRefined(draft: VisionData, category: string): boolean {
  return draft.refined_categories?.includes(category) || false
}

/**
 * Sync refined_categories by comparing with active vision
 * Useful for fixing tracking discrepancies
 */
export async function syncRefinedCategories(
  draftId: string,
  activeVisionId: string
): Promise<string[]> {
  const supabase = createClient()
  
  // Call the database function to sync
  const { data, error } = await supabase.rpc('sync_refined_categories_from_active', {
    draft_vision_id: draftId,
    active_vision_id: activeVisionId
  })
  
  if (error) {
    console.error('Error syncing refined categories:', error)
    return []
  }
  
  return data || []
}

/**
 * Check if user has an active draft
 */
export async function hasDraft(userId: string): Promise<boolean> {
  const supabase = createClient()
  const { count } = await supabase
    .from('vision_versions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_draft', true)
    .eq('is_active', false)
  
  return (count || 0) > 0
}

