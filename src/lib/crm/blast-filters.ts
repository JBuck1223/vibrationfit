import { createAdminClient } from '@/lib/supabase/admin'

export type Audience = 'members' | 'leads' | 'both'

export interface BlastFilters {
  audience: Audience
  // Member filters
  engagement_status?: string
  health_status?: string
  subscription_tier?: string
  custom_tags?: string[]
  days_since_last_login_gt?: number
  days_since_last_login_lt?: number
  // Lead filters
  lead_status?: string
  lead_type?: string
  utm_source?: string
  // Shared
  created_after?: string
  created_before?: string
}

export interface BlastRecipient {
  email: string
  name: string
  type: 'member' | 'lead'
  userId?: string
}

export async function queryRecipients(
  filters: BlastFilters
): Promise<BlastRecipient[]> {
  const adminClient = createAdminClient()
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

  return recipients
}

async function queryMembers(
  supabase: ReturnType<typeof createAdminClient>,
  filters: BlastFilters
): Promise<BlastRecipient[]> {
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, first_name, last_name, email')
    .eq('is_active', true)
    .eq('is_draft', false)

  if (!profiles || profiles.length === 0) return []

  const userIds = profiles.map((p) => p.user_id)

  const needsActivityFilter =
    filters.engagement_status ||
    filters.health_status ||
    filters.custom_tags?.length ||
    filters.days_since_last_login_gt !== undefined ||
    filters.days_since_last_login_lt !== undefined

  const needsTierFilter = !!filters.subscription_tier

  const [activityResult, subscriptionResult, authResult] = await Promise.all([
    needsActivityFilter
      ? supabase
          .from('user_activity_metrics')
          .select('user_id, engagement_status, health_status, custom_tags, days_since_last_login')
          .in('user_id', userIds)
      : Promise.resolve({ data: null }),
    needsTierFilter
      ? supabase
          .from('customer_subscriptions')
          .select('user_id, membership_tiers(name)')
          .in('user_id', userIds)
          .in('status', ['active', 'trialing'])
      : Promise.resolve({ data: null }),
    (filters.created_after || filters.created_before)
      ? supabase.auth.admin.listUsers({ perPage: 1000 })
      : Promise.resolve({ data: null }),
  ])

  const activityMap = new Map<string, Record<string, unknown>>()
  if (activityResult.data) {
    for (const a of activityResult.data) {
      activityMap.set(a.user_id, a)
    }
  }

  const tierMap = new Map<string, string>()
  if (subscriptionResult.data) {
    for (const s of subscriptionResult.data) {
      const tier = s.membership_tiers as { name?: string } | null
      if (tier?.name) tierMap.set(s.user_id, tier.name)
    }
  }

  const authCreatedMap = new Map<string, string>()
  if (authResult.data) {
    const users = 'users' in authResult.data ? authResult.data.users : []
    for (const u of users) {
      authCreatedMap.set(u.id, u.created_at)
    }
  }

  return profiles
    .filter((p) => {
      if (!p.email) return false

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
      }

      if (filters.subscription_tier) {
        const tier = tierMap.get(p.user_id) || 'Free'
        if (tier.toLowerCase() !== filters.subscription_tier.toLowerCase()) return false
      }

      if (filters.created_after || filters.created_before) {
        const created = authCreatedMap.get(p.user_id)
        if (!created) return false
        if (filters.created_after && created < filters.created_after) return false
        if (filters.created_before && created > filters.created_before) return false
      }

      return true
    })
    .map((p) => ({
      email: p.email!,
      name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email!,
      type: 'member' as const,
      userId: p.user_id,
    }))
}

async function queryLeads(
  supabase: ReturnType<typeof createAdminClient>,
  filters: BlastFilters
): Promise<BlastRecipient[]> {
  let query = supabase
    .from('leads')
    .select('id, first_name, last_name, email, status, type, utm_source, created_at')

  if (filters.lead_status) {
    query = query.eq('status', filters.lead_status)
  }
  if (filters.lead_type) {
    query = query.eq('type', filters.lead_type)
  }
  if (filters.utm_source) {
    query = query.ilike('utm_source', `%${filters.utm_source}%`)
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
      type: 'lead' as const,
    }))
}
