import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveStudent } from '@/lib/life-explorer/context'
import { brandLine, esc, pageFooter, printShell, writeLines } from '@/lib/life-explorer/print/layout'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const student = await getActiveStudent(
    supabase,
    request.nextUrl.searchParams.get('student_id') || undefined
  )
  if (!student) return NextResponse.json({ error: 'No student' }, { status: 404 })

  const vision = (student.life_i_choose || '').trim()
  const paragraphs = vision
    ? vision.split(/\n+/).filter(Boolean)
    : ['(Write the Life I Choose. Then print this book so it can be held.)']

  const pages = [
    `
    ${brandLine('Life I Choose')}
    <p class="kicker">The life I choose</p>
    <h1>${esc(student.name)}</h1>
    <p class="lede">Grade ${esc(student.grade_level)}${student.current_age ? ` · Age ${student.current_age}` : ''}</p>
    <hr class="rule" />
    ${paragraphs.map((p) => `<p class="lede" style="margin:14px 0;font-size:14pt;line-height:1.55">${esc(p)}</p>`).join('')}
    ${pageFooter('Life I Choose')}
    `,
    `
    ${brandLine('Life I Choose')}
    <p class="kicker">Draw this life</p>
    <h1>This is me living it</h1>
    <p class="hint">Draw a picture of this life. There is no wrong picture.</p>
    <div class="frame" style="height:360px"><span class="frame-label">My picture</span></div>
    <h2>I want to remember</h2>
    ${writeLines(4)}
    ${pageFooter('Life I Choose')}
    `,
  ]

  const html = printShell({
    title: `The Life I Choose — ${student.name}`,
    pages,
  })

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
