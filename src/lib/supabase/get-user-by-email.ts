// Targeted auth user lookup by email.
//
// Replaces `auth.admin.listUsers()` full scans in the checkout and Stripe
// webhook hot paths. Uses the get_user_id_by_email() SQL function (indexed
// lookup into auth.users). If the RPC is unavailable (e.g. migration not yet
// applied), falls back to the legacy listUsers scan so provisioning never
// breaks.

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Look up an auth user's id by email. Returns null when no user exists.
 * Must be called with a service-role (admin) client.
 */
export async function getUserIdByEmail(
  supabaseAdmin: SupabaseClient,
  email: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.rpc('get_user_id_by_email', {
    p_email: email,
  })

  if (!error) {
    return (data as string | null) || null
  }

  console.warn(
    '[get-user-by-email] RPC failed, falling back to listUsers scan:',
    error.message
  )

  // Legacy fallback: paginate so users beyond the first page are still found
  const perPage = 1000
  for (let page = 1; page <= 50; page++) {
    const { data: pageData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (listError) {
      console.error('[get-user-by-email] listUsers fallback failed:', listError)
      return null
    }
    const match = pageData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )
    if (match) return match.id
    if (!pageData?.users || pageData.users.length < perPage) break
  }
  return null
}
