import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadActiveContext } from '@/lib/life-explorer/context'
import { packForExpedition } from '@/lib/life-explorer/packs/antarctica'
import {
  brandLine,
  checklist,
  drawFrame,
  esc,
  pageFooter,
  printShell,
  writeLines,
} from '@/lib/life-explorer/print/layout'
import type { PackExperimentSheet } from '@/lib/life-explorer/packs/types'

export const dynamic = 'force-dynamic'

function experimentSheetPage(sheet: PackExperimentSheet, expeditionTitle: string): string {
  return `
    ${brandLine('Experiment Sheet')}
    <p class="kicker">The big question</p>
    <h1>${esc(sheet.question)}</h1>
    <p class="lede">${esc(sheet.title)}</p>
    <h2>My prediction</h2>
    <p class="hint">${esc(sheet.prediction_prompt)}</p>
    ${writeLines(2)}
    <h2>Steps</h2>
    ${checklist(sheet.steps)}
    <h2>What happened</h2>
    <table class="grid">
      <thead><tr><th></th>${sheet.chart_columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${sheet.chart_rows
        .map(
          (r) =>
            `<tr><td><strong>${esc(r)}</strong></td>${sheet.chart_columns.map(() => '<td></td>').join('')}</tr>`
        )
        .join('')}</tbody>
    </table>
    <h2>My discovery</h2>
    <p class="hint">${esc(sheet.result_prompt)}</p>
    ${writeLines(2)}
    ${drawFrame(sheet.draw_prompt, 170)}
    ${pageFooter(expeditionTitle)}`
}

// GET /api/life-explorer/print/kit — the Expedition Kit, printed once at
// launch: cover, passport, Wonder Wall headers, map, experiment sheets,
// completion certificate. Rendered live and always on-brand.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const expeditionId = request.nextUrl.searchParams.get('expedition_id')
  let expedition = null as { title: string; life_category: string } | null

  if (expeditionId) {
    const { data } = await supabase
      .from('le_expeditions')
      .select('title, life_category')
      .eq('id', expeditionId)
      .maybeSingle()
    expedition = data
  } else {
    const ctx = await loadActiveContext(supabase)
    expedition = ctx?.expedition || null
  }

  if (!expedition) {
    return new NextResponse('<h1>No active expedition</h1>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const pack = packForExpedition(expedition.title)
  if (!pack) {
    return new NextResponse(`<h1>No pack found for ${esc(expedition.title)}</h1>`, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const p = pack.printables
  const title = pack.title

  const cover = `
    ${brandLine('Expedition Kit')}
    <p class="kicker">${esc(pack.life_category)} expedition</p>
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(pack.tagline)}</p>
    <hr class="rule">
    <p>${esc(p.mission)}</p>
    <h2>Questions we're chasing</h2>
    ${checklist(pack.essential_questions)}
    <p class="hint">Print this kit once at the start of the expedition. Day pages arrive with each week's packet.</p>
    ${pageFooter(title)}`

  const passport = `
    ${brandLine('Explorer Passport')}
    <h1>Explorer Passport</h1>
    <p class="lede">Every expedition needs an official explorer. Make it official.</p>
    ${p.passport_lines
      .map(
        (label) => `
      <p class="kicker" style="margin-top:16px">${esc(label)}</p>
      ${writeLines(1)}`
      )
      .join('')}
    <div class="two-col" style="margin-top:18px">
      ${drawFrame('Self-portrait in expedition gear', 220)}
      ${drawFrame('My mission patch', 220)}
    </div>
    ${pageFooter(title)}`

  const wonderWall = `
    ${brandLine('Wonder Wall')}
    <p class="kicker">Setup — for the lead explorer</p>
    <h1>Build the Wonder Wall</h1>
    <p class="lede">Cut out the three board headers below and tape them to a wall. Every sticky note goes under one of them — in the explorer's own words.</p>
    ${['WHAT I KNOW', 'WHAT I WONDER', 'WHAT I LEARNED']
      .map(
        (h) => `
      <div class="frame" style="padding: 22px 16px; margin: 18px 0; border-style: dashed;">
        <p style="text-align:center; font-size:22pt; font-weight:700; letter-spacing:0.06em; margin:0">${h}</p>
      </div>`
      )
      .join('')}
    <p class="hint">Knows stay exactly as said — even if they turn out wrong. That's how we measure discovery. When a Wonder gets answered, its sticky migrates to What I Learned. Snap a photo of the wall in the app and the digital wall updates itself.</p>
    ${pageFooter(title)}`

  const map = `
    ${brandLine('Expedition Map')}
    <h1>Expedition Map</h1>
    <p class="lede">${esc(p.map_prompt)}</p>
    ${drawFrame('My expedition map', 520)}
    ${pageFooter(title)}`

  const certificate = `
    ${brandLine('Certificate')}
    <div class="certificate" style="margin-top:40px">
      <p class="kicker">Vibration Fit — Life Explorer</p>
      <h1 style="margin-top:10px">Certificate of Exploration</h1>
      <p class="lede" style="margin-top:24px">This certifies that</p>
      <p class="big-name">&nbsp;</p>
      <p style="max-width:480px; margin: 18px auto 0">${esc(p.certificate_line)}</p>
      <div class="two-col" style="margin-top:48px; text-align:left">
        <div><p class="kicker">Date</p>${writeLines(1, true)}</div>
        <div><p class="kicker">Lead explorer (parent)</p>${writeLines(1, true)}</div>
      </div>
    </div>`

  const pages = [
    cover,
    passport,
    wonderWall,
    map,
    ...p.experiment_sheets.map((s) => experimentSheetPage(s, title)),
    certificate,
  ]

  return new NextResponse(printShell({ title: `${title} — Expedition Kit`, pages }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
