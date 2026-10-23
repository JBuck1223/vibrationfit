import { createClient } from '@/lib/supabase/server'
import { checkIsAdmin } from '@/middleware/admin'
import { canAccessStorageKey, isSafeStorageKey } from './storage-policy'

export async function storageActor() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return error || !user ? null : { user, supabase }
}

export async function storageKeyAllowed(actor: NonNullable<Awaited<ReturnType<typeof storageActor>>>, key: unknown) {
  if (!isSafeStorageKey(key)) return false
  if (canAccessStorageKey(key, actor.user.id)) return true
  return canAccessStorageKey(key, actor.user.id, await checkIsAdmin(actor.supabase, actor.user))
}
