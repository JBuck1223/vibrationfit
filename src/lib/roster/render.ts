/**
 * Prompt renderers for member_roster and member_persona, plus the
 * upcoming-dates helper (birthdays / anniversaries within a window, with
 * celebrate-vs-gentle weight).
 */

import type {
  MemberPersona,
  MemberRoster,
  PersonaItem,
} from './types'

const clean = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------

export function renderRosterForPrompt(roster: MemberRoster | null): string {
  if (!roster) return ''
  const lines: string[] = []

  if (roster.partner?.name) {
    const details: string[] = []
    if (clean(roster.partner.birthday)) details.push(`birthday ${roster.partner.birthday}`)
    if (clean(roster.partner.married_on)) details.push(`married ${roster.partner.married_on}`)
    lines.push(`- Partner: ${roster.partner.name}${details.length ? ` (${details.join('; ')})` : ''}`)
  }

  const children = (roster.children || []).filter((c) => clean(c.name))
  if (children.length > 0) {
    lines.push(
      `- Children: ${children
        .map((c) => `${c.name}${clean(c.birthday) ? ` (born ${c.birthday})` : ''}`)
        .join(', ')}`,
    )
  }

  const pets = (roster.pets || []).filter((p) => clean(p.name))
  if (pets.length > 0) {
    lines.push(
      `- Pets: ${pets
        .map((p) => {
          const details = [clean(p.kind), clean(p.age) ? `${p.age}` : ''].filter(Boolean).join(', ')
          return `${p.name}${details ? ` (${details})` : ''}`
        })
        .join('; ')}`,
    )
  }

  const people = (roster.people || []).filter((p) => clean(p.name))
  if (people.length > 0) {
    lines.push(
      `- Important people: ${people
        .map((p) => {
          const details = [
            clean(p.role),
            clean(p.birthday) ? `birthday ${p.birthday}` : '',
            p.deceased ? 'deceased' : '',
          ]
            .filter(Boolean)
            .join(', ')
          return `${p.name}${details ? ` (${details})` : ''}`
        })
        .join('; ')}`,
    )
  }

  const placeParts = [clean(roster.place?.city), clean(roster.place?.region)].filter(Boolean)
  if (placeParts.length > 0) lines.push(`- Place: ${placeParts.join(', ')}`)
  if (clean(roster.vocation)) lines.push(`- Vocation: ${roster.vocation}`)
  if (clean(roster.pronouns)) lines.push(`- Pronouns: ${roster.pronouns}`)

  const things = (roster.named_things || []).filter((n) => clean(n.name))
  if (things.length > 0) {
    lines.push(
      `- Named things: ${things
        .map((n) => `"${n.name}"${clean(n.what) ? ` (${n.what})` : ''}`)
        .join('; ')}`,
    )
  }

  const days = (roster.days_that_matter || []).filter((d) => clean(d.what))
  if (days.length > 0) {
    lines.push(
      `- Days that matter: ${days
        .map((d) => `${clean(d.date) ? `${d.date} — ` : ''}${d.what}${d.weight === 'gentle' ? ' (approach gently)' : ''}`)
        .join('; ')}`,
    )
  }

  const tender = (roster.tender_ground || []).filter((t) => clean(t.who) || clean(t.note))
  if (tender.length > 0) {
    lines.push(
      `- HANDLE WITH CARE (losses and tender ground — never bring up casually, never forget): ${tender
        .map((t) => {
          const parts = [clean(t.who), clean(t.note), clean(t.date)].filter(Boolean)
          return parts.join(' — ')
        })
        .join('; ')}`,
    )
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Persona
// ---------------------------------------------------------------------------

function renderItems(items: PersonaItem[] | undefined): string {
  const usable = (items || []).filter((i) => clean(i.value))
  if (usable.length === 0) return ''
  return usable
    .map((i) => (i.source === 'inferred' ? `${i.value} [hypothesis]` : i.value))
    .join('; ')
}

function renderScalar(item: PersonaItem | undefined): string {
  if (!clean(item?.value)) return ''
  return item!.source === 'inferred' ? `${item!.value} [hypothesis]` : item!.value
}

const PERSONA_LABELS: Array<{
  section: 'self' | 'season' | 'desire' | 'relating'
  key: string
  label: string
  scalar?: boolean
}> = [
  { section: 'self', key: 'identity_language', label: 'Words they use about themselves' },
  { section: 'self', key: 'core_values', label: 'Core values' },
  { section: 'self', key: 'joy_sources', label: 'What brings them joy' },
  { section: 'self', key: 'hobbies', label: 'Hobbies and interests' },
  { section: 'self', key: 'strengths', label: 'Strengths' },
  { section: 'self', key: 'important_roles', label: 'Roles that matter to them' },
  { section: 'self', key: 'what_matters_most', label: 'What matters most' },
  { section: 'self', key: 'feels_most_like_me', label: 'When they feel most like themselves' },
  { section: 'self', key: 'non_negotiables', label: 'What they never want success to cost' },
  { section: 'self', key: 'formative_stories', label: 'Formative stories' },
  { section: 'season', key: 'season_name', label: 'This season, in their words', scalar: true },
  { section: 'season', key: 'what_is_working', label: 'What is working' },
  { section: 'season', key: 'current_tensions', label: 'Current tensions' },
  { section: 'season', key: 'ready_for_more', label: 'Ready for more of' },
  { section: 'season', key: 'ready_to_release', label: 'Ready to release' },
  { section: 'desire', key: 'deferred_dreams', label: 'Deferred dreams' },
  { section: 'desire', key: 'secret_wants', label: 'Quiet wants' },
  { section: 'desire', key: 'desired_experiences', label: 'Experiences they want' },
  { section: 'desire', key: 'desired_identity', label: 'Who they want to become' },
  { section: 'desire', key: 'freedom_means', label: 'What freedom means to them', scalar: true },
  { section: 'desire', key: 'enough_means', label: 'What enough means to them', scalar: true },
  { section: 'desire', key: 'success_means', label: 'What success means to them', scalar: true },
  { section: 'relating', key: 'coaching_style', label: 'How they want to be coached', scalar: true },
  { section: 'relating', key: 'challenge_level', label: 'How much challenge they want', scalar: true },
  { section: 'relating', key: 'processing_style', label: 'How they process', scalar: true },
  { section: 'relating', key: 'support_preferences', label: 'How to support them' },
  { section: 'relating', key: 'meaning_frame', label: 'How they think life works', scalar: true },
  { section: 'relating', key: 'preferred_spiritual_language', label: 'Their spiritual vocabulary (mirror it)' },
  { section: 'relating', key: 'language_to_avoid', label: 'Language to avoid' },
]

/**
 * Renders the persona for prompts. Items marked [hypothesis] are inferred —
 * every consuming prompt must treat those as working hypotheses that shape
 * questions and framing, never as assertions to the member.
 */
export function renderPersonaForPrompt(persona: MemberPersona | null): string {
  if (!persona) return ''
  const lines: string[] = []
  for (const { section, key, label, scalar } of PERSONA_LABELS) {
    const sectionData = persona[section] as Record<string, PersonaItem | PersonaItem[] | undefined>
    const raw = sectionData?.[key]
    const rendered = scalar
      ? renderScalar(raw as PersonaItem | undefined)
      : renderItems(raw as PersonaItem[] | undefined)
    if (rendered) lines.push(`- ${label}: ${rendered}`)
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Upcoming dates
// ---------------------------------------------------------------------------

interface UpcomingDate {
  label: string
  date: string
  weight: 'celebrate' | 'gentle'
  daysAway: number
}

/** Parses month/day from a partial date string; null when only a year. */
function monthDay(dateStr: string | undefined): { month: number; day: number } | null {
  const m = clean(dateStr).match(/^\d{4}-(\d{2})(?:-(\d{2}))?/)
  if (!m) return null
  const month = Number(m[1])
  const day = m[2] ? Number(m[2]) : 1
  if (!month || !day) return null
  return { month, day }
}

function daysUntil(month: number, day: number, now: Date): number {
  const year = now.getFullYear()
  let next = new Date(year, month - 1, day)
  const today = new Date(year, now.getMonth(), now.getDate())
  if (next < today) next = new Date(year + 1, month - 1, day)
  return Math.round((next.getTime() - today.getTime()) / 86_400_000)
}

/**
 * Recurring dates (birthdays, anniversary, days that matter) landing within
 * `windowDays`, so VIVA can celebrate — or tread gently — at the right time.
 */
export function upcomingRosterDates(
  roster: MemberRoster | null,
  now: Date = new Date(),
  windowDays = 14,
): UpcomingDate[] {
  if (!roster) return []
  const candidates: Array<{ label: string; date?: string; weight: 'celebrate' | 'gentle' }> = []

  if (roster.partner?.name) {
    candidates.push({ label: `${roster.partner.name}'s birthday`, date: roster.partner.birthday, weight: 'celebrate' })
    candidates.push({ label: `their wedding anniversary`, date: roster.partner.married_on, weight: 'celebrate' })
  }
  for (const c of roster.children || []) {
    if (clean(c.name)) candidates.push({ label: `${c.name}'s birthday`, date: c.birthday, weight: 'celebrate' })
  }
  for (const p of roster.people || []) {
    if (clean(p.name) && !p.deceased) {
      candidates.push({ label: `${p.name}'s birthday`, date: p.birthday, weight: 'celebrate' })
    }
  }
  for (const d of roster.days_that_matter || []) {
    if (clean(d.what)) candidates.push({ label: d.what!, date: d.date, weight: d.weight === 'gentle' ? 'gentle' : 'celebrate' })
  }
  for (const t of roster.tender_ground || []) {
    if (clean(t.date)) {
      candidates.push({ label: `a tender date${clean(t.who) ? ` (${t.who})` : ''}`, date: t.date, weight: 'gentle' })
    }
  }

  const out: UpcomingDate[] = []
  for (const c of candidates) {
    const md = monthDay(c.date)
    if (!md) continue
    const away = daysUntil(md.month, md.day, now)
    if (away <= windowDays) {
      out.push({ label: c.label, date: c.date!, weight: c.weight, daysAway: away })
    }
  }
  return out.sort((a, b) => a.daysAway - b.daysAway)
}

export function renderUpcomingDatesForPrompt(dates: UpcomingDate[]): string {
  if (dates.length === 0) return ''
  return dates
    .map((d) => {
      const when = d.daysAway === 0 ? 'TODAY' : d.daysAway === 1 ? 'tomorrow' : `in ${d.daysAway} days`
      const tone = d.weight === 'gentle' ? ' — approach gently, do not celebrate' : ''
      return `- ${d.label} is ${when}${tone}`
    })
    .join('\n')
}
