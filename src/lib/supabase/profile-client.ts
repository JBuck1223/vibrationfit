'use client'

import { createClient } from './client'
import type { User } from '@supabase/supabase-js'

/**
 * Lightweight profile interface for client-side use
 * Only includes fields commonly needed in UI components
 * Note: Token balances are fetched separately via token_balances table
 */
export interface ActiveProfileFields {
  id?: string
  first_name?: string | null
  profile_picture_url?: string | null
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

/** True when the browser could not complete the HTTP request (unreachable host, CORS, offline, etc.). */
function isLikelyNetworkFailure(err: unknown): boolean {
  if (!err) return false
  const msg = err instanceof Error ? err.message : String(err)
  if (/failed to fetch|networkerror|load failed|network request failed|aborted/i.test(msg)) return true
  if (err instanceof TypeError && /fetch|network|load failed/i.test(msg)) return true
  return false
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
 * Tries user_accounts first (new schema), falls back to user_profiles (legacy)
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

    // Create the query promise - get account data from user_accounts, profile ID from user_profiles
    const queryPromise = (async () => {
      // Get account info from user_accounts (name, picture now live here)
      const accountResult = await supabase
        .from('user_accounts')
        .select('first_name, profile_picture_url')
        .eq('id', userId)
        .maybeSingle()
      
      // Get active profile ID from user_profiles (only request 'id' - other fields may be dropped)
      const profileResult = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_draft', false)
        .maybeSingle()
      
      // Fallback to most recent profile if no active one
      let profileId = profileResult.data?.id
      if (!profileId) {
        const fallbackResult = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        profileId = fallbackResult.data?.id
      }
      
      const accountData = accountResult.data
      
      return {
        id: profileId || undefined,
        first_name: accountData?.first_name || null,
        profile_picture_url: accountData?.profile_picture_url || null
      }
    })()

    // Race between query and timeout
    const data = await Promise.race([queryPromise, timeoutPromise])
    
    // Cache the result
    setCachedProfile(userId, data)
    
    return data
  } catch (err: any) {
    if (err instanceof Error && err.message === 'Profile fetch timeout') {
      console.warn('Profile fetch timed out after 10 seconds for user:', userId)
      console.warn(
        'Often network latency, cold Supabase, or auth/session slowness. RLS would usually return a PostgREST error in the response, not a timeout.',
      )
      return null
    }

    if (isLikelyNetworkFailure(err)) {
      console.warn('Profile fetch network error for user:', userId, err instanceof Error ? err.message : err)
      console.warn(
        'TypeError/Failed to fetch means the request never completed. Check NEXT_PUBLIC_SUPABASE_URL, paused project, VPN, and that this origin can reach Supabase.',
      )
      return null
    }

    if (err?.code) {
      if (err.code !== 'PGRST116') {
        console.error('Error fetching active profile:', {
          code: err.code,
          message: err.message,
          details: err.details,
          hint: err.hint
        })
      }
    } else if (err && typeof err === 'object' && Object.keys(err).length === 0) {
      console.warn('Empty error object when fetching profile for user:', userId)
    } else {
      console.error('Unexpected error fetching profile:', err instanceof Error ? err.message : err)
    }

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

