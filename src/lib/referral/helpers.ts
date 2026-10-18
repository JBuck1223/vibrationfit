// Shared referral program helpers used by multiple API routes

import { SupabaseClient } from '@supabase/supabase-js'

const RESERVED_CODES = new Set([
  'admin', 'api', 'referral', 'refer', 'ref', 'app', 'dashboard',
  'login', 'signup', 'auth', 'checkout', 'offer', 'pricing',
  'profile', 'settings', 'account', 'help', 'support', 'blog',
  'about', 'contact', 'terms', 'privacy', 'viva', 'vibrationfit',
])

const CODE_REGEX = /^[a-z0-9][a-z0-9-]{0,18}[a-z0-9]$/

export function isValidReferralCode(code: string): { valid: boolean; error?: string } {
  if (code.length < 2 || code.length > 20) {
    return { valid: false, error: 'Code must be 2-20 characters' }
  }
  if (!CODE_REGEX.test(code)) {
    return { valid: false, error: 'Code can only contain lowercase letters, numbers, and hyphens (cannot start or end with hyphen)' }
  }
  if (RESERVED_CODES.has(code)) {
    return { valid: false, error: 'This code is reserved' }
  }
  return { valid: true }
}

export function generateCodeFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15) || 'vibe'
}

export async function generateUniqueCode(
  supabase: SupabaseClient,
  baseName: string
): Promise<string> {
  const baseCode = generateCodeFromName(baseName)
  let candidate = baseCode

  for (let i = 0; i < 100; i++) {
    const { data: existing } = await supabase
      .from('referral_participants')
      .select('id')
      .eq('referral_code', candidate)
      .maybeSingle()

    const { data: historyHit } = await supabase
      .from('referral_code_history')
      .select('id')
      .eq('old_code', candidate)
      .maybeSingle()

    if (!existing && !historyHit) return candidate

    candidate = `${baseCode}${Math.floor(Math.random() * 9000) + 1000}`
  }

  return `${baseCode}${Date.now().toString(36).slice(-6)}`
}

/**
 * Resolve a referral code (current or historical) to the participant.
 * Returns the participant row or null.
 */
export async function resolveReferralCode(
  supabase: SupabaseClient,
  code: string
): Promise<{ id: string; email: string; referral_code: string; user_id: string | null; display_name: string | null } | null> {
  const { data: participant } = await supabase
    .from('referral_participants')
    .select('id, email, referral_code, user_id, display_name')
    .eq('referral_code', code)
    .eq('is_active', true)
    .maybeSingle()

  if (participant) return participant

  const { data: history } = await supabase
    .from('referral_code_history')
    .select('participant_id')
    .eq('old_code', code)
    .maybeSingle()

  if (!history) return null

  const { data: fromHistory } = await supabase
    .from('referral_participants')
    .select('id, email, referral_code, user_id, display_name')
    .eq('id', history.participant_id)
    .eq('is_active', true)
    .maybeSingle()

  return fromHistory
}
