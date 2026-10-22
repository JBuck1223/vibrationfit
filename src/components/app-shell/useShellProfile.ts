'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ShellProfile {
  avatarUrl: string | null
  initial: string
  firstName: string | null
}

const EMPTY: ShellProfile = { avatarUrl: null, initial: '', firstName: null }

/** The little the header needs about the member: avatar and a first name. */
export function useShellProfile(): ShellProfile {
  const [profile, setProfile] = useState<ShellProfile>(EMPTY)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase
        .from('user_accounts')
        .select('profile_picture_url, first_name')
        .eq('id', user.id)
        .maybeSingle()
      if (cancelled) return
      const row = data as { profile_picture_url?: string | null; first_name?: string | null } | null
      const firstName = row?.first_name?.trim() || user.user_metadata?.first_name || null
      const source = firstName || user.email || ''
      setProfile({
        avatarUrl: row?.profile_picture_url ?? null,
        firstName,
        initial: source ? source.charAt(0).toUpperCase() : '',
      })
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return profile
}
