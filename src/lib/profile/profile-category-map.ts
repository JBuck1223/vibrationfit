// Maps profile "current state" fields to the 12 life categories.
// Each profile section (e.g. FinancialSection -> money) writes a per-category
// `state_<key>` column on user_profiles. Used by the Reset feature to attribute
// profile changes to focus areas.

import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'

// e.g. 'money' -> 'state_money'
export function profileStateField(categoryKey: string): string {
  return `state_${categoryKey}`
}

export const PROFILE_STATE_FIELDS: { key: string; field: string }[] =
  LIFE_CATEGORY_KEYS.map((key) => ({ key, field: profileStateField(key) }))

export const PROFILE_STATE_COLUMNS: string[] = PROFILE_STATE_FIELDS.map((f) => f.field)
