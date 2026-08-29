#!/usr/bin/env tsx
/**
 * One-off: harvest member-reported wins from Alignment Gym transcripts.
 *
 * Usage:
 *   npx tsx scripts/archive/harvest-alignment-gym-wins.ts
 *   npx tsx scripts/archive/harvest-alignment-gym-wins.ts --force
 *   npx tsx scripts/archive/harvest-alignment-gym-wins.ts --render-only
 *   npx tsx scripts/archive/harvest-alignment-gym-wins.ts --session-id <uuid>
 *
 * Writes:
 *   temp/alignment-gym-wins/sessions/<id>.json  (resume cache, gitignored)
 *   temp/alignment-gym-wins/harvest.json
 *   docs/marketing/alignment-gym-wins.md        (internal review draft)
 *
 * Move to scripts/archive/ after a successful run.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiKey = process.env.OPENAI_API_KEY

if (!supabaseUrl || !supabaseServiceKey || !openaiKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiKey })

const OUT_DIR = path.resolve(process.cwd(), 'temp/alignment-gym-wins')
const SESSION_DIR = path.join(OUT_DIR, 'sessions')
const HARVEST_JSON = path.join(OUT_DIR, 'harvest.json')
const REVIEW_MD = path.resolve(process.cwd(), 'docs/marketing/alignment-gym-wins.md')

const CHUNK_CHARS = 28000
const CHUNK_OVERLAP = 2500
const LIFE_CATEGORIES = [
  'Fun',
  'Health',
  'Travel',
  'Love',
  'Family',
  'Social',
  'Home',
  'Work',
  'Money',
  'Stuff',
  'Giving',
  'Spirituality',
] as const

interface SessionRow {
  id: string
  title: string
  scheduled_at: string
  transcript_text: string
  member_first_names: string[]
}

interface Win {
  first_name: string
  timestamp: string
  life_category: string
  what_changed: string
  in_their_own_words: string
}

interface SessionHarvest {
  session_id: string
  title: string
  scheduled_at: string
  session_date_label: string
  transcript_chars: number
  chunk_count: number
  wins: Win[]
}

const WIN_SYSTEM_PROMPT = `You extract member-reported wins from a Vibration Fit Alignment Gym transcript.

Hosts are Jordan and Vanessa. Ignore their teaching, stories, hypotheticals, and coaching examples.

Return JSON only:
{
  "wins": [
    {
      "first_name": "Barbara",
      "timestamp": "34:12",
      "life_category": "Money",
      "what_changed": "One-line destination: what is now true that was not.",
      "in_their_own_words": "Verbatim member quote from the transcript."
    }
  ]
}

What counts as a win:
- A member reports something that already happened or is happening now: money received, house/car/trip, health shift, relationship change, job, sale, identity shift with evidence, specific "it showed up" moment.
- Must be the member speaking about their own life.

Skip:
- Host teaching and host stories
- Hypotheticals, visualizations, and "I want to" / "I'm intending" with no evidence yet
- Jokes, small talk, tech issues, gratitude for the call with no specific actualization
- Medical diagnoses, legal matters, bank/account/SSN/phone numbers
- Anything that identifies a minor
- Wins about a third party who did not speak on the call (partner, kid, friend) unless the member is clearly reporting their own result
- "I attended Gym" or "the community is great" with no concrete change

Rules for fields:
- first_name: first name only. Match it to the member roster when you can hear the name or a host addresses them. If you hear a last name, drop it. If you cannot hear a name, use "Member". Never invent a name that is not on the roster or spoken.
- timestamp: the [M:SS] or [MM:SS] marker nearest the start of their story. Empty string if none.
- life_category: exactly one of ${LIFE_CATEGORIES.join(', ')}. If unclear, pick the closest.
- what_changed: one sentence, destination language, not "they shared in Gym".
- in_their_own_words: REQUIRED and separate. Copy the member's spoken words from the transcript. Not paraphrased. Long enough to hear them (a few sentences if they told the story). Trim only host interruptions, other members talking over them, and filler um/uh. Keep their grammar and phrasing. This is the line that could be published. Reject assent-only lines ("sign me up", "let's go", "yes") with no story.

If this excerpt has no real member wins, return {"wins":[]}. Prefer missing a weak one over inventing a win.`

function parseArgs() {
  const args = process.argv.slice(2)
  const sessionIdIndex = args.indexOf('--session-id')
  return {
    force: args.includes('--force'),
    renderOnly: args.includes('--render-only'),
    sessionId: sessionIdIndex >= 0 ? args[sessionIdIndex + 1] : null,
  }
}

function applyReviewFixes(sessions: SessionHarvest[]): SessionHarvest[] {
  const seeds: Record<string, Win[]> = {
    '23acdabd-eabc-4ba4-ab07-dbf359c96476': [
      {
        first_name: 'Alicia',
        timestamp: '47:10',
        life_category: 'Work',
        what_changed: 'After losing her job, Alicia built her coaching offer and found her first five clients in nine days.',
        in_their_own_words:
          "And in January, well, April 12th, I lost my job. And I was like, holy God, what? I had five minutes notice for the computer shut down and I lost. I made over $100,000. And not another check was coming. I was like, wait, what? This is not in the plan. And I'm like. holy crap, I've been working on this coaching business and trying to do these things. I guess I have to make this come to fruition by next Friday so I can replace the paycheck I was supposed to have. And so I took nine days, built the website, built the program, got the PDF put together and found my first five clients within that nine day time frame.",
      },
    ],
    '70af8344-4ecc-451f-a6c0-ef6bed66de16': [
      {
        first_name: 'Alicia',
        timestamp: '43:47',
        life_category: 'Stuff',
        what_changed: 'Alicia bought the camper she had been holding for — fully stocked, ten miles from her house.',
        in_their_own_words:
          "So I actualized my camper yesterday. Yeah, I bought it yesterday. I wanted it so bad to take all my grandkids camping all summer and be able to rent out my two houses for income all summer. And it kept being... Like, um, you know, I couldn't find, I only wanted to spend five or six grand and everybody told me I was crazy. I was going to find a piece of crap. And I'm like, I do not care if I spend any more than that. It, it makes more sense for me to just live in one of my houses. Like I'm not doing that. So I was just stuck on it. And then we were looking in Florida, looking in Minnesota and all these different places. And this one was 10 miles from my house. And my dad went over yesterday and looked at it. And I've had my dad see a couple. My brother looked at one. And my dad went there yesterday and he called me. He goes, Alicia. What? You have to buy this right this minute. I know it's a little bit more than you wanted because it was 69.90 instead of between five and 6,000. He goes, but it's fully stocked, even all the silverware. So you don't have to buy anything. And I would live in this.",
      },
    ],
    '3392422a-937a-424c-baff-65fef12c54c6': [
      {
        first_name: 'Dennis',
        timestamp: '1:47',
        life_category: 'Money',
        what_changed: 'Dennis made $975 trading that morning.',
        in_their_own_words:
          'made almost a thousand dollars trading this morning i made 975 trading this morning',
      },
    ],
  }

  return sessions.map((session) => {
    const wins = session.wins.map((win) => {
      const quote = win.in_their_own_words.toLowerCase()
      if (
        /\b(trad(e|ed|ing)|stocks?|funded pro trader)\b/.test(quote) &&
        win.first_name !== 'Dennis'
      ) {
        return {
          ...win,
          first_name: 'Dennis',
          what_changed: win.what_changed.replace(/\bMichele\b/g, 'Dennis'),
        }
      }
      if (
        /turned all the utilities|porch work/.test(quote) &&
        win.first_name !== 'Lisa'
      ) {
        return { ...win, first_name: 'Lisa' }
      }
      return win
    })

    const extras = seeds[session.session_id] || []
    for (const extra of extras) {
      const already = wins.some(
        (win) =>
          win.in_their_own_words.slice(0, 60).toLowerCase() ===
          extra.in_their_own_words.slice(0, 60).toLowerCase()
      )
      if (!already) wins.push(extra)
    }

    return { ...session, wins: dedupeWins(wins) }
  })
}

function formatSessionDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

function firstNameOnly(name: string): string {
  const cleaned = (name || 'Member').replace(/[^A-Za-z' -]/g, ' ').trim()
  if (!cleaned) return 'Member'
  return cleaned.split(/\s+/)[0]
}

function normalizeCategory(raw: string): string {
  const match = LIFE_CATEGORIES.find(
    (c) => c.toLowerCase() === (raw || '').trim().toLowerCase()
  )
  return match || 'Spirituality'
}

function looksUnsafe(text: string): boolean {
  return /\b(\d{3}[-.\s]?\d{2}[-.\s]?\d{4}|\d{9,}|account\s*(number|#)|routing\s*number|ssn)\b/i.test(
    text
  )
}

function chunkTranscript(text: string): string[] {
  if (text.length <= CHUNK_CHARS) return [text]

  const blocks = text.split(/\n{2,}/)
  const chunks: string[] = []
  let current = ''

  for (const block of blocks) {
    const next = current ? `${current}\n\n${block}` : block
    if (next.length > CHUNK_CHARS && current) {
      chunks.push(current)
      const overlap = current.slice(-CHUNK_OVERLAP)
      current = `${overlap}\n\n${block}`
    } else {
      current = next
    }
  }

  if (current.trim()) chunks.push(current)
  return chunks
}

function isPublishableQuote(quote: string): boolean {
  const text = quote.trim()
  if (text.length < 40) return false
  if (/^(yeah|yes|absolutely|let'?s go|sign me up|okay|wow|thank you)[.!]?$/i.test(text)) {
    return false
  }
  return /\b(I|I'm|I've|I'd|we|we're|we've)\b/i.test(text)
}

async function extractWinsFromChunk(
  sessionTitle: string,
  sessionDate: string,
  memberNames: string[],
  chunk: string,
  chunkIndex: number,
  chunkCount: number
): Promise<Win[]> {
  const roster = memberNames.length > 0 ? memberNames.join(', ') : '(unknown)'
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: WIN_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Session: ${sessionTitle} — ${sessionDate}\nMembers on this call (first names only): ${roster}\nExcerpt ${chunkIndex + 1} of ${chunkCount}:\n\n${chunk}`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) return []

  let parsed: { wins?: unknown }
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.warn('  Could not parse JSON from model; skipping chunk')
    return []
  }

  if (!Array.isArray(parsed.wins)) return []

  return parsed.wins
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const quote = String(row.in_their_own_words || '').trim()
      const changed = String(row.what_changed || '').trim()
      if (!quote || !changed) return null
      if (!isPublishableQuote(quote)) return null
      if (looksUnsafe(quote) || looksUnsafe(changed)) return null
      return {
        first_name: firstNameOnly(String(row.first_name || 'Member')),
        timestamp: String(row.timestamp || '').trim(),
        life_category: normalizeCategory(String(row.life_category || '')),
        what_changed: changed,
        in_their_own_words: quote,
      } satisfies Win
    })
    .filter((win): win is Win => win !== null)
}

function winKey(win: Win): string {
  return [
    win.first_name.toLowerCase(),
    win.timestamp,
    win.in_their_own_words.slice(0, 80).toLowerCase(),
  ].join('|')
}

function dedupeWins(wins: Win[]): Win[] {
  const seen = new Set<string>()
  const out: Win[] = []
  for (const win of wins) {
    const key = winKey(win)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(win)
  }
  return out
}

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const wait = 1500 * (i + 1)
      console.warn(`  ${label} failed (attempt ${i + 1}/${attempts}). Retrying in ${wait}ms`)
      await new Promise((resolve) => setTimeout(resolve, wait))
    }
  }
  throw lastError
}

async function harvestSession(session: SessionRow, force: boolean): Promise<SessionHarvest> {
  const cachePath = path.join(SESSION_DIR, `${session.id}.json`)
  if (!force && fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8')) as SessionHarvest
    console.log(`  Cached (${cached.wins.length} wins)`)
    return cached
  }

  const dateLabel = formatSessionDate(session.scheduled_at)
  const chunks = chunkTranscript(session.transcript_text)
  const wins: Win[] = []

  for (let i = 0; i < chunks.length; i++) {
    console.log(`  Chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`)
    const extracted = await withRetry(`chunk ${i + 1}`, () =>
      extractWinsFromChunk(
        session.title,
        dateLabel,
        session.member_first_names,
        chunks[i],
        i,
        chunks.length
      )
    )
    wins.push(...extracted)
  }

  const harvest: SessionHarvest = {
    session_id: session.id,
    title: session.title,
    scheduled_at: session.scheduled_at,
    session_date_label: dateLabel,
    transcript_chars: session.transcript_text.length,
    chunk_count: chunks.length,
    wins: dedupeWins(wins),
  }

  fs.writeFileSync(cachePath, JSON.stringify(harvest, null, 2))
  return harvest
}

function renderMarkdown(sessions: SessionHarvest[]): string {
  const totalWins = sessions.reduce((sum, session) => sum + session.wins.length, 0)
  const lines: string[] = [
    '# Alignment Gym wins (internal draft)',
    '',
    'INTERNAL. Do not publish, email, or post until each line is approved.',
    '',
    `Harvested from ${sessions.length} Alignment Gym transcripts with member-reported actualizations. First names only (matched to the session roster when the recording did not say the name). **In their own words** is verbatim from the transcript, not paraphrased.`,
    '',
    `Total wins in this draft: ${totalWins}`,
    '',
    'Mark **Usable** `Y` or `N` on each win after you review.',
    '',
    '---',
    '',
  ]

  let index = 1
  for (const session of sessions) {
    lines.push(`## ${session.title} — ${session.session_date_label}`)
    lines.push('')
    lines.push(`Session id: \`${session.session_id}\``)
    lines.push('')

    if (session.wins.length === 0) {
      lines.push('_No member-reported wins extracted from this session._')
      lines.push('')
      continue
    }

    for (const win of session.wins) {
      lines.push(`### ${index}. ${win.first_name} — ${win.life_category}`)
      lines.push('')
      lines.push(`- **First name:** ${win.first_name}`)
      lines.push(`- **Session:** ${session.title} — ${session.session_date_label}`)
      lines.push(`- **Timestamp:** ${win.timestamp || '(none)'}`)
      lines.push(`- **Life category:** ${win.life_category}`)
      lines.push(`- **What changed:** ${win.what_changed}`)
      lines.push(`- **In their own words:**`)
      lines.push('')
      lines.push(`> ${win.in_their_own_words.replace(/\n+/g, '\n> ')}`)
      lines.push('')
      lines.push('- **Usable:**')
      lines.push('')
      index += 1
    }
  }

  lines.push('---')
  lines.push('')
  lines.push('End of draft. Nothing here is live on the homepage.')
  lines.push('')
  return lines.join('\n')
}

async function main() {
  const { force, sessionId, renderOnly } = parseArgs()
  fs.mkdirSync(SESSION_DIR, { recursive: true })
  fs.mkdirSync(path.dirname(REVIEW_MD), { recursive: true })

  let query = supabase
    .from('video_sessions')
    .select('id, title, scheduled_at, transcript_text')
    .eq('session_type', 'alignment_gym')
    .not('transcript_text', 'is', null)
    .order('scheduled_at', { ascending: true })

  if (sessionId) {
    query = query.eq('id', sessionId)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(`Failed to load sessions: ${error.message}`)
  }

  const rawSessions = ((data || []) as Omit<SessionRow, 'member_first_names'>[]).filter(
    (row) => typeof row.transcript_text === 'string' && row.transcript_text.trim().length > 0
  )

  const sessionIds = rawSessions.map((row) => row.id)
  const { data: participants, error: participantError } = await supabase
    .from('video_session_participants')
    .select('session_id, name, is_host')
    .in('session_id', sessionIds)

  if (participantError) {
    console.warn(`Could not load participant names: ${participantError.message}`)
  }

  const namesBySession = new Map<string, string[]>()
  for (const participant of participants || []) {
    if (participant.is_host) continue
    const first = firstNameOnly(String(participant.name || ''))
    if (!first || first === 'Member') continue
    if (['Jordan', 'Vanessa'].includes(first)) continue
    const list = namesBySession.get(participant.session_id) || []
    if (!list.includes(first)) list.push(first)
    namesBySession.set(participant.session_id, list)
  }

  const sessions: SessionRow[] = rawSessions.map((row) => ({
    ...row,
    member_first_names: namesBySession.get(row.id) || [],
  }))

  if (sessions.length === 0) {
    console.error('No Alignment Gym sessions with transcripts found.')
    process.exit(1)
  }

  console.log(`Harvesting ${sessions.length} Alignment Gym session(s)`)

  const harvested: SessionHarvest[] = []
  for (const [i, session] of sessions.entries()) {
    console.log(
      `\n[${i + 1}/${sessions.length}] ${formatSessionDate(session.scheduled_at)} (${session.transcript_text.length} chars)`
    )
    const result = await harvestSession(session, force && !renderOnly)
    console.log(`  ${result.wins.length} win(s)`)
    harvested.push(result)
  }

  const reviewed = applyReviewFixes(harvested)
  const payload = {
    generated_at: new Date().toISOString(),
    session_count: reviewed.length,
    win_count: reviewed.reduce((sum, session) => sum + session.wins.length, 0),
    sessions: reviewed,
  }

  fs.writeFileSync(HARVEST_JSON, JSON.stringify(payload, null, 2))
  fs.writeFileSync(REVIEW_MD, renderMarkdown(reviewed))

  console.log(`\nWrote ${payload.win_count} wins`)
  console.log(`  ${HARVEST_JSON}`)
  console.log(`  ${REVIEW_MD}`)
}

main().catch((error) => {
  console.error('Harvest failed:', error)
  process.exit(1)
})
