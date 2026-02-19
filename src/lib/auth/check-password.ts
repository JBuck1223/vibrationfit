/**
 * Client-side utility to check if the current user has set a password.
 *
 * Uses a layered approach:
 * 1. Fast path: check user_metadata.has_password (set by our setup-password flow)
 * 2. Fallback: call the check_user_has_password() RPC (reads auth.users.encrypted_password)
 *    - If RPC confirms a password exists, auto-updates user_metadata for future fast checks
 *
 * This handles users who set their password outside the setup-password flow
 * (e.g. direct signup, Supabase admin, password reset, etc.)
 */

import type { SupabaseClient, User } from '@supabase/supabase-js'

export async function checkUserHasPassword(
  supabase: SupabaseClient,
  user: User
): Promise<boolean> {
  // Fast path: metadata flag is already set
  if (user.user_metadata?.has_password === true) {
    return true
  }

  // Fallback: ask the database directly via RPC
  try {
    const { data, error } = await supabase.rpc('check_user_has_password')

    if (error) {
      console.error('check_user_has_password RPC error:', error.message)
      return false
    }

    if (data === true) {
      // Password confirmed server-side — sync the metadata flag so future checks are instant.
      // Fire-and-forget; don't block on this.
      supabase.auth.updateUser({ data: { has_password: true } }).catch(() => {})
      return true
    }
  } catch (err) {
    console.error('Unexpected error checking password:', err)
  }

  return false
}
