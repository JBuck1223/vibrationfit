/**
 * Admin Access Utility for Intensive Pages
 * 
 * Allows super_admin users to access intensive pages without enrollment
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface AdminAccessResult {
  isSuperAdmin: boolean
  userId: string | null
}

/**
 * Check if the current user is a super_admin
 * Super admins can access all intensive pages without enrollment
 */
export async function checkSuperAdminAccess(
  supabase: SupabaseClient
): Promise<AdminAccessResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    
    if (!user) {
      return { isSuperAdmin: false, userId: null }
    }

    // Check user_accounts table for super_admin role
    const { data: account } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()

    const isSuperAdmin = account?.role === 'super_admin'

    return { isSuperAdmin, userId: user.id }
  } catch (error) {
    console.error('Error checking super admin access:', error)
    return { isSuperAdmin: false, userId: null }
  }
}

/**
 * Get intensive data for a user, or create mock data for super_admin testing
 * Returns null if user is not enrolled and not a super_admin
 */
export async function getIntensiveForUser(
  supabase: SupabaseClient,
  userId: string,
  isSuperAdmin: boolean
): Promise<{ id: string; isTestMode: boolean } | null> {
  const { data: checklist } = await supabase
    .from('intensive_checklist')
    .select('intensive_id')
    .eq('user_id', userId)
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (checklist?.intensive_id) {
    return { id: checklist.intensive_id, isTestMode: false }
  }

  if (isSuperAdmin) {
    return { id: 'super-admin-test-mode', isTestMode: true }
  }

  return null
}
