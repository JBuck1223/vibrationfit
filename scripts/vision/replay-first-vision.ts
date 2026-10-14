#!/usr/bin/env tsx
/**
 * Replay a real first-vision conversation through the Rich First Vision
 * pipeline. Replay only: the member's real turns, nothing invented.
 *
 *   npx tsx scripts/vision/replay-first-vision.ts \
 *     --conversation 17b1f7aa-e4c8-4070-82dd-b8c070bcf8c5 [--out temp/replay-rylee] \
 *     [--retag] [--skip-compose] [--reuse-compose] [--save-draft | --as-version]
 *
 * What it does:
 *   1. Pulls the member's turns from ai_conversations in order.
 *   2. Runs the passage tagger on each member turn (cached to <out>/passages.json
 *      so reruns do not re-pay) and VIVA's SEED labels from each reply, so the
 *      depth map matches what a live session would hold.
 *   3. Prints the depth map after every turn: old gate (coverage: categories
 *      with any label) vs new gate (cleared: member words + scene).
 *   4. Runs composeFirstVision on the accumulated member words.
 *   5. Writes notes.json, depth-report.md, starters.md, vision.md, and a word
 *      count table beside the intensive medians.
 *   6. With --save-draft: writes the result as a NEW is_draft vision for that
 *      member (never active, never committed), with a composed Draft Session
 *      so /life-vision/begin opens it in "make it yours" mode.
 *
 * No DB writes without --save-draft. Token usage is logged as non-billable.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(`--${name}`)
const opt = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const CONVERSATION_ID = opt('conversation', '17b1f7aa-e4c8-4070-82dd-b8c070bcf8c5')
const OUT_DIR = path.resolve(opt('out', 'temp/replay-rylee'))
const RETAG = flag('retag')
const SKIP_COMPOSE = flag('skip-compose')
const REUSE_COMPOSE = flag('reuse-compose')
const AS_VERSION = flag('as-version')
const SAVE_DRAFT = flag('save-draft') || AS_VERSION

// Intensive cohort medians (16 vision_built members), category order below.
const CATEGORY_ORDER = ['fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality'] as const
const INTENSIVE_MEDIAN: Record<string, number> = {
  fun: 280, health: 274, travel: 251, love: 289, family: 259, social: 240,
  home: 271, work: 272, money: 333, stuff: 257, giving: 170, spirituality: 227,
}
const RYLEE_V1: Record<string, number> = {
  fun: 74, health: 69, travel: 83, love: 78, family: 74, social: 67,
  home: 80, work: 96, money: 75, stuff: 68, giving: 82, spirituality: 101,
}

function words(text: string): number {
  const t = (text || '').trim()
  return t ? t.split(/\s+/).length : 0
}

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local')
  if (!process.env.AI_GATEWAY_API_KEY) throw new Error('Missing AI_GATEWAY_API_KEY in .env.local')

  // Dynamic imports so dotenv runs before modules read process.env.
  const { createClient } = await import('@supabase/supabase-js')
  const { tagMemberPassages, passageLabel } = await import('@/lib/life-vision/passage-tagger')
  const { parseVisionUpdateMessage } = await import('@/lib/life-vision/vision-update-stream')
  const {
    computeDepth,
    groupNotesByCategory,
    formatSessionNotesForPrompt,
    DEPTH_CLEAR_WORDS,
  } = await import('@/lib/life-vision/draft-session')
  type DraftSessionNote = import('@/lib/life-vision/draft-session').DraftSessionNote
  const { composeFirstVision } = await import('@/lib/life-vision/compose-first-vision')
  const { getVisionCategoryLabel } = await import('@/lib/design-system/vision-categories')

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  fs.mkdirSync(OUT_DIR, { recursive: true })

  // 1. Pull the thread
  const { data: rows, error } = await supabase
    .from('ai_conversations')
    .select('role, message, created_at, user_id')
    .eq('conversation_id', CONVERSATION_ID)
    .order('created_at', { ascending: true })
  if (error) throw error
  if (!rows?.length) throw new Error(`No messages for conversation ${CONVERSATION_ID}`)
  const userId: string = rows[0].user_id
  console.log(`Loaded ${rows.length} messages (${rows.filter((r) => r.role === 'user').length} member turns) for user ${userId}`)

  // 2. Tag member turns (cached)
  const cachePath = path.join(OUT_DIR, 'passages.json')
  type Cached = Array<{ turn: number; passages: Array<{ category: string; polarity: string; passage: string }> }>
  let cached: Cached | null = null
  if (!RETAG && fs.existsSync(cachePath)) {
    cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
    console.log(`Using cached passages from ${cachePath} (pass --retag to redo)`)
  }

  const notes: DraftSessionNote[] = []
  const report: string[] = []
  report.push(`# Replay depth report — conversation ${CONVERSATION_ID}`, '')
  report.push(`Clear floor: ${DEPTH_CLEAR_WORDS} member words + a scene. Old gate counted any label as coverage.`, '')

  const tagged: Cached = []
  let turn = 0
  let priorAssistant: string | null = null
  let oldGateTurn: number | null = null
  let newGateTurn: number | null = null
  const nowIso = () => new Date().toISOString()

  for (const row of rows) {
    if (row.role === 'assistant') {
      // VIVA labels (what the old session stored)
      const parsed = parseVisionUpdateMessage(row.message)
      for (const s of parsed.seeds) {
        if (!s.complete || !s.text.trim()) continue
        notes.push({
          id: `viva-${notes.length}`,
          session_id: 'replay',
          category: s.category,
          polarity: s.polarity,
          text: s.text.trim(),
          member_text: null,
          source: 'viva',
          created_at: nowIso(),
        })
      }
      priorAssistant = parsed.chatText
      continue
    }

    turn += 1
    const member = String(row.message || '')
    let passages = cached?.find((c) => c.turn === turn)?.passages
    if (!passages) {
      process.stdout.write(`Tagging turn ${turn} (${words(member)} words)… `)
      const result = await tagMemberPassages({ memberMessage: member, vivaQuestion: priorAssistant, userId: null })
      passages = result.map((p) => ({ category: p.category, polarity: p.polarity, passage: p.passage }))
      console.log(`${passages.length} passages`)
    }
    tagged.push({ turn, passages })
    for (const p of passages) {
      notes.push({
        id: `member-${notes.length}`,
        session_id: 'replay',
        category: p.category,
        polarity: p.polarity as DraftSessionNote['polarity'],
        text: passageLabel(p.passage),
        member_text: p.passage,
        source: 'member',
        created_at: nowIso(),
      })
    }

    // Depth after this turn
    const depth = computeDepth(notes)
    const grouped = groupNotesByCategory(notes)
    const coverage = grouped.filter((g) => g.contrast.length || g.clarity.length || g.memberWords > 0).length
    if (oldGateTurn === null && coverage >= 9) oldGateTurn = turn
    if (newGateTurn === null && depth.readyToCompose) newGateTurn = turn

    const line = grouped
      .map((g) => `${g.category}:${g.memberWords}${g.depth === 'cleared' ? '*' : g.depth === 'unknown' ? '?' : ''}`)
      .join('  ')
    console.log(`Turn ${turn}: member ${words(member)}w | coverage ${coverage}/12 | cleared ${depth.cleared.length + depth.unknown.length}/12 | ${line}`)

    report.push(`## Turn ${turn} — ${words(member)} member words`)
    report.push('')
    report.push(`> ${member.replace(/\n+/g, ' ').slice(0, 220)}${member.length > 220 ? '…' : ''}`)
    report.push('')
    report.push(`Old gate coverage: ${coverage}/12 with any note. New gate: ${depth.cleared.length} cleared, ${depth.unknown.length} unknown-yet, ${depth.thin.length} thin, ${depth.empty.length} empty — ${depth.readyToCompose ? 'READY' : 'NOT READY'}.`)
    report.push('')
    report.push('| Area | Member words | Scene | Depth |')
    report.push('|---|---:|:-:|---|')
    for (const g of grouped) {
      report.push(`| ${getVisionCategoryLabel(g.category)} | ${g.memberWords} | ${g.hasScene ? 'yes' : ''} | ${g.depth} |`)
    }
    report.push('')
  }

  fs.writeFileSync(cachePath, JSON.stringify(tagged, null, 2))
  fs.writeFileSync(path.join(OUT_DIR, 'notes.json'), JSON.stringify(notes, null, 2))

  const finalDepth = computeDepth(notes)
  const finalGroups = groupNotesByCategory(notes)
  report.unshift(
    `**Old gate would have looked full at turn ${oldGateTurn ?? 'never'} (9+ of 12 with a label). New gate ${newGateTurn ? `cleared at turn ${newGateTurn}` : 'never cleared'}.**`,
    '',
    `Final: ${finalDepth.cleared.length} cleared (${finalDepth.cleared.join(', ') || 'none'}); thin: ${finalDepth.thin.join(', ') || 'none'}; empty: ${finalDepth.empty.join(', ') || 'none'}; unknown-yet: ${finalDepth.unknown.join(', ') || 'none'}. Total member words tagged: ${finalDepth.totalMemberWords}.`,
    '',
    'Areas VIVA would have kept asking about (thin or empty): ' + [...finalDepth.thin, ...finalDepth.empty].join(', '),
    '',
  )
  fs.writeFileSync(path.join(OUT_DIR, 'depth-report.md'), report.join('\n'))
  fs.writeFileSync(path.join(OUT_DIR, 'prompt-depth-map.md'), formatSessionNotesForPrompt(notes))
  console.log(`\nDepth report → ${path.join(OUT_DIR, 'depth-report.md')}`)
  console.log(`Old gate full at turn ${oldGateTurn ?? 'never'}; new gate ${newGateTurn ? `ready at turn ${newGateTurn}` : 'never ready'}.`)
  console.log(`Thin/empty at end: ${[...finalDepth.thin, ...finalDepth.empty].join(', ') || 'none'}`)

  if (SKIP_COMPOSE) {
    console.log('Skipping compose (--skip-compose).')
    return
  }

  // 3. Compose from exactly what she said
  let systemPrompt: string | undefined
  try {
    const { data } = await supabase.rpc('get_ai_tool_config', { p_tool_key: 'master_vision_assembly' }).single()
    systemPrompt = (data as { system_prompt?: string } | null)?.system_prompt || undefined
  } catch {
    systemPrompt = undefined
  }

  const composeCachePath = path.join(OUT_DIR, 'compose-result.json')
  let result: Awaited<ReturnType<typeof composeFirstVision>>
  if (REUSE_COMPOSE && fs.existsSync(composeCachePath)) {
    result = JSON.parse(fs.readFileSync(composeCachePath, 'utf8'))
    console.log(`\nReusing reviewed compose output from ${composeCachePath}`)
  } else {
    console.log('\nComposing 12 categories (starter → writer, in parallel)…')
    const t0 = Date.now()
    result = await composeFirstVision({
      notes,
      perspective: 'singular',
      systemPrompt,
      tracking: { supabase, userId, billable: false },
      onStage: (category, stage) => {
        console.log(`  ${category}: ${stage} done`)
      },
    })
    console.log(`Composed in ${Math.round((Date.now() - t0) / 1000)}s`)
  }

  // 4. Outputs
  const byKey = new Map(result.categories.map((c) => [c.category, c]))
  const starters: string[] = ['# Starters (imagination-starter pass over her words)', '']
  const vision: string[] = ['# Replayed first vision', '', '## Forward', '', result.forward, '']
  const table: string[] = [
    '# Word counts', '',
    '| Area | Her words | Starter | Vision (replay) | Vision v1 (live) | Intensive median |',
    '|---|---:|---:|---:|---:|---:|',
  ]
  let totalVision = 0
  for (const key of CATEGORY_ORDER) {
    const c = byKey.get(key)
    const label = getVisionCategoryLabel(key)
    if (!c) continue
    totalVision += c.visionWords
    starters.push(`## ${label} (${c.memberWords} member words → ${c.starterWords} starter words)`, '', c.starterText, '')
    vision.push(`## ${label}`, '', c.visionText, '')
    table.push(`| ${label} | ${c.memberWords} | ${c.starterWords} | ${c.visionWords} | ${RYLEE_V1[key]} | ${INTENSIVE_MEDIAN[key]} |`)
  }
  vision.push('## Conclusion', '', result.conclusion, '')
  table.push(`| **Total** | ${finalDepth.totalMemberWords} | ${result.categories.reduce((s, c) => s + c.starterWords, 0)} | **${totalVision}** | 947 | ~3,211 |`)

  fs.writeFileSync(path.join(OUT_DIR, 'starters.md'), starters.join('\n'))
  fs.writeFileSync(path.join(OUT_DIR, 'vision.md'), vision.join('\n'))
  fs.writeFileSync(path.join(OUT_DIR, 'word-counts.md'), table.join('\n'))
  fs.writeFileSync(path.join(OUT_DIR, 'compose-result.json'), JSON.stringify(result, null, 2))
  console.log(`\nVision → ${path.join(OUT_DIR, 'vision.md')}`)
  console.log(table.join('\n'))

  if (!SAVE_DRAFT) {
    console.log('\nNo DB writes (pass --save-draft to create a draft vision for this member).')
    return
  }

  // 5. Save as a new draft (never active), with a composed Draft Session.
  const { data: account } = await supabase.from('user_accounts').select('first_name').eq('id', userId).maybeSingle()
  const title = AS_VERSION
    ? 'Life Vision'
    : `${account?.first_name || 'Member'}'s Life Vision (replay draft ${new Date().toISOString().slice(0, 10)})`
  const categoryColumns: Record<string, string> = {}
  for (const c of result.categories) categoryColumns[c.category] = c.visionText

  // --as-version: commit as the next numbered version (is_draft=false) that
  // descends from the current active vision. Still never active.
  let parentId: string | null = null
  if (AS_VERSION) {
    const { data: active } = await supabase
      .from('vision_versions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('is_draft', false)
      .is('household_id', null)
      .maybeSingle()
    parentId = active?.id ?? null
  }

  const { data: draft, error: draftError } = await supabase
    .from('vision_versions')
    .insert({
      user_id: userId,
      title,
      perspective: 'singular',
      is_draft: !AS_VERSION,
      is_active: false,
      parent_id: parentId,
      forward: result.forward,
      conclusion: result.conclusion,
      ...categoryColumns,
    })
    .select('id')
    .single()
  if (draftError || !draft) throw draftError || new Error('Draft insert failed')

  const { data: session, error: sessionError } = await supabase
    .from('vision_draft_sessions')
    .insert({ user_id: userId, draft_id: draft.id, status: 'composed' })
    .select('id')
    .single()
  if (sessionError || !session) throw sessionError || new Error('Session insert failed')

  const noteRows = notes.map((n) => ({
    session_id: session.id,
    category: n.category,
    polarity: n.polarity,
    text: n.text,
    member_text: n.member_text,
    source: n.source,
  }))
  const { error: notesError } = await supabase.from('vision_draft_session_notes').insert(noteRows)
  if (notesError) throw notesError

  const { error: textError } = await supabase.from('vision_draft_session_category_text').insert(
    result.categories.map((c) => ({
      session_id: session.id,
      category: c.category,
      starter_text: c.starterText,
      imagination_text: c.imaginationText || null,
      vision_text: c.visionText,
    })),
  )
  if (textError) throw textError

  if (AS_VERSION) {
    console.log(`\nSaved version ${draft.id} (is_draft=false, is_active=false, parent ${parentId ?? 'none'}) with composed session ${session.id}.`)
    console.log('Open it at /life-vision/' + draft.id)
  } else {
    console.log(`\nSaved draft ${draft.id} (is_draft=true, is_active=false) with composed session ${session.id}.`)
    console.log('Open it at /life-vision/update?draft=' + draft.id + ' or via the Life Vision studio drafts list.')
  }
  void finalGroups
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
