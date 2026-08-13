import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { progressTimeline, stateProfile } from '@/lib/life-explorer/state-standards'

export const dynamic = 'force-dynamic'

function esc(s: string | null | undefined): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return ''
  const date = new Date(d.length === 10 ? `${d}T12:00:00Z` : d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

// GET /api/life-explorer/reports/binder?section=binder|activity-log|reading-list|portfolio&from=YYYY-MM-DD&to=YYYY-MM-DD
// One-click compliance artifacts — all derived, never manually maintained.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = request.nextUrl.searchParams
  const section = params.get('section') || 'binder'
  const to = params.get('to') || new Date().toISOString().slice(0, 10)
  const from =
    params.get('from') ||
    new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10)

  let studentId = params.get('student_id')
  if (!studentId) {
    const { data: s } = await supabase
      .from('le_students')
      .select('id')
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    studentId = s?.id || null
  }
  if (!studentId) {
    return new NextResponse('<h1>No student found</h1>', {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const [{ data: student }, logs, evidence, skills, expeditions] = await Promise.all([
    supabase.from('le_students').select('*').eq('id', studentId).single(),
    supabase
      .from('le_activity_logs')
      .select('*, media:le_activity_media(*)')
      .eq('student_id', studentId)
      .gte('entry_date', from)
      .lte('entry_date', to)
      .order('entry_date', { ascending: true }),
    supabase
      .from('le_learning_evidence')
      .select('*')
      .eq('student_id', studentId)
      .gte('created_at', `${from}T00:00:00Z`)
      .lte('created_at', `${to}T23:59:59Z`)
      .order('created_at', { ascending: true }),
    supabase.from('le_skill_progress').select('*').eq('student_id', studentId),
    supabase
      .from('le_expeditions')
      .select('id, title, life_category, status, start_date')
      .eq('student_id', studentId),
  ])

  const profile = stateProfile(student?.state_code)
  const logEntries = logs.data || []
  const evidenceItems = evidence.data || []
  const timeline = progressTimeline(skills.data || [])

  const readingList = Array.from(
    new Set(logEntries.flatMap((l) => l.reading_materials || []))
  ).sort()

  const totalMinutes = logEntries.reduce((s, l) => s + (l.duration_minutes || 0), 0)
  const daysLogged = new Set(logEntries.map((l) => l.entry_date)).size

  const activityLogHtml = `
    <section>
      <h2>Daily Activity Log</h2>
      <p class="meta">${daysLogged} days · ${fmtDuration(totalMinutes)} total · ${logEntries.length} entries · ${fmtDate(from)} to ${fmtDate(to)}</p>
      <table>
        <thead><tr><th>Date</th><th>Activity</th><th>Subjects</th><th>Time</th><th>Reading</th></tr></thead>
        <tbody>
          ${logEntries
            .map(
              (l) => `<tr>
                <td>${fmtDate(l.entry_date)}</td>
                <td><strong>${esc(l.title)}</strong>${l.description ? `<br><span class="desc">${esc(l.description)}</span>` : ''}</td>
                <td>${(l.subjects || []).map(esc).join(', ')}</td>
                <td>${fmtDuration(l.duration_minutes || 0)}</td>
                <td>${(l.reading_materials || []).map(esc).join('; ')}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </section>`

  const readingListHtml = `
    <section>
      <h2>Reading List</h2>
      <p class="meta">Titles read or read aloud, auto-built from lesson resources and the activity log.</p>
      <ol>${readingList.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
    </section>`

  const portfolioHtml = `
    <section>
      <h2>Work Samples & Learning Evidence</h2>
      <p class="meta">${evidenceItems.length} artifacts. Each captured at lesson close with the student's own explanation.</p>
      ${evidenceItems
        .map(
          (ev) => `<div class="artifact">
            <h3>${esc(ev.title)} <span class="tag">${esc(ev.type.replace(/_/g, ' '))}</span></h3>
            <p class="meta">${fmtDate(ev.created_at)}</p>
            ${ev.photo_url ? `<img src="${esc(ev.photo_url)}" alt="${esc(ev.title)}">` : ''}
            ${ev.student_explanation ? `<p><em>Student:</em> \u201C${esc(ev.student_explanation)}\u201D</p>` : ''}
            ${ev.parent_observation ? `<p><em>Parent observation:</em> ${esc(ev.parent_observation)}</p>` : ''}
            ${(ev.academic_tags || []).length ? `<p class="tags">${(ev.academic_tags || []).map((t: string) => `<span class="tag">${esc(t)}</span>`).join(' ')}</p>` : ''}
          </div>`
        )
        .join('')}
    </section>`

  const progressHtml = `
    <section>
      <h2>Sequentially Progressive Instruction</h2>
      <p class="meta">${esc(profile.required_approach)}</p>
      <table>
        <thead><tr><th>Date</th><th>Skill</th><th>Subject</th><th>Status</th></tr></thead>
        <tbody>
          ${timeline
            .map(
              (t) =>
                `<tr><td>${fmtDate(t.date)}</td><td>${esc(t.skill)}</td><td>${esc(t.subject)}</td><td>${esc(t.status.replace(/_/g, ' '))}</td></tr>`
            )
            .join('')}
        </tbody>
      </table>
    </section>`

  const coverHtml = `
    <section class="cover">
      <p class="brand">Vibration Fit Homeschool · Life Explorer</p>
      <h1>${section === 'binder' ? 'Annual Evaluation Binder' : section === 'activity-log' ? 'Daily Activity Log' : section === 'reading-list' ? 'Reading List' : 'Portfolio Packet'}</h1>
      <p class="student">${esc(student?.name)} · Grade ${esc(student?.grade_level)} · ${fmtDate(from)} — ${fmtDate(to)}</p>
      <p class="meta">${esc(profile.name)} · ${esc(profile.statute)}</p>
      <p class="meta">Expeditions: ${(expeditions.data || []).map((e) => `${esc(e.title)} (${esc(e.life_category)}, ${esc(e.status)})`).join(' · ') || 'none yet'}</p>
    </section>`

  let body = coverHtml
  if (section === 'activity-log') body += activityLogHtml
  else if (section === 'reading-list') body += readingListHtml
  else if (section === 'portfolio') body += portfolioHtml
  else body += activityLogHtml + readingListHtml + portfolioHtml + progressHtml

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Life Explorer — ${esc(student?.name)} — ${esc(section)}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; max-width: 800px; margin: 40px auto; padding: 0 24px; line-height: 1.55; }
  .brand { text-transform: uppercase; letter-spacing: 0.2em; font-size: 11px; color: #199D67; font-family: Helvetica, Arial, sans-serif; }
  h1 { font-size: 34px; margin: 8px 0 4px; }
  h2 { margin-top: 40px; border-bottom: 2px solid #199D67; padding-bottom: 6px; }
  h3 { margin-bottom: 2px; }
  .student { font-size: 18px; }
  .meta { color: #555; font-size: 13px; }
  .desc { color: #444; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f2f7f4; font-family: Helvetica, Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
  .artifact { border: 1px solid #ddd; border-radius: 8px; padding: 14px 16px; margin: 14px 0; page-break-inside: avoid; }
  .artifact img { max-width: 100%; max-height: 320px; border-radius: 6px; margin: 8px 0; }
  .tag { display: inline-block; background: #eef5f0; border: 1px solid #cfe3d6; border-radius: 999px; padding: 1px 8px; font-size: 11px; font-family: Helvetica, Arial, sans-serif; color: #1d6a47; }
  .cover { margin-bottom: 12px; }
  ol li { margin: 4px 0; }
  @media print {
    body { margin: 0; }
    section { page-break-after: auto; }
    .cover { page-break-after: always; }
  }
</style>
</head>
<body>${body}
<footer><p class="meta" style="margin-top:48px">Generated by Vibration Fit Homeschool — Life Explorer. Derived automatically from lesson records, evidence, and the daily activity log. Retain per ${esc(profile.name)} requirements (${profile.portfolio_retention_years} years).</p></footer>
</body>
</html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
