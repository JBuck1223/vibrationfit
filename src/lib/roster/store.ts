/**
 * Load / merge / save for member_roster and member_persona.
 *
 * Merge principle: NON-DESTRUCTIVE. Extraction never blanks a confirmed or
 * existing value — objects merge field-by-field (empty incoming values are
 * ignored), arrays match entries by identity and enrich them, new entries
 * append. The member's confirm-card edits are the only destructive writes,
 * and those replace whole sections deliberately.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  MemberPersona,
  MemberRoster,
  PersonaItem,
  PersonaUpdate,
  RosterUpdate,
} from './types'

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

export async function loadRoster(
  supabase: SupabaseClient,
  userId: string,
): Promise<MemberRoster | null> {
  const { data, error } = await supabase
    .from('member_roster')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('[Roster] load error:', error)
    return null
  }
  return (data as MemberRoster) || null
}

export async function loadPersona(
  supabase: SupabaseClient,
  userId: string,
): Promise<MemberPersona | null> {
  const { data, error } = await supabase
    .from('member_persona')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('[Persona] load error:', error)
    return null
  }
  return (data as MemberPersona) || null
}

// ---------------------------------------------------------------------------
// Merge helpers
// ---------------------------------------------------------------------------

type Loose = Record<string, unknown>

const isBlank = (v: unknown) =>
  v === undefined || v === null || (typeof v === 'string' && !v.trim())

/** Field-by-field object merge; incoming blanks never erase existing values. */
function mergeObject<T extends object>(existing: T | null | undefined, incoming: T | null | undefined): T | null {
  if (!incoming) return existing ?? null
  const out: Loose = { ...(existing || {}) }
  for (const [key, value] of Object.entries(incoming)) {
    if (!isBlank(value)) out[key] = value
  }
  return Object.keys(out).length > 0 ? (out as T) : null
}

const normKey = (v: unknown) =>
  String(v ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/**
 * Merge arrays of entity objects (children, pets, people, ...). Entries match
 * on the identity field(s); matches merge field-by-field, new entries append.
 */
function mergeEntityArray<T extends object>(
  existing: T[] | null | undefined,
  incoming: T[] | null | undefined,
  identity: (item: T) => string,
): T[] {
  const out: T[] = [...(existing || [])]
  for (const item of incoming || []) {
    const key = identity(item)
    if (!key) continue
    const matchIdx = out.findIndex((e) => identity(e) === key)
    if (matchIdx >= 0) {
      out[matchIdx] = mergeObject(out[matchIdx], item) as T
    } else {
      out.push(item)
    }
  }
  return out
}

export function mergeRoster(
  existing: MemberRoster | null,
  update: RosterUpdate,
): RosterUpdate {
  return {
    partner: mergeObject(existing?.partner, update.partner ?? null),
    place: mergeObject(existing?.place, update.place ?? null),
    children: mergeEntityArray(existing?.children, update.children, (c) => normKey(c.name)),
    pets: mergeEntityArray(existing?.pets, update.pets, (p) => normKey(p.name)),
    people: mergeEntityArray(existing?.people, update.people, (p) => normKey(p.name)),
    named_things: mergeEntityArray(existing?.named_things, update.named_things, (n) => normKey(n.name)),
    tender_ground: mergeEntityArray(existing?.tender_ground, update.tender_ground, (t) => normKey(t.who)),
    days_that_matter: mergeEntityArray(
      existing?.days_that_matter,
      update.days_that_matter,
      (d) => `${normKey(d.what)}|${normKey(d.date)}`,
    ),
    vocation: isBlank(update.vocation) ? existing?.vocation ?? null : update.vocation,
    pronouns: isBlank(update.pronouns) ? existing?.pronouns ?? null : update.pronouns,
  }
}

/** Word-overlap similarity — same approach as the memory extractor. */
function valueSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3))
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3))
  if (wordsA.size === 0 || wordsB.size === 0) {
    return normKey(a) === normKey(b) && normKey(a) ? 1 : 0
  }
  let overlap = 0
  for (const word of wordsA) if (wordsB.has(word)) overlap++
  return overlap / Math.max(wordsA.size, wordsB.size)
}

function mergePersonaItem(existing: PersonaItem, incoming: PersonaItem): PersonaItem {
  const stated = existing.source === 'stated' || incoming.source === 'stated'
  const evidence = [...new Set([...(existing.evidence || []), ...(incoming.evidence || [])])]
  return {
    // A stated value wins over an inferred one; otherwise keep the newer phrasing.
    value:
      existing.source === 'stated' && incoming.source !== 'stated'
        ? existing.value
        : incoming.value,
    source: stated ? 'stated' : 'inferred',
    ...(evidence.length > 0 ? { evidence } : {}),
  }
}

function mergePersonaArray(
  existing: PersonaItem[] | undefined,
  incoming: PersonaItem[] | undefined,
): PersonaItem[] | undefined {
  if (!incoming || incoming.length === 0) return existing
  const out: PersonaItem[] = [...(existing || [])]
  for (const item of incoming) {
    if (!item?.value?.trim()) continue
    const matchIdx = out.findIndex((e) => valueSimilarity(e.value, item.value) > 0.6)
    if (matchIdx >= 0) {
      out[matchIdx] = mergePersonaItem(out[matchIdx], item)
    } else {
      out.push(item)
    }
  }
  return out
}

function mergePersonaScalar(
  existing: PersonaItem | undefined,
  incoming: PersonaItem | undefined,
): PersonaItem | undefined {
  if (!incoming?.value?.trim()) return existing
  if (!existing) return incoming
  // stated replaces anything; inferred never displaces stated
  if (incoming.source === 'stated') return mergePersonaItem(existing, incoming)
  if (existing.source === 'stated') return existing
  return mergePersonaItem(existing, incoming)
}

function mergePersonaSection<T extends object>(
  existing: T | undefined,
  incoming: T | undefined,
): T {
  const out: Loose = { ...(existing || {}) }
  for (const [key, value] of Object.entries(incoming || {})) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      const merged = mergePersonaArray(out[key] as PersonaItem[] | undefined, value as PersonaItem[])
      if (merged) out[key] = merged
    } else {
      const merged = mergePersonaScalar(out[key] as PersonaItem | undefined, value as PersonaItem)
      if (merged) out[key] = merged
    }
  }
  return out as T
}

export function mergePersona(
  existing: MemberPersona | null,
  update: PersonaUpdate,
): PersonaUpdate {
  return {
    self: mergePersonaSection(existing?.self, update.self),
    season: mergePersonaSection(existing?.season, update.season),
    desire: mergePersonaSection(existing?.desire, update.desire),
    relating: mergePersonaSection(existing?.relating, update.relating),
  }
}

// ---------------------------------------------------------------------------
// Save (load -> merge -> upsert)
// ---------------------------------------------------------------------------

export async function saveRosterUpdate(
  supabase: SupabaseClient,
  userId: string,
  update: RosterUpdate,
): Promise<void> {
  const existing = await loadRoster(supabase, userId)
  const merged = mergeRoster(existing, update)
  const { error } = await supabase
    .from('member_roster')
    .upsert({ user_id: userId, ...merged }, { onConflict: 'user_id' })
  if (error) console.error('[Roster] save error:', error)
}

export async function savePersonaUpdate(
  supabase: SupabaseClient,
  userId: string,
  update: PersonaUpdate,
): Promise<void> {
  const existing = await loadPersona(supabase, userId)
  const merged = mergePersona(existing, update)
  const { error } = await supabase
    .from('member_persona')
    .upsert({ user_id: userId, ...merged }, { onConflict: 'user_id' })
  if (error) console.error('[Persona] save error:', error)
}
