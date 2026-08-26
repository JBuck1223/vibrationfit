/**
 * Life Learning printables — the weekly packet insert and the kit's
 * Life Compass page. Deterministic (no AI call at print time): the story
 * page is a short fixed story world for this week's focus; cut cards are
 * clock faces, coins, or one VF Kids compass card.
 */

import { brandLine, cutCards, esc, pageFooter, writeLines } from './layout'
import { COMPASS_SLICES, COMPASS_TRUTHS, compassSlice } from '../vf-kids'
import type { WeeklyLifeLearningFocus } from '../life-learning'
import type { LifeCategoryKey } from '@/lib/design-system/vision-categories'

// ---------------------------------------------------------------------------
// Clock faces (SVG, ink-minimal)
// ---------------------------------------------------------------------------

function analogClock(hour: number, minute: number, size = 110): string {
  const c = size / 2
  const r = c - 4
  const hourAngle = ((hour % 12) + minute / 60) * 30 - 90
  const minAngle = minute * 6 - 90
  const rad = (deg: number) => (deg * Math.PI) / 180
  const hx = c + r * 0.5 * Math.cos(rad(hourAngle))
  const hy = c + r * 0.5 * Math.sin(rad(hourAngle))
  const mx = c + r * 0.75 * Math.cos(rad(minAngle))
  const my = c + r * 0.75 * Math.sin(rad(minAngle))
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = rad(i * 30 - 90)
    const x1 = c + (r - 6) * Math.cos(a)
    const y1 = c + (r - 6) * Math.sin(a)
    const x2 = c + r * Math.cos(a)
    const y2 = c + r * Math.sin(a)
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#1a1a1a" stroke-width="1.5"/>`
  }).join('')
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
    ${ticks}
    <line x1="${c}" y1="${c}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
    <line x1="${c}" y1="${c}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="${c}" cy="${c}" r="2.5" fill="#1a1a1a"/>
  </svg>`
}

function clockCard(hour: number, minute: number): string {
  return `<div class="card" style="padding:10px 8px">${analogClock(hour, minute)}<span class="card-sub">_____ : _____</span></div>`
}

// ---------------------------------------------------------------------------
// The weekly insert: one story page + one cut-card page for the focus
// ---------------------------------------------------------------------------

export function lifeLearningInsertPages(
  focus: WeeklyLifeLearningFocus,
  studentName: string,
  expeditionTitle: string
): string[] {
  if (focus.resource.key === 'time') return timePages(studentName, expeditionTitle)
  if (focus.resource.key === 'money') return moneyPages(studentName, expeditionTitle)
  if (focus.resource.key === 'life-compass') {
    return compassWeekPages(focus.compass_slice_key as LifeCategoryKey | null, expeditionTitle)
  }
  return []
}

function timePages(studentName: string, expeditionTitle: string): string[] {
  const story = `
    ${brandLine('When Things Happen')}
    <h1>The Clock That Ran the Expedition</h1>
    <p class="lede">A story for an explorer who needs to know when things happen.</p>
    <p>Every real expedition runs on a clock. At <strong>7:00</strong> the sun wakes the camp.
    At <strong>8:30</strong> the explorers check their gear. At <strong>12:00</strong> — lunch,
    always lunch. And at <strong>7:30</strong> the head lamp clicks on, because the dark does
    not wait for anyone.</p>
    <p>${esc(studentName)}, your mission this week: catch the clock in the act.
    When something real happens — breakfast, the walk, lights out — look at a clock
    and say the time out loud. Hour hand first (the short one), minute hand second.</p>
    <p class="kicker" style="margin-top:16px">My clock catches this week</p>
    ${writeLines(3)}
    ${pageFooter(expeditionTitle)}`

  const cards = `
    ${brandLine('When Things Happen')}
    <h1>Clock Cards</h1>
    <p class="lede">Read each clock. Write the time under it.</p>
    <div class="cards">
      ${clockCard(3, 0)}${clockCard(8, 0)}${clockCard(11, 0)}
      ${clockCard(3, 30)}${clockCard(7, 30)}${clockCard(12, 30)}
    </div>
    <p class="hint" style="margin-top:18px">Hour and half hour. Cut out, shuffle, read. When 3:30 is easy two days in a row, mark it in the check-in.</p>
    ${pageFooter(expeditionTitle)}`

  return [story, cards]
}

function moneyPages(studentName: string, expeditionTitle: string): string[] {
  const story = `
    ${brandLine('What Coins Can Do')}
    <h1>The Explorer Shop</h1>
    <p class="lede">A story for an explorer with a pocket full of coins.</p>
    <p>Every expedition needs supplies, and supplies cost coins. A penny is 1¢ — small
    but honest. A nickel is 5¢. A dime is 10¢ — the smallest coin with the biggest job.
    A quarter is 25¢, and a quarter buys real things at the Explorer Shop.</p>
    <p>${esc(studentName)}, your mission this week: run the shop. Set out three things
    with prices. Someone in the family comes to buy. Count the coins into your hand —
    touch each coin once, say its value out loud.</p>
    <p class="kicker" style="margin-top:16px">My shop's prices this week</p>
    ${writeLines(3)}
    ${pageFooter(expeditionTitle)}`

  const cards = `
    ${brandLine('What Coins Can Do')}
    <h1>Coin Cards</h1>
    <p class="lede">Cut out the coins. Then take the 25¢ challenge.</p>
    ${cutCards([
      { word: '1¢', sub: 'penny' },
      { word: '5¢', sub: 'nickel' },
      { word: '10¢', sub: 'dime' },
      { word: '25¢', sub: 'quarter' },
      { word: '1¢', sub: 'penny' },
      { word: '5¢', sub: 'nickel' },
      { word: '10¢', sub: 'dime' },
      { word: '10¢', sub: 'dime' },
      { word: '5¢', sub: 'nickel' },
    ])}
    <h2>The 25¢ challenge</h2>
    <p>Build 25¢ two different ways with your cards. Draw or write both ways:</p>
    ${writeLines(2)}
    ${pageFooter(expeditionTitle)}`

  return [story, cards]
}

function compassWeekPages(
  sliceKey: LifeCategoryKey | null,
  expeditionTitle: string
): string[] {
  const slice = sliceKey ? compassSlice(sliceKey) : COMPASS_SLICES[0]
  const truths = COMPASS_TRUTHS.map(
    (t) => `<li><strong>${esc(t.kid_sentence)}</strong> <span class="hint">${esc(t.daily_move)}</span></li>`
  ).join('')
  const card = `
    ${brandLine('Life Compass')}
    <h1>${esc(slice.kid_name)}</h1>
    <p class="lede">This week's compass slice. One word for its job: <strong>${esc(slice.job)}</strong>.</p>
    <h2>The move</h2>
    <p>${esc(slice.body_move)}</p>
    <h2>Say them like you mean them</h2>
    <ul class="steps">${truths}</ul>
    <h2>This slice's story this week</h2>
    <p class="hint">One real moment from this week that belongs to ${esc(slice.kid_name)}. His words, your handwriting is fine.</p>
    ${writeLines(4)}
    <p class="hint" style="margin-top:14px">When the story is told, color this slice on the fridge compass.</p>
    ${pageFooter(expeditionTitle)}`
  return [card]
}

// ---------------------------------------------------------------------------
// The kit's fridge compass — printed once, colored in all year
// ---------------------------------------------------------------------------

function compassWheelSvg(size = 460): string {
  const c = size / 2
  const rOuter = c - 10
  const rLabel = rOuter * 0.72
  const rad = (deg: number) => (deg * Math.PI) / 180
  const slices = COMPASS_SLICES.map((slice, i) => {
    const a0 = rad(i * 30 - 90)
    const a1 = rad((i + 1) * 30 - 90)
    const mid = rad(i * 30 + 15 - 90)
    const x0 = c + rOuter * Math.cos(a0)
    const y0 = c + rOuter * Math.sin(a0)
    const x1 = c + rOuter * Math.cos(a1)
    const y1 = c + rOuter * Math.sin(a1)
    const lx = c + rLabel * Math.cos(mid)
    const ly = c + rLabel * Math.sin(mid)
    const nx = c + rOuter * 0.42 * Math.cos(mid)
    const ny = c + rOuter * 0.42 * Math.sin(mid)
    return `
      <path d="M ${c} ${c} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${rOuter} ${rOuter} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z"
        fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
      <text x="${nx.toFixed(1)}" y="${ny.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
        font-size="13" font-weight="600" fill="#1a1a1a">${i + 1}</text>
      <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
        font-size="9" fill="#6b6b6b">${esc(slice.job)}</text>`
  }).join('')
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto">
    <circle cx="${c}" cy="${c}" r="${rOuter}" fill="none" stroke="#1a1a1a" stroke-width="2"/>
    ${slices}
  </svg>`
}

export function compassKitPage(studentName: string, expeditionTitle: string): string {
  const legendItem = (s: (typeof COMPASS_SLICES)[number], i: number) =>
    `<li><strong>${i + 1}.</strong> ${esc(s.kid_name)}</li>`
  const left = COMPASS_SLICES.slice(0, 6).map((s, i) => legendItem(s, i)).join('')
  const right = COMPASS_SLICES.slice(6).map((s, i) => legendItem(s, i + 6)).join('')
  return `
    ${brandLine('Life Compass')}
    <h1>${esc(studentName)}'s Life Compass</h1>
    <p class="lede">Twelve places on the map of a life. Print once, hang on the fridge. When a slice gets a real story, color it in.</p>
    ${compassWheelSvg()}
    <div class="two-col" style="margin-top:14px">
      <ul style="list-style:none;padding-left:0;font-size:10pt;margin:0">${left}</ul>
      <ul style="list-style:none;padding-left:0;font-size:10pt;margin:0">${right}</ul>
    </div>
    <p class="hint">The three truths live here too: I get to choose. If it feels good, we're on the path. I notice I can do more.</p>
    ${pageFooter(expeditionTitle)}`
}
