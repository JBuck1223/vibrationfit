import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkIsAdmin } from '@/middleware/admin'
import type { User } from '@supabase/supabase-js'

export const IMPERSONATION_COOKIE = 'vf-impersonate-uid'
export const IMPERSONATION_EMAIL_COOKIE = 'vf-impersonate-email'
export const IMPERSONATION_NAME_COOKIE = 'vf-impersonate-name'

interface EffectiveUserResult {
  user: User | null
  supabase: any
  isImpersonating: boolean
  realUser: User | null
}

/**
 * Server-side utility: returns the effective user for the current request.
 * If an admin is impersonating another user, returns that user's data
 * with a service-role supabase client (bypasses RLS).
 * Otherwise returns the normal authenticated user and client.
 */
export async function getEffectiveUser(): Promise<EffectiveUserResult> {
  const supabase = await createClient()
  const { data: { user: realUser } } = await supabase.auth.getUser()

  if (!realUser) {
    return { user: null, supabase, isImpersonating: false, realUser: null }
  }

  const cookieStore = await cookies()
  const targetUserId = cookieStore.get(IMPERSONATION_COOKIE)?.value

  if (!targetUserId || targetUserId === realUser.id) {
    return { user: realUser, supabase, isImpersonating: false, realUser }
  }

  const isAdmin = await checkIsAdmin(supabase, { id: realUser.id, email: realUser.email })
  if (!isAdmin) {
    return { user: realUser, supabase, isImpersonating: false, realUser }
  }

  const adminClient = createAdminClient()
  const { data: { user: targetUser } } = await adminClient.auth.admin.getUserById(targetUserId)

  if (!targetUser) {
    return { user: realUser, supabase, isImpersonating: false, realUser }
  }

  return {
    user: targetUser,
    supabase: adminClient,
    isImpersonating: true,
    realUser,
  }
}

/**
 * Server-side: get the impersonation target user ID from cookies (if any).
 * Lighter than getEffectiveUser — just reads the cookie without auth checks.
 */
export async function getImpersonationTarget(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(IMPERSONATION_COOKIE)?.value ?? null
}
