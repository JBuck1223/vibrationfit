'use client'

import { createClient } from './client'
import type { User } from '@supabase/supabase-js'

/**
 * Lightweight profile interface for client-side use
 * Only includes fields commonly needed in UI components
 */
export interface ActiveProfileFields {
  first_name?: string | null
  profile_picture_url?: string | null
  vibe_assistant_tokens_remaining?: number | null
}

// Simple in-memory cache to prevent repeated fetches
// Cache expires after 30 seconds to ensure fresh data
interface CacheEntry {
  data: ActiveProfileFields | null
  timestamp: number
  userId: string
}

const profileCache = new Map<string, CacheEntry>()
const CACHE_TTL = 30000 // 30 seconds

function getCachedProfile(userId: string): ActiveProfileFields | null | undefined {
  const entry = profileCache.get(userId)
  if (!entry) return undefined
  
  const age = Date.now() - entry.timestamp
  if (age > CACHE_TTL) {
    profileCache.delete(userId)
    return undefined
  }
  
  return entry.data
}

function setCachedProfile(userId: string, data: ActiveProfileFields | null): void {
  profileCache.set(userId, {
    data,
    timestamp: Date.now(),
    userId
  })
}

/**
 * Get the active profile for a user (client-side)
 * Single source of truth for fetching active profile on the client
 * Filters by is_active = true to ensure we get the correct profile
 * Uses in-memory cache to prevent repeated network requests
 */
export async function getActiveProfileClient(userId: string): Promise<ActiveProfileFields | null> {
  // Check cache first
  const cached = getCachedProfile(userId)
  if (cached !== undefined) {
    return cached
  }
  
  const supabase = createClient()
  
  try {
    // Create a timeout promise that rejects after 5 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
    })

    // Create the query promise
    const queryPromise = supabase
      .from('user_profiles')
      .select('first_name, profile_picture_url, vibe_assistant_tokens_remaining')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()
      .then((result) => {
        if (result.error) {
          throw result.error
        }
        return result.data
      })

    // Race between query and timeout
    const data = await Promise.race([queryPromise, timeoutPromise])
    
    // Cache the result
    setCachedProfile(userId, data)
    
    return data
  } catch (err: any) {
    // Handle timeout or other errors
    if (err instanceof Error && err.message === 'Profile fetch timeout') {
      console.warn('Profile fetch timed out after 5 seconds')
      // Cache null result to prevent repeated timeouts
      setCachedProfile(userId, null)
      return null
    }
    
    // Handle Supabase errors
    if (err?.code) {
      // Only log if it's not a "no rows" error
      if (err.code !== 'PGRST116') {
        console.error('Error fetching active profile:', err)
      }
    } else {
      console.error('Unexpected error fetching profile:', err)
    }
    
    // Cache null result to prevent repeated errors
    setCachedProfile(userId, null)
    return null
  }
}

/**
 * Get active profile with custom fields (client-side)
 * Pass an array of field names to fetch only what you need
 */
export async function getActiveProfileFieldsClient(
  userId: string,
  fields: string[]
): Promise<Record<string, any> | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select(fields.join(', '))
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    // Only log if it's not a "no rows" error
    if (error.code && error.code !== 'PGRST116') {
      console.error('Error fetching active profile fields:', error)
    }
    return null
  }

  return data
}

/**
 * Get active profile for the current authenticated user (client-side)
 * Automatically gets the user from Supabase auth
 */
export async function getCurrentUserActiveProfile(): Promise<ActiveProfileFields | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  return getActiveProfileClient(user.id)
}

