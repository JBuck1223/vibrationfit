/**
 * First-vision Draft Session — contrast + clarity notes gathered before VIVA
 * composes the Life Vision. Does not write vision_versions category text.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  LIFE_CATEGORY_KEYS,
  getVisionCategoryLabel,
  isLifeCategoryKey,
  type LifeCategoryKey,
} from '@/lib/design-system/vision-categories'
import type { LifeActivationSeed } from '@/lib/life-activation/types'
import type { VisionData } from '@/lib/life-vision/draft-helpers'
import { getVisionCategoryText } from '@/lib/life-vision/draft-helpers'

export type DraftSessionStatus = 'gathering' | 'composed'
export type NotePolarity = 'contrast' | 'clarity'
export type NoteSource = 'activation' | 'viva'

export interface DraftSessionRow {
  id: string
  user_id: string
  draft_id: string
  status: DraftSessionStatus
  created_at: string
  updated_at: string
}

export interface DraftSessionNote {
  id: string
  session_id: string
  category: string
  polarity: NotePolarity
  text: string
  source: NoteSource
  created_at: string
}

export interface DraftSessionPayload extends DraftSessionRow {
  notes: DraftSessionNote[]
}

export interface CategoryCoverage {
  category: LifeCategoryKey
  contrast: string[]
  clarity: string[]
}

const DREAM_KEYS = ['want', 'why', 'feel', 'become'] as const

export function normalizeNoteText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim()
}

export function draftHasAnyVisionText(draft: VisionData): boolean {
  const keys = [...LIFE_CATEGORY_KEYS, 'forward', 'conclusion'] as const
  return keys.some((key) => getVisionCategoryText(draft, key).trim())
}

export function notesFromActivationSeed(seed: LifeActivationSeed): Array<{
  category: LifeCategoryKey
  polarity: NotePolarity
  text: string
  source: NoteSource
}> {
  if (!seed.category || !isLifeCategoryKey(seed.category)) return []
  const category = seed.category
  const notes: Array<{
    category: LifeCategoryKey
    polarity: NotePolarity
    text: string
    source: NoteSource
  }> = []

  const contrast = seed.currentState?.trim()
  if (contrast) {
    notes.push({ category, polarity: 'contrast', text: contrast, source: 'activation' })
  }

  const dreamParts: string[] = []
  const dream = seed.dreamResponse
  if (dream) {
    for (const key of DREAM_KEYS) {
      const value = dream[key]?.trim()
      if (value) dreamParts.push(value)
    }
  }
  if (dreamParts.length > 0) {
    notes.push({
      category,
      polarity: 'clarity',
      text: dreamParts.join('\n\n'),
      source: 'activation',
    })
  }

  const vision = seed.visionStatement?.trim()
  if (vision) {
    notes.push({ category, polarity: 'clarity', text: vision, source: 'activation' })
  }

  return notes
}

export function groupNotesByCategory(notes: DraftSessionNote[]): CategoryCoverage[] {
  const map = new Map<LifeCategoryKey, { contrast: string[]; clarity: string[] }>()
  for (const key of LIFE_CATEGORY_KEYS) {
    map.set(key, { contrast: [], clarity: [] })
  }
  for (const note of notes) {
    if (!isLifeCategoryKey(note.category)) continue
    const bucket = map.get(note.category)
    if (!bucket) continue
    const text = note.text.trim()
    if (!text) continue
    if (note.polarity === 'contrast') bucket.contrast.push(text)
    else bucket.clarity.push(text)
  }
  return LIFE_CATEGORY_KEYS.map((category) => {
    const bucket = map.get(category) || { contrast: [], clarity: [] }
    return { category, contrast: bucket.contrast, clarity: bucket.clarity }
  })
}

export function formatSessionNotesForPrompt(notes: DraftSessionNote[]): string {
  const grouped = groupNotesByCategory(notes)
  const withNotes = grouped.filter((g) => g.contrast.length > 0 || g.clarity.length > 0)
  const empty = grouped.filter((g) => g.contrast.length === 0 && g.clarity.length === 0)
  const missingContrast = grouped.filter((g) => g.contrast.length === 0).map((g) => g.category)
  const missingClarity = grouped.filter((g) => g.clarity.length === 0).map((g) => g.category)

  const coverage = [
    `Coverage: ${withNotes.length} of 12 life categories have notes.`,
    empty.length ? `Empty (no notes yet): ${empty.map((g) => g.category).join(', ')}` : 'Every category has at least one note.',
    `Still missing contrast: ${missingContrast.length ? missingContrast.join(', ') : 'none'}`,
    `Still missing clarity: ${missingClarity.length ? missingClarity.join(', ') : 'none'}`,
  ].join('\n')

  const sections = grouped.map((g) => {
    const label = getVisionCategoryLabel(g.category)
    const contrast = g.contrast.length
      ? g.contrast.map((t) => `- ${t}`).join('\n')
      : '- (none yet)'
    const clarity = g.clarity.length
      ? g.clarity.map((t) => `- ${t}`).join('\n')
      : '- (none yet)'
    return `### ${g.category} (${label})\nContrast (below the Green Line):\n${contrast}\nClarity (above the Green Line):\n${clarity}`
  }).join('\n\n')

  return `${coverage}\n\n${sections}`
}

async function loadNotes(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<DraftSessionNote[]> {
  const { data } = await supabase
    .from('vision_draft_session_notes')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  return (data || []) as DraftSessionNote[]
}

export async function loadDraftSession(
  supabase: SupabaseClient,
  draftId: string,
): Promise<DraftSessionPayload | null> {
  const { data: session } = await supabase
    .from('vision_draft_sessions')
    .select('*')
    .eq('draft_id', draftId)
    .maybeSingle()
  if (!session) return null
  const notes = await loadNotes(supabase, session.id)
  return { ...(session as DraftSessionRow), notes }
}

export async function ensureDraftSession(
  supabase: SupabaseClient,
  userId: string,
  draftId: string,
  opts?: {
    seed?: LifeActivationSeed | null
    draftHasText?: boolean
  },
): Promise<DraftSessionPayload> {
  const existing = await loadDraftSession(supabase, draftId)
  if (existing) return existing

  const status: DraftSessionStatus = opts?.draftHasText ? 'composed' : 'gathering'
  const { data: session, error } = await supabase
    .from('vision_draft_sessions')
    .insert({
      user_id: userId,
      draft_id: draftId,
      status,
    })
    .select('*')
    .single()

  if (error || !session) {
    throw new Error(error?.message || 'Failed to start draft session')
  }

  if (!opts?.draftHasText && opts?.seed) {
    const seedNotes = notesFromActivationSeed(opts.seed)
    if (seedNotes.length > 0) {
      const { error: noteError } = await supabase
        .from('vision_draft_session_notes')
        .insert(seedNotes.map((note) => ({ ...note, session_id: session.id })))
      if (noteError) {
        console.error('[draft-session] Failed to seed activation notes', noteError)
      }
    }
  }

  const notes = await loadNotes(supabase, session.id)
  return { ...(session as DraftSessionRow), notes }
}

export async function persistVivaSeeds(
  supabase: SupabaseClient,
  sessionId: string,
  seeds: Array<{ category: string; polarity: NotePolarity; text: string; complete?: boolean }>,
): Promise<void> {
  const complete = seeds.filter((s) => s.complete !== false && s.text.trim() && isLifeCategoryKey(s.category))
  if (complete.length === 0) return

  const { data: existing } = await supabase
    .from('vision_draft_session_notes')
    .select('category, polarity, text')
    .eq('session_id', sessionId)

  const seen = new Set(
    (existing || []).map(
      (n) => `${n.category}|${n.polarity}|${normalizeNoteText(n.text)}`,
    ),
  )

  const rows: Array<{
    session_id: string
    category: string
    polarity: NotePolarity
    text: string
    source: NoteSource
  }> = []

  for (const seed of complete) {
    const text = seed.text.trim()
    const key = `${seed.category}|${seed.polarity}|${normalizeNoteText(text)}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({
      session_id: sessionId,
      category: seed.category,
      polarity: seed.polarity,
      text,
      source: 'viva',
    })
  }

  if (rows.length === 0) return
  const { error } = await supabase.from('vision_draft_session_notes').insert(rows)
  if (error) console.error('[draft-session] Failed to persist seeds', error)
}

export async function markDraftSessionComposed(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<void> {
  const { error } = await supabase
    .from('vision_draft_sessions')
    .update({ status: 'composed' })
    .eq('id', sessionId)
    .eq('status', 'gathering')
  if (error) console.error('[draft-session] Failed to mark composed', error)
}
