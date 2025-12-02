/**
 * Helper functions for vision version numbering
 * Version numbers are ALWAYS calculated based on creation order, never stored
 */

import { createClient } from '@/lib/supabase/client'

export interface VisionWithCalculatedVersion {
  id: string
  version_number: number
  [key: string]: any
}

/**
 * Calculate version number for a single vision
 */
export async function calculateVersionNumber(visionId: string): Promise<number> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('get_vision_version_number', {
    p_vision_id: visionId
  })
  
  if (error) {
    console.error('Error calculating version number:', error)
    return 1 // Fallback
  }
  
  return data || 1
}

/**
 * Add calculated version numbers to an array of visions
 */
export async function addCalculatedVersionNumbers<T extends { id: string }>(
  visions: T[]
): Promise<(T & { version_number: number })[]> {
  const supabase = createClient()
  
  const versionsWithNumbers = await Promise.all(
    visions.map(async (vision) => {
      const { data } = await supabase.rpc('get_vision_version_number', {
        p_vision_id: vision.id
      })
      
      return {
        ...vision,
        version_number: data || 1
      }
    })
  )
  
  return versionsWithNumbers
}

/**
 * Get the next available version number for a user
 * (This is just current count + 1, but the actual version will be calculated on fetch)
 */
export async function getNextVersionNumber(userId: string): Promise<number> {
  const supabase = createClient()
  
  const { count } = await supabase
    .from('vision_versions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  
  return (count || 0) + 1
}



