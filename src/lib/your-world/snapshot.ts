/**
 * Pure helpers for Your World snapshots: build one from the roster and
 * account, turn one back into roster and account writes, and diff two.
 */

import type { MemberRoster, RosterUpdate } from '@/lib/roster/types'
import type { WorldAddress, YourWorldSnapshot } from './types'

export interface AccountAddressRow {
  shipping_line1?: string | null
  shipping_line2?: string | null
  shipping_city?: string | null
  shipping_state?: string | null
  shipping_postal_code?: string | null
  shipping_country?: string | null
}

const str = (v: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t ? t : undefined
}

function cleanObject<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      const t = v.trim()
      if (t) out[k] = t
    } else if (v !== undefined && v !== null) {
      out[k] = v
    }
  }
  return out as T
}

export function emptySnapshot(): YourWorldSnapshot {
  return { partner: {}, children: [], pets: [], hobbies: [], address: {}, work: {}, money: {} }
}

export function addressFromAccount(account: AccountAddressRow | null | undefined): WorldAddress {
  if (!account) return {}
  return cleanObject({
    line1: str(account.shipping_line1),
    line2: str(account.shipping_line2),
    city: str(account.shipping_city),
    region: str(account.shipping_state),
    postal_code: str(account.shipping_postal_code),
    country: str(account.shipping_country),
  })
}

export function snapshotFromRoster(
  roster: MemberRoster | null,
  account: AccountAddressRow | null,
): YourWorldSnapshot {
  const address = addressFromAccount(account)
  if (!address.city && str(roster?.place?.city)) address.city = roster!.place!.city
  if (!address.region && str(roster?.place?.region)) address.region = roster!.place!.region
  return normalizeSnapshot({
    say_as: roster?.say_as ?? undefined,
    gender: roster?.gender ?? undefined,
    ethnicity: roster?.ethnicity ?? undefined,
    partner: roster?.partner || {},
    children: roster?.children || [],
    pets: roster?.pets || [],
    social_preference: roster?.social_preference ?? undefined,
    hobbies: roster?.hobbies || [],
    address,
    living_situation: roster?.place?.living_situation,
    time_at_location: roster?.place?.time_at_location,
    work: roster?.work || {},
    money: roster?.money || {},
  })
}

/** Trims strings, drops empty rows, and fills missing sections. */
export function normalizeSnapshot(input: Partial<YourWorldSnapshot> | null | undefined): YourWorldSnapshot {
  const s = input || {}
  const named = <T extends { name?: string }>(rows: T[] | undefined) =>
    (Array.isArray(rows) ? rows : []).map((r) => cleanObject(r)).filter((r) => str(r.name))
  return {
    ...cleanObject({
      say_as: str(s.say_as),
      gender: str(s.gender),
      ethnicity: str(s.ethnicity),
      social_preference: str(s.social_preference),
      living_situation: str(s.living_situation),
      time_at_location: str(s.time_at_location),
    }),
    partner: cleanObject(s.partner || {}),
    children: named(s.children),
    pets: named(s.pets),
    hobbies: (Array.isArray(s.hobbies) ? s.hobbies : []).map((h) => String(h).trim()).filter(Boolean),
    address: cleanObject(s.address || {}),
    work: cleanObject(s.work || {}),
    money: cleanObject(s.money || {}),
  }
}

/** One-line work description for older readers that only know `vocation`. */
export function vocationLine(snapshot: YourWorldSnapshot): string | null {
  const { occupation, company, employment_type } = snapshot.work
  if (occupation && company) return `${occupation} at ${company}`
  return occupation || employment_type || null
}

/**
 * Roster columns the active snapshot owns. People, named things, tender
 * ground, and days that matter come from conversations and are left alone.
 */
export function rosterWriteFromSnapshot(
  snapshot: YourWorldSnapshot,
  existing: MemberRoster | null,
): RosterUpdate {
  return {
    say_as: snapshot.say_as ?? null,
    gender: snapshot.gender ?? null,
    ethnicity: snapshot.ethnicity ?? null,
    social_preference: snapshot.social_preference ?? null,
    hobbies: snapshot.hobbies,
    partner: Object.keys(snapshot.partner).length > 0 ? snapshot.partner : null,
    children: snapshot.children,
    pets: snapshot.pets,
    place: cleanObject({
      city: snapshot.address.city,
      region: snapshot.address.region,
      living_situation: snapshot.living_situation,
      time_at_location: snapshot.time_at_location,
    }),
    work: snapshot.work,
    money: snapshot.money,
    vocation: vocationLine(snapshot) ?? existing?.vocation ?? null,
  }
}

export function accountWriteFromSnapshot(snapshot: YourWorldSnapshot): Required<AccountAddressRow> {
  const a = snapshot.address
  return {
    shipping_line1: a.line1 ?? null,
    shipping_line2: a.line2 ?? null,
    shipping_city: a.city ?? null,
    shipping_state: a.region ?? null,
    shipping_postal_code: a.postal_code ?? null,
    shipping_country: a.country ?? null,
  }
}

// ---------------------------------------------------------------------------
// Diff (draft highlighting and Compare)
// ---------------------------------------------------------------------------

export interface WorldFieldChange {
  path: string
  label: string
  before: string
  after: string
}

const FIELD_LABELS: Array<[string, string]> = [
  ['say_as', 'How to say your name'],
  ['gender', 'Gender'],
  ['ethnicity', 'Ethnicity'],
  ['partner.status', 'Relationship status'],
  ['partner.length', 'Relationship length'],
  ['partner.name', 'Partner name'],
  ['partner.say_as', 'How to say partner name'],
  ['children', 'Children'],
  ['pets', 'Pets'],
  ['social_preference', 'Social preference'],
  ['hobbies', 'Hobbies'],
  ['address.line1', 'Street'],
  ['address.line2', 'Apartment or unit'],
  ['address.city', 'City'],
  ['address.region', 'State or region'],
  ['address.postal_code', 'Postal code'],
  ['address.country', 'Country'],
  ['living_situation', 'Own or rent'],
  ['time_at_location', 'Time there'],
  ['work.employment_type', 'Employment type'],
  ['work.occupation', 'Occupation'],
  ['work.company', 'Company'],
  ['work.time_in_role', 'Time in role'],
  ['work.education', 'Education'],
  ['work.education_description', 'Education details'],
  ['money.currency', 'Currency'],
  ['money.household_income', 'Household income'],
  ['money.savings_retirement', 'Savings and retirement'],
  ['money.assets_equity', 'Assets and equity'],
  ['money.consumer_debt', 'Consumer debt'],
]

function readPath(snapshot: YourWorldSnapshot, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, snapshot)
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item
        const row = item as Record<string, string | undefined>
        return [row.name, row.say_as && `(${row.say_as})`, row.kind, row.birthday].filter(Boolean).join(' ')
      })
      .join(', ')
  }
  return typeof value === 'string' ? value : ''
}

export function diffSnapshots(before: YourWorldSnapshot | null, after: YourWorldSnapshot): WorldFieldChange[] {
  const base = before ? normalizeSnapshot(before) : emptySnapshot()
  const next = normalizeSnapshot(after)
  const changes: WorldFieldChange[] = []
  for (const [path, label] of FIELD_LABELS) {
    const b = readPath(base, path)
    const a = readPath(next, path)
    if (b !== a) changes.push({ path, label, before: b, after: a })
  }
  return changes
}

const ROW_FIELDS = {
  children: ['name', 'say_as', 'birthday'],
  pets: ['name', 'say_as', 'kind'],
} as const

/** Paths of changed fields, with list rows split out (`children.0.name`) so one edit highlights one field. */
export function changedFieldPaths(before: YourWorldSnapshot | null, after: YourWorldSnapshot): Set<string> {
  const base = before ? normalizeSnapshot(before) : emptySnapshot()
  const next = normalizeSnapshot(after)
  const out = new Set<string>()
  for (const [path] of FIELD_LABELS) {
    if (path in ROW_FIELDS) continue
    if (readPath(base, path) !== readPath(next, path)) out.add(path)
  }
  for (const [list, fields] of Object.entries(ROW_FIELDS) as Array<[keyof typeof ROW_FIELDS, readonly string[]]>) {
    const was = (base[list] || []) as Array<Record<string, string | undefined>>
    const now = (after[list] || []) as Array<Record<string, string | undefined>>
    const filled = now.filter((row) => fields.some((f) => (row[f] || '').trim()))
    if (filled.length < was.length) out.add(list)
    now.forEach((row, i) => {
      for (const f of fields) {
        if ((row[f] || '').trim() !== (was[i]?.[f] || '').trim()) out.add(`${list}.${i}.${f}`)
      }
    })
  }
  return out
}
