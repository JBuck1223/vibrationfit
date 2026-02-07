// Admin Supabase client with SERVICE ROLE key
// ONLY use this for admin-only operations that require elevated permissions

import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Centralized admin check — single source of truth for admin authorization.
// Add new admin emails here instead of updating 15+ files.
const ADMIN_EMAILS = [
  'buckinghambliss@gmail.com',
  'admin@vibrationfit.com',
]

export function isUserAdmin(user: User | null): boolean {
  if (!user) return false
  return (
    ADMIN_EMAILS.includes(user.email ?? '') ||
    user.user_metadata?.is_admin === true
  )
}












