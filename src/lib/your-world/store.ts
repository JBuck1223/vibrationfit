/**
 * Your World versions — works like Profile: draft, commit, switch active.
 *
 * The active version's snapshot is copied into member_roster and its address
 * into user_accounts, so readers never touch versions.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { loadRoster } from '@/lib/roster/store'
import type { MemberRoster } from '@/lib/roster/types'
import {
  accountWriteFromSnapshot,
  normalizeSnapshot,
  rosterWriteFromSnapshot,
  snapshotFromRoster,
  type AccountAddressRow,
} from './snapshot'
import type { WorldVersion, WorldVersionSource, YourWorldSnapshot, YourWorldState } from './types'

const TABLE = 'member_world_versions'

const ADDRESS_COLUMNS =
  'shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country'

async function loadAccountAddress(supabase: SupabaseClient, userId: string): Promise<AccountAddressRow | null> {
  const { data } = await supabase.from('user_accounts').select(ADDRESS_COLUMNS).eq('id', userId).maybeSingle()
  return (data as AccountAddressRow | null) ?? null
}

export async function listWorldVersions(supabase: SupabaseClient, userId: string): Promise<WorldVersion[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('version_number', { ascending: false })
  if (error) {
    console.error('[YourWorld] list error:', error)
    return []
  }
  return (data as WorldVersion[]) || []
}

export async function loadWorldState(supabase: SupabaseClient, userId: string): Promise<YourWorldState> {
  const [versions, roster, account] = await Promise.all([
    listWorldVersions(supabase, userId),
    loadRoster(supabase, userId),
    loadAccountAddress(supabase, userId),
  ])
  return {
    versions,
    active: versions.find((v) => v.is_active) ?? null,
    draft: versions.find((v) => v.is_draft) ?? null,
    seed: snapshotFromRoster(roster, account),
  }
}

async function nextVersionNumber(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data } = await supabase
    .from(TABLE)
    .select('version_number')
    .eq('user_id', userId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  return ((data?.version_number as number | undefined) ?? 0) + 1
}

/** Copies a snapshot into member_roster and user_accounts. */
export async function syncSnapshotToMember(
  supabase: SupabaseClient,
  userId: string,
  snapshot: YourWorldSnapshot,
): Promise<void> {
  const existing = await loadRoster(supabase, userId)
  const [{ error: rosterError }, { error: accountError }] = await Promise.all([
    supabase
      .from('member_roster')
      .upsert({ user_id: userId, ...rosterWriteFromSnapshot(snapshot, existing) }, { onConflict: 'user_id' }),
    supabase.from('user_accounts').update(accountWriteFromSnapshot(snapshot)).eq('id', userId),
  ])
  if (rosterError) console.error('[YourWorld] roster sync error:', rosterError)
  if (accountError) console.error('[YourWorld] account sync error:', accountError)
}

async function clearActive(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from(TABLE)
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)
  if (error) throw error
}

/** Saves a committed version and makes it active (Getting Started, VIVA). */
export async function commitNewVersion(
  supabase: SupabaseClient,
  userId: string,
  input: YourWorldSnapshot,
  opts: { source: WorldVersionSource; notes?: string | null },
): Promise<WorldVersion> {
  const snapshot = normalizeSnapshot(input)
  const active = (await listWorldVersions(supabase, userId)).find((v) => v.is_active) ?? null
  const versionNumber = await nextVersionNumber(supabase, userId)
  await clearActive(supabase, userId)
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      version_number: versionNumber,
      is_active: true,
      is_draft: false,
      parent_id: active?.id ?? null,
      snapshot,
      version_notes: opts.notes ?? null,
      source: opts.source,
      committed_at: now,
    })
    .select('*')
    .single()
  if (error) throw error
  await syncSnapshotToMember(supabase, userId, snapshot)
  return data as WorldVersion
}

/** Returns the existing draft, or opens one from the active version. */
export async function createDraftFromActive(supabase: SupabaseClient, userId: string): Promise<WorldVersion> {
  const state = await loadWorldState(supabase, userId)
  if (state.draft) return state.draft
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      version_number: await nextVersionNumber(supabase, userId),
      is_draft: true,
      is_active: false,
      parent_id: state.active?.id ?? null,
      snapshot: state.active?.snapshot ?? state.seed,
      source: 'member',
    })
    .select('*')
    .single()
  if (error) throw error
  return data as WorldVersion
}

export async function updateDraft(
  supabase: SupabaseClient,
  userId: string,
  draftId: string,
  snapshot: YourWorldSnapshot,
): Promise<WorldVersion> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ snapshot: normalizeSnapshot(snapshot) })
    .eq('id', draftId)
    .eq('user_id', userId)
    .eq('is_draft', true)
    .select('*')
    .single()
  if (error) throw error
  return data as WorldVersion
}

export async function discardDraft(supabase: SupabaseClient, userId: string, draftId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', draftId).eq('user_id', userId).eq('is_draft', true)
  if (error) throw error
}

export async function commitDraft(
  supabase: SupabaseClient,
  userId: string,
  draftId: string,
  notes?: string | null,
): Promise<WorldVersion> {
  await clearActive(supabase, userId)
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      is_draft: false,
      is_active: true,
      committed_at: new Date().toISOString(),
      version_notes: notes ?? null,
    })
    .eq('id', draftId)
    .eq('user_id', userId)
    .eq('is_draft', true)
    .select('*')
    .single()
  if (error) throw error
  const version = data as WorldVersion
  await syncSnapshotToMember(supabase, userId, normalizeSnapshot(version.snapshot))
  return version
}

export async function setActiveVersion(
  supabase: SupabaseClient,
  userId: string,
  versionId: string,
): Promise<WorldVersion> {
  const { data: target, error: findError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', versionId)
    .eq('user_id', userId)
    .eq('is_draft', false)
    .single()
  if (findError || !target) throw findError || new Error('Version not found')
  await clearActive(supabase, userId)
  const { data, error } = await supabase
    .from(TABLE)
    .update({ is_active: true })
    .eq('id', versionId)
    .select('*')
    .single()
  if (error) throw error
  await syncSnapshotToMember(supabase, userId, normalizeSnapshot((target as WorldVersion).snapshot))
  return data as WorldVersion
}

// ---------------------------------------------------------------------------
// Roster -> active version
// ---------------------------------------------------------------------------

const blank = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

function fillBlanks<T extends object>(base: T, extra: T): T {
  const out = { ...base } as Record<string, unknown>
  for (const [k, v] of Object.entries(extra)) {
    if (blank(out[k]) && !blank(v)) out[k] = v
  }
  return out as unknown as T
}

function mergeNamed<T extends { name?: string }>(base: T[], extra: T[]): T[] {
  const key = (r: T) => (r.name || '').trim().toLowerCase()
  const out = base.map((row) => {
    const match = extra.find((e) => key(e) === key(row))
    return match ? fillBlanks(row, match) : row
  })
  for (const row of extra) {
    if (key(row) && !out.some((r) => key(r) === key(row))) out.push(row)
  }
  return out
}

/** Active snapshot with anything new in the roster filled into its blanks. */
function snapshotWithRosterBlanks(active: YourWorldSnapshot, roster: MemberRoster | null): YourWorldSnapshot {
  const fromRoster = snapshotFromRoster(roster, null)
  const base = normalizeSnapshot(active)
  return normalizeSnapshot({
    ...fillBlanks(base, fromRoster),
    partner: fillBlanks(base.partner, fromRoster.partner),
    children: mergeNamed(base.children, fromRoster.children),
    pets: mergeNamed(base.pets, fromRoster.pets),
    hobbies: base.hobbies.length ? base.hobbies : fromRoster.hobbies,
    address: fillBlanks(base.address, { city: fromRoster.address.city, region: fromRoster.address.region }),
    work: fillBlanks(base.work, fromRoster.work),
    money: base.money,
  })
}

/**
 * After the background extractor writes to the roster: fill blanks on the
 * active version in place. No new version; nothing the member entered changes.
 */
export async function amendActiveWorldFromRoster(supabase: SupabaseClient, userId: string): Promise<void> {
  try {
    const { data: active } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()
    if (!active) return
    const roster = await loadRoster(supabase, userId)
    const next = snapshotWithRosterBlanks((active as WorldVersion).snapshot, roster)
    if (JSON.stringify(next) === JSON.stringify(normalizeSnapshot((active as WorldVersion).snapshot))) return
    await supabase.from(TABLE).update({ snapshot: next }).eq('id', (active as WorldVersion).id)
  } catch (err) {
    console.error('[YourWorld] amend from roster failed:', err)
  }
}

/**
 * The member accepted VIVA's confirm card. Their edits replaced roster
 * sections, so those win over the active version; the result is committed.
 */
export async function commitVersionFromRoster(supabase: SupabaseClient, userId: string): Promise<void> {
  try {
    const [versions, roster, account] = await Promise.all([
      listWorldVersions(supabase, userId),
      loadRoster(supabase, userId),
      loadAccountAddress(supabase, userId),
    ])
    const active = versions.find((v) => v.is_active)
    const fromRoster = snapshotFromRoster(roster, account)
    const base = active ? normalizeSnapshot(active.snapshot) : fromRoster
    const next = normalizeSnapshot({
      ...base,
      partner: { ...base.partner, ...fromRoster.partner },
      children: fromRoster.children,
      pets: fromRoster.pets,
      address: { ...base.address, city: fromRoster.address.city, region: fromRoster.address.region },
    })
    await commitNewVersion(supabase, userId, next, {
      source: 'viva',
      notes: 'Updated from a conversation with VIVA.',
    })
  } catch (err) {
    console.error('[YourWorld] commit from roster failed:', err)
  }
}
