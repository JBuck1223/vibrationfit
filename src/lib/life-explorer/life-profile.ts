/**
 * The child's current-state profile, kid lens on the 12 life categories.
 *
 * The parent describes where the child is right now in each area.
 * VIVA drafts the Life I Choose from these answers; the child then
 * adds imagination and makes it theirs.
 *
 * Field names follow the main app's user_profiles convention:
 * one `state_<key>` column per life category (le_student_profiles).
 */

import { LIFE_CATEGORY_KEYS, type LifeCategoryKey } from '@/lib/design-system/vision-categories'

export interface KidCategory {
  key: LifeCategoryKey
  /** Column on le_student_profiles. */
  field: string
  /** Kid-lens name the parent sees. */
  label: string
  /** The question the parent answers. */
  prompt: string
  /** Example answer shown as placeholder. */
  example: string
}

export const KID_CATEGORIES: KidCategory[] = [
  {
    key: 'fun',
    field: 'state_fun',
    label: 'Fun',
    prompt: 'What does he love to do? What fills a free afternoon?',
    example: 'Builds forts, digs for bugs, asks to go to the creek, LEGO for hours',
  },
  {
    key: 'health',
    field: 'state_health',
    label: 'His body',
    prompt: 'How does he move, eat, and sleep? What is his energy like?',
    example: 'Runs everywhere, climbs trees, picky about vegetables, sleeps hard',
  },
  {
    key: 'travel',
    field: 'state_travel',
    label: 'Places',
    prompt: 'Where has he been, and what places does he ask about?',
    example: 'Beach trips, grandma\u2019s farm, asks about the North Pole and volcanoes',
  },
  {
    key: 'love',
    field: 'state_love',
    label: 'Warmth',
    prompt: 'How does he give and receive affection?',
    example: 'Big hugs, makes cards for people, checks on you when you seem sad',
  },
  {
    key: 'family',
    field: 'state_family',
    label: 'Family',
    prompt: 'What is his place in the family right now? Siblings, rituals, roles?',
    example: 'Adores his little sister, loves pancake Saturdays, wants to help cook',
  },
  {
    key: 'social',
    field: 'state_social',
    label: 'Friends',
    prompt: 'Who does he play with, and how does he do in groups?',
    example: 'One best friend next door, shy in big groups, shares easily one-on-one',
  },
  {
    key: 'home',
    field: 'state_home',
    label: 'Home',
    prompt: 'What are his spaces and jobs at home?',
    example: 'His room is a museum of rocks, feeds the dog, loves the backyard',
  },
  {
    key: 'work',
    field: 'state_work',
    label: 'What he wants to be and do',
    prompt: 'What does he pretend to be? What big things does he say he\u2019ll do?',
    example: 'Plays paleontologist, says he\u2019ll drive a submarine, builds "inventions"',
  },
  {
    key: 'money',
    field: 'state_money',
    label: 'Money and earning',
    prompt: 'What does he understand about money? Allowance, saving, spending?',
    example: 'Saves coins in a jar for a robot kit, sold lemonade once and loved it',
  },
  {
    key: 'stuff',
    field: 'state_stuff',
    label: 'His things',
    prompt: 'What does he treasure and collect? How does he care for it?',
    example: 'Rock collection, one stuffed penguin that goes everywhere, loses shoes',
  },
  {
    key: 'giving',
    field: 'state_giving',
    label: 'Helping and kindness',
    prompt: 'How does he help and show kindness right now?',
    example: 'Holds doors, waters plants without asking, gentle with younger kids',
  },
  {
    key: 'spirituality',
    field: 'state_spirituality',
    label: 'Wonder and big questions',
    prompt: 'What big questions does he ask? What fills him with awe?',
    example: 'Asks where stars come from, quiet at sunsets, "who made the first person?"',
  },
]

export const PROFILE_STATE_FIELDS = KID_CATEGORIES.map((c) => c.field)

export interface LeStudentProfile {
  id: string
  student_id: string
  parent_hopes?: string | null
  created_at: string
  updated_at: string
  [stateField: string]: unknown
}

/** Categories with a filled-in answer. */
export function filledCategories(profile: Partial<LeStudentProfile> | null | undefined): KidCategory[] {
  if (!profile) return []
  return KID_CATEGORIES.filter((c) => {
    const v = profile[c.field]
    return typeof v === 'string' && v.trim().length > 0
  })
}

/** Plain-text summary of the profile for VIVA prompts. */
export function profileSummaryForPrompt(profile: Partial<LeStudentProfile> | null | undefined): string {
  const filled = filledCategories(profile)
  if (filled.length === 0) return ''
  const lines = filled.map((c) => `- ${c.label}: ${String(profile![c.field]).trim()}`)
  const hopes = profile?.parent_hopes
  if (typeof hopes === 'string' && hopes.trim()) {
    lines.push(`- Parent hopes for this year: ${hopes.trim()}`)
  }
  return lines.join('\n')
}

/** Sanity guard: keep the kid lens in lockstep with the canonical 12. */
if (KID_CATEGORIES.length !== LIFE_CATEGORY_KEYS.length) {
  throw new Error('life-profile.ts: KID_CATEGORIES out of sync with LIFE_CATEGORY_KEYS')
}
