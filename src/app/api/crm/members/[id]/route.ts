// /src/app/api/crm/members/[id]/route.ts
// Individual member operations - Uses auth.users as source of truth

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isUserAdmin } from '@/lib/supabase/admin'

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic'

// Allowed fields for member metrics updates
const MEMBER_UPDATABLE_FIELDS = [
  'engagement_status', 'health_status', 'custom_tags', 'admin_notes',
] as const

function pickAllowedFields(body: Record<string, unknown>, allowedFields: readonly string[]) {
  const result: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) {
      result[key] = body[key]
    }
  }
  return result
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client for ALL queries
    const adminClient = createAdminClient()
    const { data: authUserData, error: authError } = await adminClient.auth.admin.getUserById(id)

    if (authError || !authUserData.user) {
      console.error('Error fetching auth user:', authError)
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const authUser = authUserData.user

    // Run independent queries in parallel
    const [
      { data: profile },
      { count: visionCount },
      { count: journalCount },
      { count: visionBoardCount },
      { count: audioCount },
      { data: manualMetrics },
      { data: subscriptions },
      { data: payments },
      { data: smsMessages },
      { data: emailMessages },
      { data: tickets },
      { data: lead },
    ] = await Promise.all([
      adminClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .single(),
      adminClient
        .from('vision_versions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id),
      adminClient
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id),
      adminClient
        .from('vision_board_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id),
      adminClient
        .from('audio_sets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id),
      adminClient
        .from('user_activity_metrics')
        .select('engagement_status, health_status, custom_tags, admin_notes')
        .eq('user_id', id)
        .single(),
      adminClient
        .from('customer_subscriptions')
        .select(`
          *,
          membership_tiers (
            name,
            tier_type,
            price_monthly,
            price_yearly,
            billing_interval,
            viva_tokens_monthly,
            storage_quota_gb
          )
        `)
        .eq('user_id', id)
        .in('status', ['active', 'trialing']),
      adminClient
        .from('payment_history')
        .select('amount, paid_at, status')
        .eq('user_id', id)
        .eq('status', 'succeeded')
        .order('paid_at', { ascending: true }),
      adminClient
        .from('sms_messages')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: true }),
      adminClient
        .from('email_messages')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: true }),
      adminClient
        .from('support_tickets')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
      adminClient
        .from('leads')
        .select('*')
        .eq('converted_to_user_id', id)
        .single(),
    ])

    // Calculate profile completion
    let profileCompletion = 0
    if (profile) {
      const fields = [
        'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender',
        'relationship_status', 'number_of_children', 'city', 'state', 'postal_code',
        'employment_type', 'occupation', 'household_income'
      ]
      const completed = fields.filter(f => profile[f] !== null && profile[f] !== undefined && profile[f] !== '').length
      profileCompletion = Math.round((completed / fields.length) * 100)
    }

    const activityMetrics = {
      user_id: id,
      profile_completion_percent: profileCompletion,
      vision_count: visionCount || 0,
      vision_refinement_count: 0,
      audio_generated_count: audioCount || 0,
      journal_entry_count: journalCount || 0,
      vision_board_image_count: visionBoardCount || 0,
      last_login_at: authUser.last_sign_in_at,
      days_since_last_login: authUser.last_sign_in_at 
        ? Math.floor((Date.now() - new Date(authUser.last_sign_in_at).getTime()) / (1000 * 60 * 60 * 24))
        : null,
      s3_file_count: 0,
      total_storage_mb: 0,
      tokens_used: profile?.vibe_assistant_tokens_used || 0,
      tokens_remaining: profile?.vibe_assistant_tokens_remaining || 100,
      engagement_status: manualMetrics?.engagement_status || null,
      health_status: manualMetrics?.health_status || null,
      custom_tags: manualMetrics?.custom_tags || [],
      admin_notes: manualMetrics?.admin_notes || null,
    }

    // Calculate revenue metrics (aggregate ALL active subscriptions)
    const totalSpent = payments?.reduce((sum, p) => sum + (p.amount / 100), 0) || 0
    const ltv = totalSpent
    
    let totalMrr = 0
    let totalTokens = 0
    let maxStorage = 0
    const tierNames: string[] = []
    
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach(sub => {
        const tier = sub.membership_tiers as {
          name?: string
          tier_type?: string
          price_monthly?: number
          price_yearly?: number
          billing_interval?: string
          viva_tokens_monthly?: number
          storage_quota_gb?: number
        } | null
        if (tier) {
          tierNames.push(tier.name || 'Unknown')
          if (tier.billing_interval === 'month') {
            totalMrr += (tier.price_monthly || 0) / 100
          } else if (tier.billing_interval === 'year') {
            totalMrr += (tier.price_yearly || 0) / 12 / 100
          }
          totalTokens += tier.viva_tokens_monthly || 0
          maxStorage = Math.max(maxStorage, tier.storage_quota_gb || 0)
        }
      })
    }
    
    const firstPayment = payments && payments.length > 0 ? new Date(payments[0].paid_at) : null
    const daysAsCustomer = firstPayment 
      ? Math.floor((Date.now() - firstPayment.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const revenueMetrics = {
      subscription_tiers: tierNames.length > 0 ? tierNames : ['Free'],
      subscription_tier: tierNames.length > 0 ? tierNames.join(' + ') : 'Free',
      subscription_count: subscriptions?.length || 0,
      subscription_status: subscriptions && subscriptions.length > 0 ? subscriptions[0].status : null,
      stripe_customer_id: subscriptions && subscriptions.length > 0 ? subscriptions[0].stripe_customer_id : null,
      stripe_subscription_id: subscriptions && subscriptions.length > 0 ? subscriptions[0].stripe_subscription_id : null,
      mrr: totalMrr,
      monthly_tokens: totalTokens,
      storage_gb: maxStorage,
      ltv,
      total_spent: totalSpent,
      subscription_start_date: subscriptions && subscriptions.length > 0 ? subscriptions[0].created_at : null,
      days_as_customer: daysAsCustomer,
    }

    return NextResponse.json({
      member: {
        user_id: authUser.id,
        email: authUser.email,
        phone: profile?.phone || authUser.phone || null,
        full_name: profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : profile?.first_name || profile?.last_name || authUser.email?.split('@')[0] || 'Unknown',
        created_at: authUser.created_at,
        activity_metrics: activityMetrics,
        revenue_metrics: revenueMetrics,
      },
      smsMessages: smsMessages || [],
      emailMessages: emailMessages || [],
      tickets: tickets || [],
      lead: lead || null,
    })
  } catch (error: unknown) {
    console.error('Error in get member API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updateData = pickAllowedFields(body, MEMBER_UPDATABLE_FIELDS)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Update activity metrics (manual status/tags/notes)
    const { data: metrics, error } = await adminClient
      .from('user_activity_metrics')
      .upsert({
        user_id: id,
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating member:', error)
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
    }

    return NextResponse.json({ metrics })
  } catch (error: unknown) {
    console.error('Error in update member API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
