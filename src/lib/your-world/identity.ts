/**
 * The Account facts that live on My World: name, birthday, and phone.
 * Stored on user_accounts. The rest of My World is a versioned snapshot.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface WorldIdentity {
  firstName: string
  lastName: string
  phone: string
  dateOfBirth: string
}

export function emptyIdentity(): WorldIdentity {
  return { firstName: '', lastName: '', phone: '', dateOfBirth: '' }
}

export function missingIdentityFields(identity: WorldIdentity): string[] {
  const missing: string[] = []
  if (!identity.firstName.trim()) missing.push('first name')
  if (!identity.lastName.trim()) missing.push('last name')
  if (!identity.dateOfBirth) missing.push('birthday')
  if (identity.phone.replace(/\D/g, '').length < 10) missing.push('phone')
  return missing
}

export async function loadWorldIdentity(
  supabase: SupabaseClient,
  userId: string,
): Promise<WorldIdentity> {
  const { data } = await supabase
    .from('user_accounts')
    .select('first_name, last_name, phone, date_of_birth')
    .eq('id', userId)
    .maybeSingle()
  return {
    firstName: data?.first_name?.trim() || '',
    lastName: data?.last_name?.trim() || '',
    phone: data?.phone?.trim() || '',
    dateOfBirth: data?.date_of_birth ? String(data.date_of_birth).slice(0, 10) : '',
  }
}

export function asIdentity(value: unknown): WorldIdentity | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const text = (key: string) => (typeof row[key] === 'string' ? row[key] : '')
  return {
    firstName: text('firstName'),
    lastName: text('lastName'),
    phone: text('phone'),
    dateOfBirth: text('dateOfBirth'),
  }
}

export async function saveWorldIdentity(
  supabase: SupabaseClient,
  userId: string,
  identity: WorldIdentity,
): Promise<void> {
  const firstName = identity.firstName.trim()
  const lastName = identity.lastName.trim()
  const { error } = await supabase
    .from('user_accounts')
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      phone: identity.phone.trim() || null,
      date_of_birth: identity.dateOfBirth || null,
    })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}
