/**
 * Name pronunciation for audio.
 *
 * Members write how a name is said as hyphenated syllables with the stressed
 * one in capitals ("SEER-sha"). Text-to-speech has no phonetic markup, so
 * before any text is voiced each name is swapped for a respelling the voice
 * reads naturally. On-screen text always keeps the real spelling.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface SayAsEntry {
  name: string
  say_as: string
}

/** "seer - SHA" -> "seer-SHA" */
export function normalizeSayAs(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw
    .trim()
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

export function syllableCount(sayAs: string | null | undefined): number {
  const value = normalizeSayAs(sayAs)
  if (!value) return 0
  return value.split(/[-\s]+/).filter(Boolean).length
}

/**
 * Respelling handed to the voice. Syllables are joined into one word per
 * name part so the voice does not pause between them; the stressed syllable
 * keeps its capitals, which the voices lean on for emphasis.
 */
export function spokenForm(sayAs: string): string {
  return normalizeSayAs(sayAs)
    .split(' ')
    .map((part) => {
      const syllables = part.split('-').filter(Boolean)
      if (syllables.length <= 1) return part.toLowerCase()
      return syllables
        .map((s) => (s === s.toUpperCase() && /[A-Z]/.test(s) ? s.toUpperCase() : s.toLowerCase()))
        .join('')
    })
    .join(' ')
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Swaps every listed name for its spoken form. Longest names first. */
export function applySayAsEntries(text: string, entries: SayAsEntry[]): string {
  if (!text || entries.length === 0) return text
  const usable = entries
    .filter((e) => e.name.trim() && normalizeSayAs(e.say_as))
    .sort((a, b) => b.name.length - a.name.length)
  let out = text
  for (const entry of usable) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(entry.name.trim())}(?![\\p{L}\\p{N}])`, 'giu')
    out = out.replace(pattern, spokenForm(entry.say_as))
  }
  return out
}

interface NamedRow {
  name?: string
  say_as?: string
}

/** Every named person or pet with a pronunciation, plus the member. */
export async function loadSayAsEntries(supabase: SupabaseClient, userId: string): Promise<SayAsEntry[]> {
  const [{ data: roster }, { data: account }] = await Promise.all([
    supabase
      .from('member_roster')
      .select('say_as, partner, children, pets, people')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.from('user_accounts').select('first_name').eq('id', userId).maybeSingle(),
  ])
  if (!roster) return []

  const entries: SayAsEntry[] = []
  const push = (row: NamedRow | null | undefined) => {
    if (row?.name && row.say_as) entries.push({ name: row.name, say_as: row.say_as })
  }
  if (account?.first_name && roster.say_as) {
    entries.push({ name: account.first_name, say_as: roster.say_as })
  }
  push(roster.partner as NamedRow | null)
  for (const row of (roster.children as NamedRow[] | null) || []) push(row)
  for (const row of (roster.pets as NamedRow[] | null) || []) push(row)
  for (const row of (roster.people as NamedRow[] | null) || []) push(row)
  return entries
}

/** Text ready for the member's voice. Never throws; falls back to the text. */
export async function applySayAs(supabase: SupabaseClient, userId: string, text: string): Promise<string> {
  try {
    const entries = await loadSayAsEntries(supabase, userId)
    return applySayAsEntries(text, entries)
  } catch (err) {
    console.error('[say-as] load failed:', err)
    return text
  }
}

/** Names to hand the transcriber so it spells them the member's way. */
export async function loadNameHints(supabase: SupabaseClient, userId: string): Promise<string[]> {
  try {
    const [{ data: roster }, { data: account }] = await Promise.all([
      supabase.from('member_roster').select('partner, children, pets, people').eq('user_id', userId).maybeSingle(),
      supabase.from('user_accounts').select('first_name, last_name').eq('id', userId).maybeSingle(),
    ])
    const names = new Set<string>()
    const add = (n: unknown) => {
      if (typeof n === 'string' && n.trim()) names.add(n.trim())
    }
    add(account?.first_name)
    add(account?.last_name)
    add((roster?.partner as NamedRow | null)?.name)
    for (const key of ['children', 'pets', 'people'] as const) {
      for (const row of ((roster?.[key] as NamedRow[] | null) || [])) add(row.name)
    }
    return [...names].slice(0, 30)
  } catch {
    return []
  }
}
