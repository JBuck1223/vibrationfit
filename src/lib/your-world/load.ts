/**
 * loadMemberWorld — the one read every VIVA tool uses for the member's facts.
 * Account (name, birthday, address) plus the roster row the active Your World
 * version is copied into.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { MemberRoster } from '@/lib/roster/types'
import type { MemberWorldFacts } from '@/lib/viva/prompts/shared/member-world'
import { buildMemberWorldBlock, buildMemberWorldVisionBlock } from '@/lib/viva/prompts/shared/member-world'

function ageFrom(dateOfBirth: string | null | undefined, now = new Date()): number | null {
  if (!dateOfBirth) return null
  const dob = new Date(`${dateOfBirth}T00:00:00`)
  if (Number.isNaN(dob.getTime())) return null
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1
  return age > 0 && age < 120 ? age : null
}

export interface MemberWorld extends MemberWorldFacts {
  lastName: string | null
  dateOfBirth: string | null
}

export async function loadMemberWorld(supabase: SupabaseClient, userId: string): Promise<MemberWorld> {
  const [{ data: account }, { data: roster }] = await Promise.all([
    supabase
      .from('user_accounts')
      .select('first_name, last_name, date_of_birth, shipping_city, shipping_state, shipping_country')
      .eq('id', userId)
      .maybeSingle(),
    supabase.from('member_roster').select('*').eq('user_id', userId).maybeSingle(),
  ])
  return {
    firstName: account?.first_name?.trim() || null,
    lastName: account?.last_name?.trim() || null,
    dateOfBirth: account?.date_of_birth || null,
    age: ageFrom(account?.date_of_birth),
    city: account?.shipping_city?.trim() || null,
    region: account?.shipping_state?.trim() || null,
    country: account?.shipping_country?.trim() || null,
    roster: (roster as MemberRoster | null) ?? null,
  }
}

/** Ready-to-insert block for tool prompts. Never throws. */
export async function loadMemberWorldBlock(supabase: SupabaseClient, userId: string): Promise<string> {
  try {
    return buildMemberWorldBlock(await loadMemberWorld(supabase, userId))
  } catch (err) {
    console.error('[member-world] load failed:', err)
    return ''
  }
}

/** Ready-to-insert block for Life Vision writers. Never throws. */
export async function loadMemberWorldVisionBlock(supabase: SupabaseClient, userId: string): Promise<string> {
  try {
    return buildMemberWorldVisionBlock(await loadMemberWorld(supabase, userId))
  } catch (err) {
    console.error('[member-world] load failed:', err)
    return ''
  }
}

/**
 * The member's world in the old user_profiles column names, for code that
 * was written against Profile. New code should use the block or the roster.
 */
export interface LegacyProfileShape {
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  gender: string | null
  ethnicity: string | null
  relationship_status: string | null
  relationship_length: string | null
  partner_name: string | null
  has_children: boolean
  number_of_children: number
  children: Array<{ first_name: string; birthday: string | null }>
  social_preference: string | null
  hobbies: string[]
  living_situation: string | null
  time_at_location: string | null
  city: string | null
  state: string | null
  country: string | null
  employment_type: string | null
  occupation: string | null
  company: string | null
  time_in_role: string | null
  education: string | null
  education_description: string | null
  currency: string | null
  household_income: string | null
  savings_retirement: string | null
  assets_equity: string | null
  consumer_debt: string | null
}

export function toLegacyProfile(world: MemberWorld): LegacyProfileShape {
  const r = world.roster
  const children = (r?.children || [])
    .filter((c) => c.name?.trim())
    .map((c) => ({ first_name: c.name!.trim(), birthday: c.birthday || null }))
  return {
    first_name: world.firstName,
    last_name: world.lastName,
    date_of_birth: world.dateOfBirth,
    gender: r?.gender ?? null,
    ethnicity: r?.ethnicity ?? null,
    relationship_status: r?.partner?.status ?? null,
    relationship_length: r?.partner?.length ?? null,
    partner_name: r?.partner?.name ?? null,
    has_children: children.length > 0,
    number_of_children: children.length,
    children,
    social_preference: r?.social_preference ?? null,
    hobbies: r?.hobbies || [],
    living_situation: r?.place?.living_situation ?? null,
    time_at_location: r?.place?.time_at_location ?? null,
    city: world.city || r?.place?.city || null,
    state: world.region || r?.place?.region || null,
    country: world.country,
    employment_type: r?.work?.employment_type ?? null,
    occupation: r?.work?.occupation ?? null,
    company: r?.work?.company ?? null,
    time_in_role: r?.work?.time_in_role ?? null,
    education: r?.work?.education ?? null,
    education_description: r?.work?.education_description ?? null,
    currency: r?.money?.currency ?? null,
    household_income: r?.money?.household_income ?? null,
    savings_retirement: r?.money?.savings_retirement ?? null,
    assets_equity: r?.money?.assets_equity ?? null,
    consumer_debt: r?.money?.consumer_debt ?? null,
  }
}

/**
 * For Profile-era code that also reads old essays (state_*, stories): the
 * member's last saved Profile row, if any, with Your World values on top.
 * Always returns an object so new members (no Profile) still get their facts.
 */
export async function loadProfileCompat(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<string, any>> {
  const [world, { data: legacyRow }] = await Promise.all([
    loadMemberWorld(supabase, userId),
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_draft', false)
      .order('is_active', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  const fromWorld = toLegacyProfile(world) as unknown as Record<string, unknown>
  const overlay: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fromWorld)) {
    if (value === null || value === undefined) continue
    if (Array.isArray(value) && value.length === 0) continue
    overlay[key] = value
  }
  return { ...(legacyRow || {}), ...overlay, user_id: userId }
}

export async function loadLegacyProfile(supabase: SupabaseClient, userId: string): Promise<LegacyProfileShape | null> {
  try {
    return toLegacyProfile(await loadMemberWorld(supabase, userId))
  } catch (err) {
    console.error('[member-world] legacy load failed:', err)
    return null
  }
}
