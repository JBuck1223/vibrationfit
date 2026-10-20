/**
 * "Their world" — the member's facts (Account plus Your World plus what VIVA
 * learned in conversation), rendered once and shared by every VIVA tool.
 *
 * Details make it feel like magic, so tools get the real names, places, and
 * work. Sensitive facts (money, age, gender, ethnicity, social style) shape
 * the writing and are never said out loud.
 */

import type { MemberRoster } from '@/lib/roster/types'

export interface MemberWorldFacts {
  firstName: string | null
  /** Whole years, from the account birthday. */
  age: number | null
  city: string | null
  region: string | null
  country: string | null
  roster: MemberRoster | null
}

const clean = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

function namedList(rows: Array<{ name?: string; kind?: string; age?: string; role?: string; deceased?: boolean }>) {
  return rows
    .filter((r) => clean(r.name))
    .map((r) => {
      const details = [clean(r.kind), clean(r.role), clean(r.age), r.deceased ? 'has passed' : '']
        .filter(Boolean)
        .join(', ')
      return `${r.name}${details ? ` (${details})` : ''}`
    })
    .join('; ')
}

/**
 * Plain fact lines. Birthdays are left out on purpose: tools never write
 * them as dates (the coach gets upcoming dates through its own block).
 */
export function renderMemberWorldFacts(world: MemberWorldFacts | null): string {
  if (!world) return ''
  const r = world.roster
  const lines: string[] = []

  if (world.firstName) lines.push(`- Name: ${world.firstName}`)
  if (world.age) lines.push(`- Age: ${world.age} [shape life stage only]`)
  if (clean(r?.gender) && r!.gender !== 'Prefer not to say') {
    lines.push(`- Gender: ${r!.gender} [word choice only]`)
  }
  if (clean(r?.pronouns)) lines.push(`- Pronouns: ${r!.pronouns}`)
  if (clean(r?.ethnicity) && r!.ethnicity !== 'Prefer not to say') {
    lines.push(`- Ethnicity: ${r!.ethnicity} [cultural context only]`)
  }

  const partner = r?.partner
  if (partner && (clean(partner.status) || clean(partner.name))) {
    const bits = [clean(partner.status), clean(partner.length) ? `${partner.length} together` : '']
      .filter(Boolean)
      .join(', ')
    lines.push(`- Partner: ${clean(partner.name) || 'unnamed'}${bits ? ` (${bits})` : ''}`)
  } else if (clean(partner?.status)) {
    lines.push(`- Relationship: ${partner!.status}`)
  }

  const children = namedList(r?.children || [])
  if (children) lines.push(`- Children: ${children}`)
  const pets = namedList(r?.pets || [])
  if (pets) lines.push(`- Pets: ${pets}`)
  const people = namedList(r?.people || [])
  if (people) lines.push(`- Important people: ${people}`)

  if (clean(r?.social_preference)) {
    lines.push(`- Social style: ${r!.social_preference} [shape Social scenes; never use the label]`)
  }
  const hobbies = (r?.hobbies || []).map(clean).filter(Boolean)
  if (hobbies.length) lines.push(`- Current hobbies: ${hobbies.join(', ')}`)

  const place = [world.city || clean(r?.place?.city), world.region || clean(r?.place?.region), world.country]
    .filter(Boolean)
    .join(', ')
  const home = [clean(r?.place?.living_situation), clean(r?.place?.time_at_location) ? `${r!.place!.time_at_location} there` : '']
    .filter((v) => v && v !== 'Prefer not to say')
    .join(', ')
  if (place || home) lines.push(`- Home: ${[place, home].filter(Boolean).join(' — ')}`)

  const w = r?.work || {}
  const work = [
    clean(w.employment_type),
    clean(w.occupation) && clean(w.company) ? `${w.occupation} at ${w.company}` : clean(w.occupation) || clean(w.company),
    clean(w.time_in_role) ? `${w.time_in_role} in the role` : '',
  ]
    .filter(Boolean)
    .join(', ')
  if (work) lines.push(`- Work: ${work}`)
  else if (clean(r?.vocation)) lines.push(`- Work: ${r!.vocation}`)
  const education = [clean(w.education), clean(w.education_description)]
    .filter((v) => v && v !== 'Prefer not to say')
    .join(' — ')
  if (education) lines.push(`- Education: ${education}`)

  const m = r?.money || {}
  const money = (
    [
      ['household income', m.household_income],
      ['savings and retirement', m.savings_retirement],
      ['assets and equity', m.assets_equity],
      ['consumer debt', m.consumer_debt],
    ] as const
  )
    .filter(([, v]) => clean(v) && v !== 'Prefer not to say')
    .map(([label, v]) => `${label} ${v}`)
  if (money.length) {
    lines.push(`- Money${clean(m.currency) ? ` (${m.currency})` : ''}: ${money.join('; ')} [scale only; never state]`)
  }

  const things = (r?.named_things || []).filter((n) => clean(n.name))
  if (things.length) {
    lines.push(`- Named things: ${things.map((n) => `"${n.name}"${clean(n.what) ? ` (${n.what})` : ''}`).join('; ')}`)
  }

  const tender = (r?.tender_ground || []).filter((t) => clean(t.who) || clean(t.note))
  if (tender.length) {
    lines.push(
      `- HANDLE WITH CARE (losses and tender ground — never bring up casually, never forget): ${tender
        .map((t) => [clean(t.who), clean(t.note)].filter(Boolean).join(' — '))
        .join('; ')}`,
    )
  }

  return lines.join('\n')
}

export const MEMBER_WORLD_RULES = `HOW TO USE THEIR WORLD
- Use a real detail (a name, a place, their work, a hobby) whenever it fits naturally. Specifics make it feel personal.
- Never state money brackets or amounts, their age, gender, ethnicity, or social style. Those only shape scale, life stage, word choice, and tone.
- Never write birthdays as dates.
- What the member wrote in this tool wins over these facts when they disagree.
- Never say how you know something. No "based on your profile" or "you mentioned in Your World".
- Do not invent people, pets, or places beyond what is listed.`

/** The full block for system prompts; empty string when nothing is known. */
export function buildMemberWorldBlock(world: MemberWorldFacts | null): string {
  const facts = renderMemberWorldFacts(world)
  if (!facts) return ''
  return `THEIR WORLD (facts about the member)\n${facts}\n\n${MEMBER_WORLD_RULES}`
}

/**
 * Life Vision writers get stricter guidance: the vision is in present tense
 * about the life they are creating, so facts set scale and cast, not plot.
 */
export const MEMBER_WORLD_VISION_RULES = `HOW TO USE THEIR WORLD IN THE VISION
- Use their name where a name belongs. Name their partner, children, and pets in the areas where those people live (Love, Family, Home, Fun, Travel).
- Home and work facts ground Home, Work, and Money in their real life.
- Hobbies can be named in Fun. Do not invent scenes around them that the member did not describe.
- Money brackets set the scale of Money, Stuff, Travel, and Home. Never write a bracket or an amount. If the member wrote their own big numbers, keep them.
- Age shapes life stage only and is never written. Gender guides word choice and is never stated. Ethnicity is cultural context only and is never stated. Social style shapes Social and the label is never written.
- Never write birthdays as dates.
- When an area's notes disagree with these facts, the notes win.`

export function buildMemberWorldVisionBlock(world: MemberWorldFacts | null): string {
  const facts = renderMemberWorldFacts(world)
  if (!facts) return ''
  return `THEIR WORLD (facts about the member)\n${facts}\n\n${MEMBER_WORLD_VISION_RULES}`
}
