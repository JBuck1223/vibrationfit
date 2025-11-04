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

/**
 * Get the active profile for a user (client-side)
 * Single source of truth for fetching active profile on the client
 * Filters by is_active = true to ensure we get the correct profile
 */
export async function getActiveProfileClient(userId: string): Promise<ActiveProfileFields | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('first_name, profile_picture_url, vibe_assistant_tokens_remaining')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    // Only log if it's not a "no rows" error
    if (error.code && error.code !== 'PGRST116') {
      console.error('Error fetching active profile:', error)
    }
    return null
  }

  return data
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

