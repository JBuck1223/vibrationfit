import { createClient } from '@supabase/supabase-js'

/**
 * Service role client for server-side operations that need to bypass RLS
 * ⚠️ ONLY use this for trusted server-side operations!
 * ⚠️ NEVER expose this client to the frontend!
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}






