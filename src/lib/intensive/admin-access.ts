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
    const { data: { user } } = await supabase.auth.getUser()
    
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
  // First try to get actual enrollment
  const { data: intensiveData } = await supabase
    .from('intensive_purchases')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (intensiveData) {
    return { id: intensiveData.id, isTestMode: false }
  }

  // If super_admin and no enrollment, use a test/preview mode
  if (isSuperAdmin) {
    // Return a placeholder ID for super_admin testing
    return { id: 'super-admin-test-mode', isTestMode: true }
  }

  return null
}
