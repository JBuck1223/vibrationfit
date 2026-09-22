import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const ACTIVATION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isActivationId(value: string | null | undefined): value is string {
  return !!value && ACTIVATION_ID.test(value)
}

export function activationCheckoutPath(activationId: string) {
  return `/checkout?product=membership&planType=solo&activation=${activationId}`
}

export type ActivationCheckoutAccount = {
  userId: string
  email: string
  firstName: string
  lastName: string
  phone: string
  hasPassword: boolean
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function loadActivationOwner(activationId: string): Promise<ActivationCheckoutAccount | null> {
  if (!isActivationId(activationId)) return null
  const db = admin()
  const { data: activation } = await db
    .from('activations')
    .select('id, user_id')
    .eq('id', activationId)
    .maybeSingle()
  if (!activation?.user_id) return null

  const { data: authUser } = await db.auth.admin.getUserById(activation.user_id)
  const email = authUser.user?.email
  if (!email) return null

  const { data: account } = await db
    .from('user_accounts')
    .select('first_name, last_name, phone')
    .eq('id', activation.user_id)
    .maybeSingle()

  return {
    userId: activation.user_id,
    email,
    firstName: account?.first_name || authUser.user?.user_metadata?.first_name || '',
    lastName: account?.last_name || authUser.user?.user_metadata?.last_name || '',
    phone: account?.phone || '',
    hasPassword: authUser.user?.user_metadata?.has_password === true,
  }
}

export async function currentSessionUserId(): Promise<string | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
