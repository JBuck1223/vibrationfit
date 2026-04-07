import { createAdminClient } from '@/lib/supabase/admin'

export type Audience = 'members' | 'leads' | 'both'

export interface BlastFilters {
  audience: Audience
  // Member filters
  engagement_status?: string
  health_status?: string
  subscription_tier?: string
  subscription_status?: string
  intensive_status?: string
  custom_tags?: string[]
  days_since_last_login_gt?: number
  days_since_last_login_lt?: number
  has_phone?: string
  sms_opt_in?: string
  email_opt_in?: string
  has_vision?: string
  has_journal_entry?: string
  profile_completion_gte?: number
  // Lead filters
  lead_status?: string
  lead_type?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  // Shared
  created_after?: string
  created_before?: string
  // Manual selection (bypasses all filters)
  manual_emails?: string[]
  // Exclusions
  exclude_leads?: boolean
  exclude_segment_id?: string
}

export interface BlastRecipient {
  email: string
  name: string
  firstName: string
  type: 'member' | 'lead'
  userId?: string
  phone?: string
  smsOptIn?: boolean
}

export async function queryRecipients(
  filters: BlastFilters
): Promise<BlastRecipient[]> {
  const adminClient = createAdminClient()

  if (filters.manual_emails?.length) {
    return queryManualRecipients(adminClient, filters.manual_emails)
  }

  const recipients: BlastRecipient[] = []
  const seenEmails = new Set<string>()

  if (filters.audience === 'members' || filters.audience === 'both') {
    const members = await queryMembers(adminClient, filters)
    for (const m of members) {
      if (m.email && !seenEmails.has(m.email.toLowerCase())) {
        seenEmails.add(m.email.toLowerCase())
        recipients.push(m)
      }
    }
  }

  if (filters.audience === 'leads' || filters.audience === 'both') {
    const leads = await queryLeads(adminClient, filters)
    for (const l of leads) {
      if (l.email && !seenEmails.has(l.email.toLowerCase())) {
        seenEmails.add(l.email.toLowerCase())
        recipients.push(l)
      }
    }
  }

  let result = recipients

  if (filters.exclude_leads && (filters.audience === 'members' || filters.audience === 'both')) {
    const { data: leadEmails } = await adminClient
      .from('leads')
      .select('email')
    const leadSet = new Set((leadEmails || []).map((l) => l.email?.toLowerCase()).filter(Boolean))
    result = result.filter((r) => r.type !== 'member' || !leadSet.has(r.email.toLowerCase()))
  }

  if (filters.exclude_segment_id) {
    const excludeEmails = await resolveSegmentEmails(adminClient, filters.exclude_segment_id)
    if (excludeEmails.size > 0) {
      result = result.filter((r) => !excludeEmails.has(r.email.toLowerCase()))
    }
  }

  return result
}

async function resolveSegmentEmails(
  supabase: ReturnType<typeof createAdminClient>,
  segmentId: string
): Promise<Set<string>> {
  const { data: segment } = await supabase
    .from('blast_segments')
    .select('filters')
    .eq('id', segmentId)
    .single()

  if (!segment?.filters) return new Set()

  const segFilters = segment.filters as BlastFilters
  const recipients = await queryRecipients({ ...segFilters, exclude_segment_id: undefined })
  return new Set(recipients.map((r) => r.email.toLowerCase()))
}

async function queryMembers(
  supabase: ReturnType<typeof createAdminClient>,
  filters: BlastFilters
): Promise<BlastRecipient[]> {
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('is_active', true)
    .eq('is_draft', false)

  if (!profiles || profiles.length === 0) return []

  const userIds = profiles.map((p) => p.user_id)

  const needsActivityFilter =
    filters.engagement_status ||
    filters.health_status ||
    filters.custom_tags?.length ||
    filters.days_since_last_login_gt !== undefined ||
    filters.days_since_last_login_lt !== undefined ||
    filters.has_vision ||
    filters.has_journal_entry ||
    filters.profile_completion_gte !== undefined

  const needsTierFilter = !!filters.subscription_tier
  const needsSubscriptionStatusFilter = !!filters.subscription_status
  const needsIntensiveFilter = !!filters.intensive_status

  const [activityResult, subscriptionResult, authResult, intensiveResult, accountResult] = await Promise.all([
    needsActivityFilter
      ? supabase
          .from('user_activity_metrics')
          .select('user_id, engagement_status, health_status, custom_tags, days_since_last_login, vision_count, journal_entry_count, profile_completion_percent')
          .in('user_id', userIds)
      : Promise.resolve({ data: null }),
    (needsTierFilter || needsSubscriptionStatusFilter)
      ? supabase
          .from('customer_subscriptions')
          .select('user_id, status, membership_tiers(name)')
          .in('user_id', userIds)
      : Promise.resolve({ data: null }),
    (filters.created_after || filters.created_before)
      ? supabase.auth.admin.listUsers({ perPage: 1000 })
      : Promise.resolve({ data: null }),
    needsIntensiveFilter
      ? supabase
          .from('intensive_checklist')
          .select('user_id, status, unlock_completed')
          .in('user_id', userIds)
      : Promise.resolve({ data: null }),
    supabase
      .from('user_accounts')
      .select('id, email, first_name, last_name, phone, sms_opt_in, email_opt_in')
      .in('id', userIds),
  ])


  const activityMap = new Map<string, Record<string, unknown>>()
  if (activityResult.data) {
    for (const a of activityResult.data) {
      activityMap.set(a.user_id, a)
    }
  }

  const tierMap = new Map<string, string>()
  const subStatusMap = new Map<string, string>()
  if (subscriptionResult.data) {
    for (const s of subscriptionResult.data) {
      const tier = s.membership_tiers as { name?: string } | null
      if (tier?.name) tierMap.set(s.user_id, tier.name)
      if (s.status === 'active' || s.status === 'trialing') {
        subStatusMap.set(s.user_id, s.status)
      } else if (!subStatusMap.has(s.user_id)) {
        subStatusMap.set(s.user_id, s.status)
      }
    }
  }

  const authCreatedMap = new Map<string, string>()
  if (authResult.data) {
    const users = 'users' in authResult.data ? authResult.data.users : []
    for (const u of users) {
      authCreatedMap.set(u.id, u.created_at)
    }
  }

  const intensiveMap = new Map<string, { status: string; unlock_completed: boolean }>()
  if (intensiveResult.data) {
    for (const row of intensiveResult.data) {
      const existing = intensiveMap.get(row.user_id)
      if (!existing || row.unlock_completed || row.status === 'completed') {
        intensiveMap.set(row.user_id, {
          status: row.status,
          unlock_completed: row.unlock_completed ?? false,
        })
      }
    }
  }

  interface AccountRecord {
    email: string | null
    first_name: string | null
    last_name: string | null
    phone: string | null
    sms_opt_in: boolean
    email_opt_in: boolean
  }
  const accountMap = new Map<string, AccountRecord>()
  if (accountResult.data) {
    for (const a of accountResult.data) {
      accountMap.set(a.id, {
        email: a.email || null,
        first_name: a.first_name || null,
        last_name: a.last_name || null,
        phone: a.phone || null,
        sms_opt_in: a.sms_opt_in ?? false,
        email_opt_in: a.email_opt_in ?? true,
      })
    }
  }

  const filtered = profiles
    .filter((p) => {
      const account = accountMap.get(p.user_id)
      if (!account?.email) return false

      if (needsActivityFilter) {
        const activity = activityMap.get(p.user_id)
        if (filters.engagement_status && activity?.engagement_status !== filters.engagement_status) return false
        if (filters.health_status && activity?.health_status !== filters.health_status) return false
        if (filters.custom_tags?.length) {
          const tags = (activity?.custom_tags as string[]) || []
          if (!filters.custom_tags.some((t) => tags.includes(t))) return false
        }
        if (filters.days_since_last_login_gt !== undefined) {
          const days = (activity?.days_since_last_login as number) ?? null
          if (days === null || days <= filters.days_since_last_login_gt) return false
        }
        if (filters.days_since_last_login_lt !== undefined) {
          const days = (activity?.days_since_last_login as number) ?? null
          if (days === null || days >= filters.days_since_last_login_lt) return false
        }
        if (filters.has_vision) {
          const count = (activity?.vision_count as number) ?? 0
          if (filters.has_vision === 'yes' && count <= 0) return false
          if (filters.has_vision === 'no' && count > 0) return false
        }
        if (filters.has_journal_entry) {
          const count = (activity?.journal_entry_count as number) ?? 0
          if (filters.has_journal_entry === 'yes' && count <= 0) return false
          if (filters.has_journal_entry === 'no' && count > 0) return false
        }
        if (filters.profile_completion_gte !== undefined) {
          const pct = (activity?.profile_completion_percent as number) ?? 0
          if (pct < filters.profile_completion_gte) return false
        }
      }

      if (filters.subscription_tier) {
        const tier = tierMap.get(p.user_id) || 'Free'
        if (tier.toLowerCase() !== filters.subscription_tier.toLowerCase()) return false
      }

      if (filters.subscription_status) {
        const status = subStatusMap.get(p.user_id) || 'free'
        const target = filters.subscription_status.toLowerCase()
        if (target === 'not_canceled') {
          if (status === 'canceled' || status === 'incomplete_expired') return false
        } else if (target === 'free') {
          if (status !== 'free' && status !== 'canceled' && status !== 'incomplete_expired') return false
        } else {
          if (status !== target) return false
        }
      }

      if (filters.intensive_status) {
        const intensive = intensiveMap.get(p.user_id)
        switch (filters.intensive_status) {
          case 'no_intensive':
            if (intensive) return false
            break
          case 'pending':
            if (!intensive || intensive.status !== 'pending') return false
            break
          case 'in_progress':
            if (!intensive || intensive.status !== 'in_progress') return false
            break
          case 'completed':
            if (!intensive || intensive.status !== 'completed' || intensive.unlock_completed) return false
            break
          case 'unlocked':
            if (!intensive || !intensive.unlock_completed) return false
            break
        }
      }

      if (filters.has_phone) {
        const hasPhone = !!account.phone
        if (filters.has_phone === 'yes' && !hasPhone) return false
        if (filters.has_phone === 'no' && hasPhone) return false
      }
      if (filters.sms_opt_in) {
        if (filters.sms_opt_in === 'yes' && !account.sms_opt_in) return false
        if (filters.sms_opt_in === 'no' && account.sms_opt_in) return false
      }
      if (filters.email_opt_in) {
        if (filters.email_opt_in === 'yes' && !account.email_opt_in) return false
        if (filters.email_opt_in === 'no' && account.email_opt_in) return false
      }

      if (filters.created_after || filters.created_before) {
        const created = authCreatedMap.get(p.user_id)
        if (!created) return false
        if (filters.created_after && created < filters.created_after) return false
        if (filters.created_before && created > filters.created_before) return false
      }

      return true
    })
    .map((p) => {
      const account = accountMap.get(p.user_id)!
      return {
        email: account.email!,
        name: [account.first_name, account.last_name].filter(Boolean).join(' ') || account.email!,
        firstName: account.first_name || '',
        type: 'member' as const,
        userId: p.user_id,
        phone: account.phone || undefined,
        smsOptIn: account.sms_opt_in,
      }
    })

  return filtered
}

async function queryManualRecipients(
  supabase: ReturnType<typeof createAdminClient>,
  emails: string[]
): Promise<BlastRecipient[]> {
  const lowerEmails = emails.map((e) => e.toLowerCase().trim()).filter(Boolean)
  if (lowerEmails.length === 0) return []

  const recipients: BlastRecipient[] = []
  const foundEmails = new Set<string>()

  const { data: accounts } = await supabase
    .from('user_accounts')
    .select('id, email, first_name, last_name, phone, sms_opt_in')
    .in('email', lowerEmails)

  if (accounts) {
    for (const a of accounts) {
      if (!a.email) continue
      foundEmails.add(a.email.toLowerCase())
      recipients.push({
        email: a.email,
        name: [a.first_name, a.last_name].filter(Boolean).join(' ') || a.email,
        firstName: a.first_name || '',
        type: 'member',
        userId: a.id,
        phone: a.phone || undefined,
        smsOptIn: a.sms_opt_in ?? false,
      })
    }
  }

  const missingEmails = lowerEmails.filter((e) => !foundEmails.has(e))
  if (missingEmails.length > 0) {
    const { data: leads } = await supabase
      .from('leads')
      .select('id, email, first_name, last_name, phone, sms_opt_in')
      .in('email', missingEmails)

    if (leads) {
      for (const l of leads) {
        if (!l.email || foundEmails.has(l.email.toLowerCase())) continue
        foundEmails.add(l.email.toLowerCase())
        recipients.push({
          email: l.email,
          name: [l.first_name, l.last_name].filter(Boolean).join(' ') || l.email,
          firstName: l.first_name || '',
          type: 'lead',
          phone: l.phone || undefined,
          smsOptIn: l.sms_opt_in ?? false,
        })
      }
    }
  }

  return recipients
}

async function queryLeads(
  supabase: ReturnType<typeof createAdminClient>,
  filters: BlastFilters
): Promise<BlastRecipient[]> {
  let query = supabase
    .from('leads')
    .select('id, first_name, last_name, email, phone, sms_opt_in, status, type, utm_source, utm_medium, utm_campaign, created_at')

  if (filters.lead_status) {
    query = query.eq('status', filters.lead_status)
  }
  if (filters.lead_type) {
    query = query.eq('type', filters.lead_type)
  }
  if (filters.utm_source) {
    query = query.ilike('utm_source', `%${filters.utm_source}%`)
  }
  if (filters.utm_medium) {
    query = query.ilike('utm_medium', `%${filters.utm_medium}%`)
  }
  if (filters.utm_campaign) {
    query = query.ilike('utm_campaign', `%${filters.utm_campaign}%`)
  }
  if (filters.created_after) {
    query = query.gte('created_at', filters.created_after)
  }
  if (filters.created_before) {
    query = query.lte('created_at', filters.created_before)
  }

  const { data: leads } = await query

  if (!leads) return []

  return leads
    .filter((l) => !!l.email)
    .map((l) => ({
      email: l.email!,
      name: [l.first_name, l.last_name].filter(Boolean).join(' ') || l.email!,
      firstName: l.first_name || '',
      type: 'lead' as const,
      phone: l.phone || undefined,
      smsOptIn: l.sms_opt_in ?? false,
    }))
}
