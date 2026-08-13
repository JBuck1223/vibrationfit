import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadActiveContext } from '@/lib/life-explorer/context'
import { READING_LADDER, currentLadderPosition } from '@/lib/life-explorer/ladders'
import { weeklySightWords, schoolQuarter } from '@/lib/life-explorer/sight-words'
import { packForExpedition } from '@/lib/life-explorer/packs/antarctica'
import {
  brandLine,
  checklist,
  cutCards,
  drawFrame,
  esc,
  pageFooter,
  printShell,
  writeLines,
} from '@/lib/life-explorer/print/layout'

export const dynamic = 'force-dynamic'

/**
 * A universal field-notes day page — works for ANY lesson.
 * Student-facing: every word on it belongs to the explorer. Parent
 * guidance (one page per adventure, invented spelling welcome) lives
 * once on the packet cover, never here.
 */
function dayPage(expeditionTitle: string): string {
  return `
    ${brandLine('Field Notes')}
    <h1>Field Notes</h1>
    ${drawFrame('What I saw / built / discovered today', 290)}
    <p class="kicker" style="margin-top:16px">My sentence about today</p>
    ${writeLines(3)}
    <p class="kicker" style="margin-top:12px">A new thing I wonder</p>
    ${writeLines(2)}
    ${pageFooter(expeditionTitle)}`
}

// GET /api/life-explorer/print/week — the Weekly Explorer Packet, printed
// with the Sunday materials forecast: 5 universal day pages, decodable
// word cards for the child's CURRENT reading rung, expedition vocabulary.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const studentId = request.nextUrl.searchParams.get('student_id') || undefined
  const ctx = await loadActiveContext(supabase, studentId)
  if (!ctx?.expedition) {
    return new NextResponse('<h1>No active expedition</h1>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const expedition = ctx.expedition
  const pack = packForExpedition(expedition.title)
  const readingPos = currentLadderPosition(READING_LADDER, ctx.skills, ctx.student.grade_level)
  const rung = readingPos.current_rung
  const decodableWords = rung.decodable_words || []

  // Sight words follow the FL first-grade pacing list (143 words across four
  // nine-week quarters) — a rotating 12-word window so every word cycles back.
  const gradeLevel = ctx.student.grade_level
  const sightWords =
    gradeLevel == null || String(gradeLevel) === '1' ? weeklySightWords() : []
  const sightCards =
    sightWords.length > 0
      ? `
    ${brandLine('Sight Words')}
    <h1>Sight Words</h1>
    <p class="lede">Words you just know — no sounding out needed.</p>
    ${cutCards(sightWords.map((w) => ({ word: w })))}
    <p class="hint" style="margin-top:18px">First-grade high-frequency word list (quarter ${schoolQuarter()} pacing) — a fresh 12 rotate in each week. Read on sight: flash each card for one second. Any word that needs sounding out goes on the fridge for the week.</p>
    ${pageFooter(expedition.title)}`
      : null

  const cover = `
    ${brandLine('Weekly Packet')}
    <p class="kicker">${esc(expedition.life_category)} · ${esc(expedition.title)}</p>
    <h1>This Week's Explorer Packet</h1>
    <p class="lede">Five field-notes pages, this week's reading cards, and the expedition word cards. Print once, explore all week.</p>
    <h2>Inside</h2>
    ${checklist([
      'Field Notes — one page per adventure (5)',
      `Reading cards — ${rung.label}`,
      ...(sightCards ? ["Sight words — this week's 12"] : []),
      ...(pack ? ['Expedition word cards'] : []),
    ])}
    <h2>For the lead explorer</h2>
    <p class="hint">Field notes are ${esc(ctx.student.name)}'s own — exact words, invented spelling and all. Reading cards: cut out, shuffle, read on sight (hiding them around the room makes a great treasure hunt). They always match the current rung on the reading ladder and level up automatically as skills become secure. Word cards can live next to the Wonder Wall.</p>
    ${pageFooter(expedition.title)}`

  const readingCards = `
    ${brandLine('Reading Cards')}
    <h1>Reading Cards</h1>
    <p class="lede">Can you read every card?</p>
    ${cutCards(decodableWords.map((w) => ({ word: w })))}
    <p class="hint" style="margin-top:18px">${esc(rung.label)} · Mastery check: ${esc(rung.mastery_check)} When it's easy two days in a row, mark it in the check-in — next week's cards level up.</p>
    ${pageFooter(expedition.title)}`

  const vocabCards = pack
    ? `
    ${brandLine('Expedition Words')}
    <h1>Expedition Words</h1>
    <p class="lede">The words real ${esc(expedition.title)} explorers use.</p>
    ${cutCards(pack.vocabulary.map((w) => ({ word: w })))}
    ${pageFooter(expedition.title)}`
    : null

  const pages = [
    cover,
    dayPage(expedition.title),
    dayPage(expedition.title),
    dayPage(expedition.title),
    dayPage(expedition.title),
    dayPage(expedition.title),
    readingCards,
    ...(sightCards ? [sightCards] : []),
    ...(vocabCards ? [vocabCards] : []),
  ]

  return new NextResponse(
    printShell({ title: `${expedition.title} — Weekly Explorer Packet`, pages }),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
