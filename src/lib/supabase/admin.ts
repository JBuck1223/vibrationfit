// Admin Supabase client with SERVICE ROLE key
// ONLY use this for admin-only operations that require elevated permissions

import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { checkIsAdmin } from '@/middleware/admin'

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

/**
 * Verify the current request is from an admin user.
 * Checks user_accounts.role in the database (admin or super_admin).
 * Returns the authenticated user or an error response object.
 */
export async function verifyAdminAccess(): Promise<
  { user: User; supabase: any } | { error: string; status: number }
> {
  const supabase = await createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Authentication required', status: 401 }
  }

  const isAdmin = await checkIsAdmin(supabase, { id: user.id, email: user.email })
  if (!isAdmin) {
    return { error: 'Admin access required', status: 403 }
  }

  return { user, supabase: supabase as any }
}

/** @deprecated Use verifyAdminAccess() instead — this uses hardcoded emails, not the database. */
export function isUserAdmin(user: User | null): boolean {
  if (!user) return false
  const LEGACY_ADMIN_EMAILS = ['buckinghambliss@gmail.com', 'admin@vibrationfit.com']
  return (
    LEGACY_ADMIN_EMAILS.includes(user.email ?? '') ||
    user.user_metadata?.is_admin === true
  )
}












