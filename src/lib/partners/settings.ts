import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_PARTNER_SETTINGS, type PartnerSettings } from './math'

/** The single partner_program_settings row, with defaults if it is missing. */
export async function loadPartnerSettings(db: SupabaseClient): Promise<PartnerSettings> {
  const { data } = await db.from('partner_program_settings').select('*').eq('id', 1).maybeSingle()
  if (!data) return DEFAULT_PARTNER_SETTINGS
  const s = { ...DEFAULT_PARTNER_SETTINGS }
  for (const key of Object.keys(s) as (keyof PartnerSettings)[]) {
    const value = (data as Record<string, unknown>)[key]
    if (value === null || value === undefined) continue
    ;(s as Record<string, unknown>)[key] = typeof s[key] === 'boolean' ? Boolean(value) : Number(value)
  }
  return s
}
