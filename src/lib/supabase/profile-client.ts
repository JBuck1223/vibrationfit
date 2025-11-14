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
 * Clear cached profile for a user (useful after profile updates)
 */
export function clearProfileCache(userId: string): void {
  profileCache.delete(userId)
}

/**
 * Clear all cached profiles (useful on logout)
 */
export function clearAllProfileCache(): void {
  profileCache.clear()
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
    // Create a timeout promise that rejects after 10 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
    })

    // Create the query promise
    // Get active profile (user_profiles has is_active but not is_draft)
    const queryPromise = supabase
      .from('user_profiles')
      .select('first_name, profile_picture_url, vibe_assistant_tokens_remaining')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()
      .then(async (result) => {
        // If no active profile found, fallback to most recent profile
        if (result.error || !result.data) {
          const fallbackResult = await supabase
            .from('user_profiles')
            .select('first_name, profile_picture_url, vibe_assistant_tokens_remaining')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (fallbackResult.error) {
            // Only throw if it's not a "no rows" error
            if (fallbackResult.error.code !== 'PGRST116') {
              console.error('Profile fetch error:', fallbackResult.error)
              throw fallbackResult.error
            }
            // No profile exists at all for this user
            return null
          }
          return fallbackResult.data
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
      console.warn('Profile fetch timed out after 10 seconds for user:', userId)
      console.warn('This may indicate a database/RLS issue. Check Supabase logs.')
      // Don't cache null on timeout - might be a temporary issue
      return null
    }
    
    // Handle Supabase errors
    if (err?.code) {
      // Only log if it's not a "no rows" error
      if (err.code !== 'PGRST116') {
        console.error('Error fetching active profile:', {
          code: err.code,
          message: err.message,
          details: err.details,
          hint: err.hint
        })
      }
    } else if (err && typeof err === 'object' && Object.keys(err).length === 0) {
      // Empty error object - likely from Supabase when no error details
      console.warn('Empty error object when fetching profile for user:', userId)
    } else {
      console.error('Unexpected error fetching profile:', err instanceof Error ? err.message : err)
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

