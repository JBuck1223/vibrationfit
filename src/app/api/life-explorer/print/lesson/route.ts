import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  brandLine,
  checklist,
  drawFrame,
  esc,
  pageFooter,
  printShell,
  writeLines,
} from '@/lib/life-explorer/print/layout'
import type { LessonPayload } from '@/lib/life-explorer/types'

export const dynamic = 'force-dynamic'

// GET /api/life-explorer/print/lesson?id= — the per-lesson recording sheet.
// Exists only when the lesson's hands-on activity needs one; the lesson
// page shows the print button conditionally.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: lesson } = await supabase
    .from('le_lessons')
    .select('title, payload, expedition:le_expeditions(title)')
    .eq('id', id)
    .maybeSingle()

  if (!lesson) {
    return new NextResponse('<h1>Lesson not found</h1>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const payload = lesson.payload as LessonPayload
  const p = payload.printable
  const expeditionTitle =
    (lesson.expedition as unknown as { title: string } | null)?.title ||
    payload.identity?.expedition ||
    ''

  if (!p) {
    return new NextResponse(
      '<h1>No printable for this lesson</h1><p>This lesson uses the weekly field-notes page instead.</p>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  const page = `
    ${brandLine('Lesson Sheet')}
    <p class="kicker">The big question</p>
    <h1>${esc(p.question)}</h1>
    <p class="lede">${esc(p.title)}</p>
    ${
      p.prediction_prompt
        ? `<h2>My prediction</h2><p class="hint">${esc(p.prediction_prompt)}</p>${writeLines(2)}`
        : ''
    }
    ${p.steps?.length ? `<h2>Steps</h2>${checklist(p.steps)}` : ''}
    ${
      p.chart
        ? `<h2>What happened</h2>
    <table class="grid">
      <thead><tr><th></th>${p.chart.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${p.chart.rows
        .map(
          (r) =>
            `<tr><td><strong>${esc(r)}</strong></td>${p.chart!.columns.map(() => '<td></td>').join('')}</tr>`
        )
        .join('')}</tbody>
    </table>`
        : ''
    }
    ${
      p.result_prompt
        ? `<h2>My discovery</h2><p class="hint">${esc(p.result_prompt)}</p>${writeLines(2)}`
        : ''
    }
    ${p.draw_prompt ? drawFrame(p.draw_prompt, 180) : ''}
    ${pageFooter(expeditionTitle)}`

  return new NextResponse(printShell({ title: `${lesson.title} — Lesson Sheet`, pages: [page] }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
