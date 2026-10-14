/**
 * First-vision Draft Session — what VIVA gathers before the Life Vision is
 * composed. Does not write vision_versions category text.
 *
 * Two kinds of notes live here:
 * - VIVA / activation labels (`text`): short paraphrases, the coverage map.
 * - Member passages (`member_text`, source 'member' or activation): the
 *   member's own words, verbatim. These are what the depth gate measures and
 *   what the compose pass expands. Length comes from here, never from labels.
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
/** chat = VIVA-led conversation; scratch = member writes two beats per area. */
export type DraftSessionMode = 'chat' | 'scratch'
export type NotePolarity = 'contrast' | 'clarity' | 'unknown'
export type NoteSource = 'activation' | 'viva' | 'member'
export type AreaBeat = 'now' | 'dream'

export interface DraftSessionRow {
  id: string
  user_id: string
  draft_id: string
  status: DraftSessionStatus
  mode: DraftSessionMode
  created_at: string
  updated_at: string
}

export interface DraftSessionNote {
  id: string
  session_id: string
  category: string
  polarity: NotePolarity
  /** Short label (VIVA paraphrase, or first words of a member passage). */
  text: string
  /** The member's verbatim words. Null for VIVA labels. */
  member_text?: string | null
  source: NoteSource
  created_at: string
}

export interface DraftSessionCategoryText {
  id: string
  session_id: string
  category: string
  starter_text: string | null
  imagination_text: string | null
  vision_text: string | null
  /** Scratch flow: the member's raw beats, verbatim. */
  now_text?: string | null
  dream_text?: string | null
  now_at?: string | null
  dream_at?: string | null
  /** Set when they marked the area "I don't know yet". */
  unknown_at?: string | null
  created_at: string
  updated_at: string
}

export interface DraftSessionPayload extends DraftSessionRow {
  notes: DraftSessionNote[]
  categoryText: DraftSessionCategoryText[]
}

export type DepthStatus = 'cleared' | 'thin' | 'empty' | 'unknown'

export interface CategoryCoverage {
  category: LifeCategoryKey
  /** VIVA / activation labels. */
  contrast: string[]
  clarity: string[]
  /** Member's verbatim passages. */
  memberContrast: string[]
  memberClarity: string[]
  memberUnknown: string[]
  memberWords: number
  hasScene: boolean
  /** Scratch flow beats (verbatim). Empty strings when not written. */
  nowText: string
  dreamText: string
  nowDone: boolean
  dreamDone: boolean
  /** Marked "I don't know yet" in the scratch flow. */
  unknownYet: boolean
  depth: DepthStatus
}

/** Member words in a category before it is cleared to write. */
export const DEPTH_CLEAR_WORDS = 120

const DREAM_KEYS = ['want', 'why', 'feel', 'become'] as const

export function normalizeNoteText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim()
}

export function countWords(text: string): number {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

export function draftHasAnyVisionText(draft: VisionData): boolean {
  const keys = [...LIFE_CATEGORY_KEYS, 'forward', 'conclusion'] as const
  return keys.some((key) => getVisionCategoryText(draft, key).trim())
}

const SCENE_WORDS =
  /\b(morning|mornings|evening|evenings|night|nights|weekend|weekends|dinner|breakfast|lunch|coffee|patio|kitchen|backyard|porch|couch|bed|monday|tuesday|wednesday|thursday|friday|saturday|sunday|every day|everyday|each day|after work|before work|on the way|at home|at work|at the)\b/i

/** Cheap floor: a passage has a scene if it names a place, time, person, or number. */
export function passageHasScene(text: string): boolean {
  if (SCENE_WORDS.test(text)) return true
  if (/\d/.test(text)) return true
  // Proper noun not at sentence start.
  return /(?:[^.!?\n]\s)([A-Z][a-z]{2,})/.test(text)
}

export function notesFromActivationSeed(seed: LifeActivationSeed): Array<{
  category: LifeCategoryKey
  polarity: NotePolarity
  text: string
  member_text: string | null
  source: NoteSource
}> {
  if (!seed.category || !isLifeCategoryKey(seed.category)) return []
  const category = seed.category
  const notes: Array<{
    category: LifeCategoryKey
    polarity: NotePolarity
    text: string
    member_text: string | null
    source: NoteSource
  }> = []

  // Activation text is member-written: it counts as their words.
  const contrast = seed.currentState?.trim()
  if (contrast) {
    notes.push({ category, polarity: 'contrast', text: contrast, member_text: contrast, source: 'activation' })
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
    const joined = dreamParts.join('\n\n')
    notes.push({ category, polarity: 'clarity', text: joined, member_text: joined, source: 'activation' })
  }

  const vision = seed.visionStatement?.trim()
  if (vision) {
    notes.push({ category, polarity: 'clarity', text: vision, member_text: vision, source: 'activation' })
  }

  return notes
}

type CoverageBucket = Omit<CategoryCoverage, 'category' | 'depth'>

function depthFor(bucket: CoverageBucket): DepthStatus {
  const hasBeats = bucket.nowDone || bucket.dreamDone
  if (bucket.unknownYet && !hasBeats) return 'unknown'
  if (hasBeats) {
    // Scratch flow: the two beats are the structure. Both must be written;
    // the floor is words, not a scene heuristic, so nobody dead-ends.
    if (bucket.nowDone && bucket.dreamDone && bucket.memberWords >= DEPTH_CLEAR_WORDS) return 'cleared'
    return 'thin'
  }
  if (bucket.memberWords >= DEPTH_CLEAR_WORDS && bucket.hasScene) return 'cleared'
  // "I don't know yet" clears an area only when they have not also described it.
  if (bucket.memberUnknown.length > 0 && bucket.memberWords < DEPTH_CLEAR_WORDS / 3) return 'unknown'
  if (bucket.memberWords === 0 && bucket.contrast.length === 0 && bucket.clarity.length === 0) return 'empty'
  return 'thin'
}

function normForContain(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/**
 * Group everything the session holds per life area. `categoryText` carries
 * the scratch-flow beats; tagged passages already contained in a beat are not
 * double counted.
 */
export function groupNotesByCategory(
  notes: DraftSessionNote[],
  categoryText: DraftSessionCategoryText[] = [],
): CategoryCoverage[] {
  const map = new Map<LifeCategoryKey, CoverageBucket>()
  for (const key of LIFE_CATEGORY_KEYS) {
    map.set(key, {
      contrast: [],
      clarity: [],
      memberContrast: [],
      memberClarity: [],
      memberUnknown: [],
      memberWords: 0,
      hasScene: false,
      nowText: '',
      dreamText: '',
      nowDone: false,
      dreamDone: false,
      unknownYet: false,
    })
  }

  for (const row of categoryText) {
    if (!isLifeCategoryKey(row.category)) continue
    const bucket = map.get(row.category)
    if (!bucket) continue
    const now = (row.now_text || '').trim()
    const dream = (row.dream_text || '').trim()
    bucket.nowText = now
    bucket.dreamText = dream
    bucket.nowDone = now.length > 0
    bucket.dreamDone = dream.length > 0
    bucket.unknownYet = !!row.unknown_at
    for (const beat of [now, dream]) {
      if (!beat) continue
      bucket.memberWords += countWords(beat)
      if (!bucket.hasScene && passageHasScene(beat)) bucket.hasScene = true
    }
  }

  for (const note of notes) {
    if (!isLifeCategoryKey(note.category)) continue
    const bucket = map.get(note.category)
    if (!bucket) continue
    const member = (note.member_text || '').trim()
    if (member) {
      if (note.polarity === 'contrast') bucket.memberContrast.push(member)
      else if (note.polarity === 'clarity') bucket.memberClarity.push(member)
      else bucket.memberUnknown.push(member)
      if (note.polarity !== 'unknown') {
        const beats = normForContain(`${bucket.nowText}\n${bucket.dreamText}`)
        const contained = beats.length > 0 && beats.includes(normForContain(member))
        if (!contained) {
          bucket.memberWords += countWords(member)
          if (!bucket.hasScene && passageHasScene(member)) bucket.hasScene = true
        }
      }
      continue
    }
    const text = note.text.trim()
    if (!text) continue
    if (note.polarity === 'contrast') bucket.contrast.push(text)
    else if (note.polarity === 'clarity') bucket.clarity.push(text)
    else bucket.memberUnknown.push(text)
  }
  return LIFE_CATEGORY_KEYS.map((category) => {
    const bucket = map.get(category)!
    return { category, ...bucket, depth: depthFor(bucket) }
  })
}

export interface DepthSummary {
  cleared: LifeCategoryKey[]
  thin: LifeCategoryKey[]
  empty: LifeCategoryKey[]
  unknown: LifeCategoryKey[]
  /** True when every category is cleared or explicitly unknown. */
  readyToCompose: boolean
  totalMemberWords: number
}

export function computeDepth(
  notes: DraftSessionNote[],
  categoryText: DraftSessionCategoryText[] = [],
): DepthSummary {
  const grouped = groupNotesByCategory(notes, categoryText)
  const pick = (d: DepthStatus) => grouped.filter((g) => g.depth === d).map((g) => g.category)
  const cleared = pick('cleared')
  const unknown = pick('unknown')
  return {
    cleared,
    thin: pick('thin'),
    empty: pick('empty'),
    unknown,
    readyToCompose: cleared.length + unknown.length === LIFE_CATEGORY_KEYS.length,
    totalMemberWords: grouped.reduce((sum, g) => sum + g.memberWords, 0),
  }
}

/** Depth map + the member's passages, formatted for the create prompt. */
export function formatSessionNotesForPrompt(
  notes: DraftSessionNote[],
  categoryText: DraftSessionCategoryText[] = [],
): string {
  const grouped = groupNotesByCategory(notes, categoryText)
  const depth = computeDepth(notes, categoryText)

  const line = (label: string, keys: LifeCategoryKey[]) =>
    `${label}: ${keys.length ? keys.join(', ') : 'none'}`

  const header = [
    `Depth gate: a category is CLEARED at ${DEPTH_CLEAR_WORDS}+ of the member's own words with a real scene in them, or when they say they do not know yet. Only member words count. Your labels do not.`,
    `${depth.cleared.length} of 12 cleared. ${depth.readyToCompose ? 'READY — you may offer to write.' : 'NOT READY — keep asking.'}`,
    line('Cleared', depth.cleared),
    line('Thin (has something, needs a scene)', depth.thin),
    line('Empty (nothing yet)', depth.empty),
    line('Unknown yet (they said so — leave blank)', depth.unknown),
  ].join('\n')

  const sections = grouped
    .map((g) => {
      const label = getVisionCategoryLabel(g.category)
      const list = (items: string[]) => (items.length ? items.map((t) => `- ${t}`).join('\n') : '- (none yet)')
      const quote = (items: string[]) => (items.length ? items.map((t) => `> ${t}`).join('\n') : '> (none yet)')
      const beats = g.nowDone || g.dreamDone || g.unknownYet
        ? [
            ...(g.nowDone ? [`What's going on now (their words):\n> ${g.nowText}`] : []),
            ...(g.dreamDone ? [`Unleash your imagination (their words):\n> ${g.dreamText}`] : []),
            ...(g.unknownYet ? ['They marked this area: I don\'t know yet.'] : []),
          ]
        : []
      return [
        `### ${g.category} (${label}) — ${g.depth.toUpperCase()}, ${g.memberWords} member words${g.hasScene ? ', scene present' : ', no scene yet'}`,
        ...beats,
        `Their words, contrast:\n${quote(g.memberContrast)}`,
        `Their words, clarity:\n${quote(g.memberClarity)}`,
        ...(g.memberUnknown.length ? [`They do not know yet:\n${quote(g.memberUnknown)}`] : []),
        `Your labels:\n${list([...g.contrast.map((t) => `[contrast] ${t}`), ...g.clarity.map((t) => `[clarity] ${t}`)])}`,
      ].join('\n')
    })
    .join('\n\n')

  return `${header}\n\n${sections}`
}

/**
 * The member's Start From Scratch beats, per area, for a prompt that edits
 * the draft those beats produced. Empty string when none were written.
 */
export function formatScratchBeatsForPrompt(categoryText: DraftSessionCategoryText[]): string {
  const sections: string[] = []
  for (const key of LIFE_CATEGORY_KEYS) {
    const row = categoryText.find((c) => c.category === key)
    if (!row) continue
    const now = (row.now_text || '').trim()
    const dream = (row.dream_text || '').trim()
    if (!now && !dream && !row.unknown_at) continue
    sections.push([
      `### ${key} (${getVisionCategoryLabel(key)})`,
      ...(now ? [`What's going on now (their words):\n> ${now}`] : []),
      ...(dream ? [`Unleash your imagination (their words):\n> ${dream}`] : []),
      ...(!now && !dream && row.unknown_at ? ['They marked this area: I don\'t know yet.'] : []),
    ].join('\n'))
  }
  return sections.join('\n\n')
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

async function loadCategoryText(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<DraftSessionCategoryText[]> {
  const { data } = await supabase
    .from('vision_draft_session_category_text')
    .select('*')
    .eq('session_id', sessionId)
  return (data || []) as DraftSessionCategoryText[]
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
  const [notes, categoryText] = await Promise.all([
    loadNotes(supabase, session.id),
    loadCategoryText(supabase, session.id),
  ])
  return { ...(session as DraftSessionRow), notes, categoryText }
}

export async function ensureDraftSession(
  supabase: SupabaseClient,
  userId: string,
  draftId: string,
  opts?: {
    seed?: LifeActivationSeed | null
    draftHasText?: boolean
    mode?: DraftSessionMode
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
      mode: opts?.mode ?? 'chat',
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
  return { ...(session as DraftSessionRow), notes, categoryText: [] }
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
    .eq('source', 'viva')

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

export async function upsertCategoryText(
  supabase: SupabaseClient,
  sessionId: string,
  category: LifeCategoryKey,
  patch: Partial<
    Pick<
      DraftSessionCategoryText,
      | 'starter_text'
      | 'imagination_text'
      | 'vision_text'
      | 'now_text'
      | 'dream_text'
      | 'now_at'
      | 'dream_at'
      | 'unknown_at'
    >
  >,
): Promise<void> {
  const { error } = await supabase
    .from('vision_draft_session_category_text')
    .upsert(
      { session_id: sessionId, category, ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'session_id,category' },
    )
  if (error) console.error('[draft-session] Failed to upsert category text', error)
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
