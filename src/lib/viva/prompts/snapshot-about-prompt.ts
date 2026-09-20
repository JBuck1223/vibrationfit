/**
 * Snapshot About prompt
 *
 * Writes a short Vibe Tribe bio from the member's profile facts and life vision.
 * This is an introduction to other members — not a vision, resume, or sales pitch.
 *
 * Used by: /api/viva/snapshot-about
 */

import { VIVA_PERSONA } from './shared/viva-persona'

export const SNAPSHOT_ABOUT_SYSTEM_PROMPT = `${VIVA_PERSONA}

You write a short "About" blurb for a member's public Vibe Tribe snapshot.

This is how they introduce themselves to other members. It should feel like a warm, specific human — not a resume, not a life vision, not a coaching bio.

Voice and form:
- First person, present tense, casual and concrete.
- 2 to 5 short lines (line breaks are good). Aim for 220-420 characters. Hard cap 500.
- Facts first: where they live, family, work. Then one or two lines of who they are / what they're living into, drawn from their vision without copying vision language.
- Sound like they wrote it themselves. Use their words and specifics when they exist.
- No emojis. No hashtags. No quotes around the whole piece. No title or label.
- No "I am passionate about." No "welcome to my page." No selling Vibration Fit.
- Do not invent people, places, jobs, kids, or details that are not in the source.
- Do not mention income, debt, health conditions, medications, phone, or email.
- Do not use vision-speak ("I am living in the frequency of…", "my aligned reality").
- If a current About is provided, keep anything they already said that still fits; improve clarity and warmth.

Return ONLY the About text. No markdown, no preamble.`

export function buildSnapshotAboutPrompt(input: {
  name?: string | null
  profileContext: string
  visionContext: string
  existingAbout?: string | null
}): string {
  const sections = [
    `Write this member's Vibe Tribe About.`,
    `Name: ${input.name?.trim() || 'Unknown'}`,
  ]

  if (input.profileContext.trim()) {
    sections.push(`## Profile (current life — primary source)\n${input.profileContext.trim()}`)
  } else {
    sections.push(`## Profile\nNo structured profile yet.`)
  }

  if (input.visionContext.trim()) {
    sections.push(`## Life Vision (flavor only — do not paste or summarize the whole vision)\n${input.visionContext.trim()}`)
  } else {
    sections.push(`## Life Vision\nNone on file. Stay with profile facts.`)
  }

  if (input.existingAbout?.trim()) {
    sections.push(`## Current About (keep what still fits)\n${input.existingAbout.trim()}`)
  }

  sections.push(`Write the About now.`)
  return sections.join('\n\n')
}

function childAgeYears(birthday?: string | null): number | null {
  if (!birthday) return null
  const age = Math.floor((Date.now() - new Date(birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  return age >= 0 && age < 120 ? age : null
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

const SKIP_PROFILE_KEYS = new Set([
  'id', 'user_id', 'parent_id', 'email', 'phone', 'profile_picture_url',
  'household_income', 'savings_retirement', 'assets_equity', 'consumer_debt',
  'currency', 'health_conditions', 'medications', 'height', 'weight',
  'units', 'ai_tags', 'version_number', 'is_draft', 'is_active',
  'refined_fields', 'created_at', 'updated_at', 'version_notes',
  'progress_photos', 'story_recordings', 'ethnicity',
])

export function formatSnapshotProfileContext(profile: Record<string, any> | null): string {
  if (!profile) return ''
  const lines: string[] = []

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
  if (name) lines.push(`Name: ${name}`)
  if (profile.gender) lines.push(`Gender: ${profile.gender}`)

  if (profile.relationship_status) {
    let rel = String(profile.relationship_status)
    if (profile.partner_name) rel += ` — partner: ${profile.partner_name}`
    if (profile.relationship_length) rel += ` (${profile.relationship_length})`
    lines.push(`Relationship: ${rel}`)
  }

  const children: Array<{ first_name?: string; birthday?: string | null }> = Array.isArray(profile.children)
    ? profile.children
    : []
  if (children.length > 0) {
    const kids = children
      .map((child) => {
        const childName = (child.first_name || '').trim()
        if (!childName) return null
        const age = childAgeYears(child.birthday)
        return age !== null ? `${childName} (${age})` : childName
      })
      .filter(Boolean)
      .join(', ')
    if (kids) lines.push(`Children: ${kids}`)
  } else if (profile.has_children) {
    lines.push('Has children')
  }

  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ')
  if (location) lines.push(`Location: ${location}`)
  if (profile.living_situation) lines.push(`Living situation: ${profile.living_situation}`)
  if (profile.time_at_location) lines.push(`Time at location: ${profile.time_at_location}`)

  if (profile.occupation) {
    lines.push(`Work: ${profile.occupation}${profile.company ? ` at ${profile.company}` : ''}`)
  }
  if (profile.employment_type) lines.push(`Employment: ${profile.employment_type}`)
  if (profile.time_in_role) lines.push(`Time in role: ${profile.time_in_role}`)
  if (profile.education) lines.push(`Education: ${profile.education}`)

  if (Array.isArray(profile.hobbies) && profile.hobbies.length > 0) {
    lines.push(`Hobbies: ${profile.hobbies.join(', ')}`)
  }
  if (profile.leisure_time_weekly) lines.push(`Leisure time: ${profile.leisure_time_weekly}`)
  if (profile.travel_frequency) lines.push(`Travel: ${profile.travel_frequency}`)
  if (typeof profile.countries_visited === 'number') {
    lines.push(`Countries visited: ${profile.countries_visited}`)
  }
  if (profile.spiritual_practice) lines.push(`Spiritual practice: ${profile.spiritual_practice}`)
  if (profile.volunteer_status) lines.push(`Giving: ${profile.volunteer_status}`)

  const stateLines: string[] = []
  for (const [key, value] of Object.entries(profile)) {
    if (!key.startsWith('state_')) continue
    if (typeof value !== 'string' || !value.trim()) continue
    if (SKIP_PROFILE_KEYS.has(key)) continue
    stateLines.push(`${key.replace('state_', '')}: "${truncate(value, 280)}"`)
  }
  if (stateLines.length > 0) {
    lines.push(`In their own words:\n${stateLines.join('\n')}`)
  }

  return lines.join('\n')
}

export function formatSnapshotVisionContext(
  vision: Record<string, any> | null,
  categoryKeys: readonly string[],
): string {
  if (!vision) return ''
  const sections: string[] = []
  const keys = ['forward', ...categoryKeys]
  for (const key of keys) {
    const content = vision[key]
    if (typeof content !== 'string' || !content.trim()) continue
    sections.push(`${key}: "${truncate(content, 320)}"`)
  }
  return sections.join('\n')
}
