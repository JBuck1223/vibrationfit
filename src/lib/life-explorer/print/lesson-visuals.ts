/**
 * Per-lesson teaching visuals — HTML/SVG used on screen and on paper.
 * Expedition kit stays expedition-wide. These pages belong to today.
 */

import type { HandsOnActivity, LessonPayload, LessonPrintable, LessonVisual } from '../types'
import {
  brandLine,
  checklist,
  cutCards,
  drawFrame,
  esc,
  pageFooter,
  writeLines,
} from './layout'

export function lessonHasPages(payload: LessonPayload): boolean {
  return (payload.visuals || []).length > 0 || Boolean(payload.printable)
}

export function visualPage(visual: LessonVisual, expeditionTitle: string): string {
  return `
    ${brandLine('Today’s pages')}
    <p class="kicker">${esc(visual.title)}</p>
    <h1>${esc(visual.title)}</h1>
    <p class="lede">${esc(visual.kid_do)}</p>
    ${visualBody(visual)}
    ${pageFooter(expeditionTitle)}`
}

export function recordingPage(sheet: LessonPrintable, expeditionTitle: string): string {
  return `
    ${brandLine('Lesson Sheet')}
    <p class="kicker">The big question</p>
    <h1>${esc(sheet.question)}</h1>
    <p class="lede">${esc(sheet.title)}</p>
    ${
      sheet.prediction_prompt
        ? `<h2>My prediction</h2><p class="hint">${esc(sheet.prediction_prompt)}</p>${writeLines(2)}`
        : ''
    }
    ${sheet.steps?.length ? `<h2>Steps</h2>${checklist(sheet.steps)}` : ''}
    ${sheet.chart ? chartTable(sheet.chart) : ''}
    ${
      sheet.result_prompt
        ? `<h2>My discovery</h2><p class="hint">${esc(sheet.result_prompt)}</p>${writeLines(2)}`
        : ''
    }
    ${sheet.draw_prompt ? drawFrame(sheet.draw_prompt, 180) : ''}
    ${pageFooter(expeditionTitle)}`
}

export function fallbackTodayPage(
  payload: LessonPayload,
  expeditionTitle: string,
  title: string
): string {
  const question = payload.identity?.essential_question || title
  const artifact = payload.child_output?.description || 'Draw what you found today.'
  const hands = payload.hands_on
  const steps =
    hands && typeof hands === 'object' ? (hands as HandsOnActivity).steps || [] : []
  return `
    ${brandLine('Today’s pages')}
    <p class="kicker">${esc(title)}</p>
    <h1>${esc(question)}</h1>
    ${steps.length ? `<h2>Do this</h2>${checklist(steps)}` : ''}
    ${drawFrame(artifact, 280)}
    ${pageFooter(expeditionTitle)}`
}

export function visualBody(visual: LessonVisual): string {
  switch (visual.kind) {
    case 'sort_mat':
      return binRow(visual.columns || ['A', 'B'])
    case 'compare':
      return binRow(visual.columns || ['Then', 'Now'], 220)
    case 'map':
      return visual.map === 'florida_home_water' ? floridaHomeWaterMap() : drawFrame('Draw the map', 360)
    case 'clocks':
      return clockRow(visual.times || ['3:00', '3:30'])
    case 'cards':
      return cutCards((visual.cards || []).map((c) => ({ word: c.word, sub: c.hint })))
    case 'tally':
      return tallyTable(visual.rows || ['Find 1', 'Find 2', 'Find 3'])
    case 'draw':
      return drawFrame(visual.draw_prompt || visual.kid_do, 280)
    case 'passage':
      return `<div style="border:1.5px solid #1a1a1a;border-radius:8px;padding:16px 18px;margin:12px 0;font-size:16pt;line-height:1.8">${(
        visual.lines || []
      )
        .map((line) => `<p style="margin:0 0 8px">${esc(line)}</p>`)
        .join('')}</div>`
    case 'place_value':
      return placeValueMat(visual.tens ?? 0, visual.ones ?? 0)
    case 'exercise':
      return exerciseBody(visual.exercise, visual.kid_do)
    default:
      return drawFrame(visual.kid_do, 240)
  }
}

function exerciseBody(
  exercise: import('../types').LessonExercise | undefined,
  fallback: string
): string {
  if (!exercise) return drawFrame(fallback, 240)
  const prompt = exercise.prompt
    ? `<p class="hint" style="margin:0 0 10px">${esc(exercise.prompt)}</p>`
    : ''
  switch (exercise.layout) {
    case 'number_grid': {
      const from = exercise.from ?? 1
      const to = exercise.to ?? 10
      const cols = exercise.columns ?? 10
      const cells: string[] = []
      for (let n = from; n <= to; n++) {
        cells.push(
          `<div style="border:1.5px solid #1a1a1a;border-radius:6px;min-height:42px;display:flex;align-items:center;justify-content:center;font-size:16pt;font-weight:700">${n <= (exercise.given?.[n - from] ?? -1) ? n : '&nbsp;'}</div>`
        )
      }
      // Empty boxes to write the numbers — if `given` is omitted, all boxes are blank with a faint guide.
      const boxes: string[] = []
      for (let n = from; n <= to; n++) {
        boxes.push(
          `<div style="border:1.5px solid #1a1a1a;border-radius:6px;min-height:44px"></div>`
        )
      }
      return `${prompt}<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;margin:12px 0">${boxes.join('')}</div>
        <p class="hint">Write ${from}–${to}. One number in each box.</p>`
    }
    case 'facts':
      return `${prompt}<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0">${(exercise.facts || [])
        .map(
          (f) =>
            `<div style="border:1.5px solid #1a1a1a;border-radius:8px;padding:12px 14px;font-size:16pt;font-weight:700;letter-spacing:0.04em">${esc(f)}</div>`
        )
        .join('')}</div>`
    case 'blank_clocks':
      return `${prompt}<div style="display:flex;justify-content:space-around;gap:16px;flex-wrap:wrap;margin:16px 0">${(exercise.times || ['3:00', '3:30'])
        .map(
          (t) => `<div style="text-align:center">
            ${blankClock()}
            <p style="margin:8px 0 4px;font-weight:700">${esc(t)}</p>
            <div style="border:1px solid #cfcfcf;border-radius:6px;height:36px;width:140px;margin:0 auto"></div>
            <p class="hint" style="margin:4px 0 0">Write the digital time</p>
          </div>`
        )
        .join('')}</div>`
    case 'lines':
      return `${prompt}${writeLines(exercise.line_count ?? 4)}`
    case 'compare':
      return `${prompt}<table class="grid">
        <thead><tr><th>A</th><th>&gt;  =  &lt;</th><th>B</th></tr></thead>
        <tbody>${(exercise.pairs || [{ left: '', right: '' }])
          .map(
            (p) =>
              `<tr><td style="width:32%;font-size:16pt;font-weight:700">${esc(p.left)}</td><td></td><td style="width:32%;font-size:16pt;font-weight:700">${esc(p.right)}</td></tr>`
          )
          .join('')}</tbody>
      </table>`
    case 'skip_count': {
      const by = exercise.skip_by ?? 2
      const to = exercise.skip_to ?? 20
      const cells: string[] = []
      for (let n = by; n <= to; n += by) {
        cells.push(
          `<div style="border:1.5px solid #1a1a1a;border-radius:6px;min-height:44px;display:flex;align-items:flex-end;justify-content:center;padding:6px;color:#bbb;font-size:9pt">${n === by ? n : ''}</div>`
        )
      }
      return `${prompt}<p class="hint">Skip-count by ${by} to ${to}. First one is done.</p>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:12px 0">${cells.join('')}</div>`
    }
    case 'place_value_rows': {
      const nums = exercise.given || [16, 24, 30, 36]
      return `${prompt}<table class="grid">
        <thead><tr><th>Number</th><th>Tens</th><th>Ones</th><th>__ tens __ ones = __</th></tr></thead>
        <tbody>${nums
          .map((n) => `<tr><td style="font-weight:700;font-size:14pt">${n}</td><td></td><td></td><td></td></tr>`)
          .join('')}
        <tr><td>Yours</td><td></td><td></td><td></td></tr>
        </tbody>
      </table>`
    }
    case 'port_starboard':
      return `${prompt}<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:14px 0">
        <div style="border:1.5px solid #1a1a1a;border-radius:8px;min-height:160px;padding:12px;text-align:center">
          <p style="font-weight:700;margin:0 0 8px">${esc(exercise.left_label || 'PORT — left')}</p>
          <p class="hint">Circle the port side of the boat. Write L.</p>
        </div>
        <div style="border:1.5px solid #1a1a1a;border-radius:8px;min-height:160px;padding:12px;text-align:center">
          <p style="font-weight:700;margin:0 0 8px">${esc(exercise.right_label || 'STARBOARD — right')}</p>
          <p class="hint">Circle the starboard side. Write R.</p>
        </div>
      </div>
      <p class="hint">Count the collection. Write how many:</p>
      <div style="border:1.5px solid #1a1a1a;border-radius:8px;height:56px;width:120px;margin:8px 0"></div>`
    case 'coins':
      return `${prompt}<table class="grid">
        <thead><tr><th>Coin</th><th>Name</th><th>¢</th></tr></thead>
        <tbody>${(exercise.coins || [
          { name: 'penny', cents: '1¢' },
          { name: 'nickel', cents: '5¢' },
          { name: 'dime', cents: '10¢' },
          { name: 'quarter', cents: '25¢' },
        ])
          .map(
            (c) =>
              `<tr><td style="height:48px"></td><td>${esc(c.name)}</td><td>${esc(c.cents)}</td></tr>`
          )
          .join('')}</tbody>
      </table>
      <p class="hint">Draw each coin in the empty box. Match it to a real coin on the table.</p>`
    case 'word_sort':
      return `${prompt}${binRow(exercise.bins || ['Short', 'Long'], 140)}
        <p class="hint">Write the words in the boxes: ${(exercise.words || []).map(esc).join(', ')}</p>`
    case 'spell':
      return `${prompt}${(exercise.spell || [])
        .map(
          (w) =>
            `<p style="margin:14px 0 4px;font-weight:700">Spell: ${esc(w)}</p>${writeLines(1)}`
        )
        .join('')}`
    case 'retell':
      return `${prompt}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:14px 0">${(
        exercise.boxes || ['Beginning', 'Middle', 'End']
      )
        .map(
          (b) =>
            `<div style="border:1.5px solid #1a1a1a;border-radius:8px;min-height:160px;padding:10px">
              <p style="margin:0;font-weight:700;text-align:center;border-bottom:1px solid #ccc;padding-bottom:6px">${esc(b)}</p>
            </div>`
        )
        .join('')}</div>${writeLines(exercise.line_count ?? 2)}`
    default:
      return drawFrame(fallback, 240)
  }
}

function blankClock(): string {
  const cx = 80
  const cy = 80
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 - 90) * Math.PI) / 180
    const x1 = cx + Math.cos(a) * 62
    const y1 = cy + Math.sin(a) * 62
    const x2 = cx + Math.cos(a) * 70
    const y2 = cy + Math.sin(a) * 70
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#1a1a1a" stroke-width="${i % 3 === 0 ? 2.5 : 1.2}"/>`
  }).join('')
  return `<svg viewBox="0 0 160 160" width="160" height="160" aria-label="blank clock">
    <circle cx="${cx}" cy="${cy}" r="74" fill="none" stroke="#1a1a1a" stroke-width="2.5"/>
    ${ticks}
    <circle cx="${cx}" cy="${cy}" r="3" fill="#1a1a1a"/>
  </svg>`
}

function chartTable(chart: { rows: string[]; columns: string[] }): string {
  return `<h2>What happened</h2>
    <table class="grid">
      <thead><tr><th></th>${chart.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${chart.rows
        .map(
          (r) =>
            `<tr><td><strong>${esc(r)}</strong></td>${chart.columns.map(() => '<td></td>').join('')}</tr>`
        )
        .join('')}</tbody>
    </table>`
}

function binRow(labels: string[], height = 180): string {
  const cols = labels.length
  return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px;margin:14px 0">
    ${labels
      .map(
        (label) => `<div style="border:1.5px solid #1a1a1a;border-radius:8px;min-height:${height}px;padding:10px">
        <p style="margin:0;text-align:center;font-weight:700;font-size:12pt;border-bottom:1px solid #ccc;padding-bottom:6px">${esc(label)}</p>
      </div>`
      )
      .join('')}
  </div>`
}

function tallyTable(rows: string[]): string {
  return `<table class="grid">
    <thead><tr><th>What we found</th><th>Tally</th><th>How many</th></tr></thead>
    <tbody>${rows
      .map((r) => `<tr><td>${esc(r)}</td><td></td><td></td></tr>`)
      .join('')}</tbody>
  </table>`
}

function parseClock(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map((n) => Number(n) || 0)
  return { hours: h, minutes: m }
}

function analogClock(time: string): string {
  const { hours, minutes } = parseClock(time)
  const cx = 80
  const cy = 80
  const minuteAngle = minutes * 6 - 90
  const hourAngle = (hours % 12) * 30 + minutes * 0.5 - 90
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 - 90) * Math.PI) / 180
    const x1 = cx + Math.cos(a) * 62
    const y1 = cy + Math.sin(a) * 62
    const x2 = cx + Math.cos(a) * 70
    const y2 = cy + Math.sin(a) * 70
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#1a1a1a" stroke-width="${i % 3 === 0 ? 2.5 : 1.2}"/>`
  }).join('')
  const hand = (angle: number, length: number, width: number) => {
    const rad = (angle * Math.PI) / 180
    const x = cx + Math.cos(rad) * length
    const y = cy + Math.sin(rad) * length
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#1a1a1a" stroke-width="${width}" stroke-linecap="round"/>`
  }
  return `<svg viewBox="0 0 160 160" width="160" height="160" aria-label="${esc(time)}">
    <circle cx="${cx}" cy="${cy}" r="74" fill="none" stroke="#1a1a1a" stroke-width="2.5"/>
    ${ticks}
    ${hand(hourAngle, 38, 4)}
    ${hand(minuteAngle, 54, 2.5)}
    <circle cx="${cx}" cy="${cy}" r="4" fill="#1a1a1a"/>
  </svg>
  <p style="text-align:center;margin:4px 0 0;font-weight:700;letter-spacing:0.06em">${esc(time)}</p>`
}

function clockRow(times: string[]): string {
  return `<div style="display:flex;justify-content:space-around;gap:16px;flex-wrap:wrap;margin:16px 0">
    ${times
      .map(
        (t) => `<div style="text-align:center">
        ${analogClock(t)}
        <div style="border:1px solid #cfcfcf;border-radius:6px;height:90px;width:160px;margin:10px auto 0"></div>
        <p class="hint" style="margin:6px 0 0">Draw this time</p>
      </div>`
      )
      .join('')}
  </div>`
}

function placeValueMat(tens: number, ones: number): string {
  const cups = [0, 1, 2, 3].map((i) => {
    const filled = i < tens
    return `<div style="border:1.5px solid #1a1a1a;border-radius:0 0 40px 40px;height:90px;width:70px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px;font-size:9pt">${filled ? '10' : ''}</div>`
  })
  return `<div style="display:flex;gap:28px;align-items:flex-end;margin:16px 0">
    <div>
      <p style="font-weight:700;margin:0 0 8px">Tens cups</p>
      <div style="display:flex;gap:8px">${cups.join('')}</div>
    </div>
    <div>
      <p style="font-weight:700;margin:0 0 8px">Ones</p>
      <div style="border:1.5px solid #1a1a1a;border-radius:8px;min-width:120px;height:90px;padding:8px">${ones ? esc(String(ones)) : ''}</div>
    </div>
  </div>
  <p class="hint">Fill the cups for your number. Say: “__ tens and __ ones.”</p>`
}

function floridaHomeWaterMap(): string {
  return `<svg viewBox="0 0 420 460" width="100%" style="max-height:420px" aria-label="Florida, Gulf west, Atlantic east">
    <text x="40" y="210" font-size="13" font-family="Poppins,sans-serif" fill="#1a1a1a">GULF OF MEXICO</text>
    <text x="40" y="228" font-size="11" font-family="Poppins,sans-serif" fill="#555">west — our water</text>
    <text x="292" y="210" font-size="13" font-family="Poppins,sans-serif" fill="#1a1a1a">ATLANTIC</text>
    <text x="292" y="228" font-size="11" font-family="Poppins,sans-serif" fill="#555">east — other ocean</text>
    <path d="M 150 70 L 250 78 L 268 118 L 258 210 L 230 330 L 198 385 L 170 360 L 178 250 L 130 150 L 88 118 L 78 88 L 118 78 Z"
      fill="none" stroke="#1a1a1a" stroke-width="2.4" stroke-linejoin="round"/>
    <circle cx="168" cy="248" r="7" fill="none" stroke="#1a1a1a" stroke-width="2.2"/>
    <text x="178" y="252" font-size="12" font-family="Poppins,sans-serif" font-weight="700" fill="#1a1a1a">HOME</text>
    <text x="160" y="430" font-size="11" font-family="Poppins,sans-serif" fill="#555">Florida — finger west to the Gulf, east to the Atlantic</text>
  </svg>
  <p class="hint">Trace from the door west into the Gulf. Then east across the state to the Atlantic.</p>`
}
