// Household management types and utilities
import { createClient } from './server'
import { createServiceClient } from './service'
import { SupabaseClient } from '@supabase/supabase-js'

import { toTitleCase } from '@/lib/utils'
import { OUTBOUND_URL } from '@/lib/urls'

// =====================================================================
// TYPES
// =====================================================================

export interface Household {
  id: string
  name: string
  admin_user_id: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
  plan_type: 'solo' | 'household'
  max_members: number
  shared_tokens_enabled: boolean
  created_at: string
  updated_at: string
}

export interface HouseholdMember {
  id: string
  household_id: string
  user_id: string
  role: 'admin' | 'member'
  allow_shared_tokens: boolean
  invited_by?: string | null
  invited_at: string
  accepted_at?: string | null
  status: 'pending' | 'active' | 'removed'
  joined_at: string
  removed_at?: string | null
}

export interface HouseholdInvitation {
  id: string
  household_id: string
  invited_email: string
  invited_by: string
  invitation_token: string
  status: 'pending' | 'accepted' | 'expired' | 'canceled'
  expires_at: string
  accepted_at?: string | null
  created_at: string
}

export interface HouseholdTokenSummary {
  household_id: string
  household_name: string
  admin_user_id: string
  shared_tokens_enabled: boolean
  plan_type: 'solo' | 'household'
  admin_tokens_remaining: number
  admin_tokens_used: number
  household_tokens_remaining: number
  household_tokens_used: number
  member_count: number
  sharing_enabled_count: number
}

export interface HouseholdMemberWithProfile extends HouseholdMember {
  profile?: {
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    profile_picture_url?: string | null
    vibe_assistant_tokens_remaining?: number
    vibe_assistant_tokens_used?: number
  }
}

// =====================================================================
// QUERIES
// =====================================================================

/**
 * Get household by ID
 */
export async function getHouseholdById(householdId: string): Promise<Household | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single()

  if (error) {
    console.error('Error fetching household:', error)
    return null
  }

  return data
}

/**
 * Get household for a user
 * Uses household_members as the source of truth
 * ⚠️ Uses service role client to bypass RLS issues
 */
export async function getUserHousehold(userId: string): Promise<Household | null> {
  // Use service role client to bypass RLS and avoid infinite recursion
  const supabase = createServiceClient()
  
  console.log('[getUserHousehold] Looking up household for user:', userId)
  
  // First get the household_id from household_members
  const { data: membership, error: memberError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  console.log('[getUserHousehold] Membership query result:', { 
    membership, 
    error: memberError,
    errorCode: memberError?.code,
    errorDetails: memberError?.details,
    errorMessage: memberError?.message
  })

  if (memberError || !membership) {
    console.error('[getUserHousehold] Error fetching user household membership:', memberError)
    return null
  }

  console.log('[getUserHousehold] Found household_id:', membership.household_id)

  // Then get the household details
  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('*')
    .eq('id', membership.household_id)
    .single()

  console.log('[getUserHousehold] Household query result:', { 
    household: household ? `Found: ${household.name}` : 'Not found', 
    error: householdError 
  })

  if (householdError || !household) {
    console.error('[getUserHousehold] Error fetching household:', householdError)
    return null
  }

  return household
}

/**
 * Get household with all members and invitations
 * ⚠️ Uses service role client to bypass RLS issues
 */
export async function getHouseholdWithMembers(
  householdId: string
): Promise<{ household: Household; members: HouseholdMemberWithProfile[]; invitations: any[] } | null> {
  // Use service role client to bypass RLS
  const supabase = createServiceClient()
  
  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single()

  if (householdError || !household) {
    console.error('Error fetching household:', householdError)
    return null
  }

  const { data: members, error: membersError } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', householdId)
    .eq('status', 'active')
  
  let membersWithProfiles = []
  if (members && members.length > 0) {
    const userIds = members.map(m => m.user_id)
    const { data: accounts } = await supabase
      .from('user_accounts')
      .select('id, first_name, last_name, email, profile_picture_url')
      .in('id', userIds)
    
    membersWithProfiles = members.map(member => {
      const account = accounts?.find(a => a.id === member.user_id)
      return {
        ...member,
        profile: account
          ? {
              first_name: account.first_name,
              last_name: account.last_name,
              email: account.email,
              profile_picture_url: account.profile_picture_url,
            }
          : null,
      }
    })
  }

  if (membersError) {
    console.error('Error fetching household members:', membersError)
  }

  // Also fetch pending invitations
  const { data: invitations, error: invitationsError } = await supabase
    .from('household_invitations')
    .select('*')
    .eq('household_id', householdId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (invitationsError) {
    console.error('Error fetching household invitations:', invitationsError)
  }

  return {
    household,
    members: (membersWithProfiles as unknown as HouseholdMemberWithProfile[]) || [],
    invitations: invitations || []
  }
}

/**
 * Get household token summary
 */
export async function getHouseholdTokenSummary(
  householdId: string
): Promise<HouseholdTokenSummary | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('household_token_summary')
    .select('*')
    .eq('household_id', householdId)
    .single()

  if (error) {
    console.error('Error fetching household token summary:', error)
    return null
  }

  return data
}

/**
 * Get user's household summary (using database function)
 */
export async function getUserHouseholdSummary(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('get_user_household_summary', {
    p_user_id: userId
  })

  if (error) {
    console.error('Error fetching user household summary:', error)
    return null
  }

  return data?.[0] || null
}

/**
 * Check if user can use shared tokens
 */
export async function canUseSharedTokens(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_accounts')
    .select(`
      allow_shared_tokens,
      household:households!user_accounts_household_id_fkey(shared_tokens_enabled)
    `)
    .eq('id', userId)
    .single()

  if (error || !data) {
    return false
  }

  const household = data.household as unknown as Household
  return data.allow_shared_tokens && household?.shared_tokens_enabled
}

// =====================================================================
// MUTATIONS
// =====================================================================

/**
 * Create a household
 */
export async function createHousehold(params: {
  adminUserId: string
  name: string
  planType: 'solo' | 'household'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}): Promise<Household | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('households')
    .insert({
      admin_user_id: params.adminUserId,
      name: params.name,
      plan_type: params.planType,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      subscription_status: 'trialing',
      shared_tokens_enabled: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating household:', error)
    return null
  }

  // Create household_members record for admin
  await supabase.from('household_members').insert({
    household_id: data.id,
    user_id: params.adminUserId,
    role: 'admin',
    status: 'active',
    accepted_at: new Date().toISOString()
  })

  // Update user_accounts with household link
  await supabase
    .from('user_accounts')
    .update({
      household_id: data.id,
      is_household_admin: true
    })
    .eq('id', params.adminUserId)

  return data
}

/**
 * Update household settings
 */
export async function updateHousehold(
  householdId: string,
  updates: Partial<Pick<Household, 'name' | 'shared_tokens_enabled'>>
): Promise<Household | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('households')
    .update(updates)
    .eq('id', householdId)
    .select()
    .single()

  if (error) {
    console.error('Error updating household:', error)
    return null
  }

  return data
}

/**
 * Create household invitation
 */
export async function createHouseholdInvitation(params: {
  householdId: string
  invitedEmail: string
  invitedBy: string
}): Promise<HouseholdInvitation | null> {
  // Use service role client to bypass RLS
  const supabase = createServiceClient()
  
  // Generate secure token
  const invitationToken = crypto.randomUUID()
  
  const { data, error } = await supabase
    .from('household_invitations')
    .insert({
      household_id: params.householdId,
      invited_email: params.invitedEmail,
      invited_by: params.invitedBy,
      invitation_token: invitationToken,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating invitation:', error)
    return null
  }

  return data
}

/**
 * Accept household invitation.
 * With the new provisioning model, members are already added at invite time.
 * This function handles the legacy case where the invitation is still pending.
 */
export async function acceptHouseholdInvitation(params: {
  invitationToken: string
  userId: string
}): Promise<{ success: boolean; household?: Household; error?: string }> {
  const serviceClient = createServiceClient()

  // Look up invitation (accept both 'pending' and 'accepted')
  const { data: invitation, error: inviteError } = await serviceClient
    .from('household_invitations')
    .select('*')
    .eq('invitation_token', params.invitationToken)
    .in('status', ['pending', 'accepted'])
    .single()

  if (inviteError || !invitation) {
    return { success: false, error: 'Invitation not found or expired' }
  }

  if (new Date(invitation.expires_at) < new Date() && invitation.status === 'pending') {
    await serviceClient
      .from('household_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)
    return { success: false, error: 'Invitation has expired' }
  }

  const { data: household, error: householdError } = await serviceClient
    .from('households')
    .select('*')
    .eq('id', invitation.household_id)
    .single()

  if (householdError || !household) {
    return { success: false, error: 'Household not found' }
  }

  // Already accepted (new provisioning model) -- just confirm membership exists
  if (invitation.status === 'accepted') {
    return { success: true, household }
  }

  // Legacy pending invitation -- add member now
  await serviceClient
    .from('household_members')
    .upsert(
      {
        household_id: invitation.household_id,
        user_id: params.userId,
        role: 'member' as const,
        status: 'active' as const,
        invited_by: invitation.invited_by,
        accepted_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'household_id,user_id', ignoreDuplicates: false },
    )

  await serviceClient
    .from('user_accounts')
    .update({ household_id: invitation.household_id, is_household_admin: false })
    .eq('id', params.userId)

  await serviceClient
    .from('household_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  return { success: true, household }
}

/**
 * Remove member from household
 */
export async function removeMemberFromHousehold(
  householdId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  // Update household_members status
  const { error: memberError } = await supabase
    .from('household_members')
    .update({
      status: 'removed',
      removed_at: new Date().toISOString()
    })
    .eq('household_id', householdId)
    .eq('user_id', userId)

  if (memberError) {
    console.error('Error removing member:', memberError)
    return { success: false, error: 'Failed to remove member' }
  }

  // Note: We don't immediately clear household_id from user_accounts
  // This allows for potential re-invite or recovery
  // Admin can choose to fully remove later

  return { success: true }
}

/**
 * Dissolve a household when the admin downgrades to a solo plan.
 * Marks all non-admin members as 'removed', clears their household references,
 * cancels any pending invitations, and converts the household to solo.
 */
export async function dissolveHousehold(
  householdId: string,
  adminUserId: string,
): Promise<{ success: boolean; removedMemberIds: string[]; error?: string }> {
  const supabaseAdmin = createServiceClient()

  const { data: members } = await supabaseAdmin
    .from('household_members')
    .select('user_id, role')
    .eq('household_id', householdId)
    .eq('status', 'active')

  if (!members) {
    return { success: false, removedMemberIds: [], error: 'Failed to fetch members' }
  }

  const nonAdminIds = members
    .filter(m => m.user_id !== adminUserId)
    .map(m => m.user_id)

  if (nonAdminIds.length > 0) {
    await supabaseAdmin
      .from('household_members')
      .update({ status: 'removed', removed_at: new Date().toISOString() })
      .eq('household_id', householdId)
      .in('user_id', nonAdminIds)

    await supabaseAdmin
      .from('user_accounts')
      .update({ household_id: null, is_household_admin: false })
      .in('id', nonAdminIds)
  }

  await supabaseAdmin
    .from('household_invitations')
    .update({ status: 'canceled' })
    .eq('household_id', householdId)
    .eq('status', 'pending')

  await supabaseAdmin
    .from('households')
    .update({ plan_type: 'solo' })
    .eq('id', householdId)

  return { success: true, removedMemberIds: nonAdminIds }
}

/**
 * Convert removed member to solo household admin
 */
export async function convertToSoloHousehold(
  userId: string
): Promise<{ success: boolean; household?: Household; error?: string }> {
  const supabase = await createClient()
  
  // Create new solo household
  const { data: newHousehold, error: householdError } = await supabase
    .from('households')
    .insert({
      admin_user_id: userId,
      name: 'My Account',
      plan_type: 'solo',
      subscription_status: 'incomplete',
      shared_tokens_enabled: true
    })
    .select()
    .single()

  if (householdError || !newHousehold) {
    return { success: false, error: 'Failed to create household' }
  }

  // Create household_members record
  await supabase.from('household_members').insert({
    household_id: newHousehold.id,
    user_id: userId,
    role: 'admin',
    status: 'active',
    accepted_at: new Date().toISOString()
  })

  // Update user_accounts with household link
  await supabase
    .from('user_accounts')
    .update({
      household_id: newHousehold.id,
      is_household_admin: true
    })
    .eq('id', userId)

  return { success: true, household: newHousehold }
}

/**
 * Update member's token sharing preference
 */
export async function updateTokenSharingPreference(
  userId: string,
  allowSharedTokens: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  // Update in household_members
  const { error: memberError } = await supabase
    .from('household_members')
    .update({ allow_shared_tokens: allowSharedTokens })
    .eq('user_id', userId)

  if (memberError) {
    return { success: false, error: 'Failed to update preference' }
  }

  await supabase
    .from('user_accounts')
    .update({ allow_shared_tokens: allowSharedTokens })
    .eq('id', userId)

  return { success: true }
}

// =====================================================================
// TOKEN DEDUCTION (WITH HOUSEHOLD SHARING)
// =====================================================================

/**
 * Deduct tokens from user (with household sharing fallback)
 */
export async function deductTokens(
  userId: string,
  tokenAmount: number
): Promise<{ success: boolean; error?: string; usedSharedTokens?: boolean }> {
  const supabase = await createClient()

  // 1. Get user account with household info
  const { data: account, error: accountError } = await supabase
    .from('user_accounts')
    .select(`
      *,
      household:households!user_accounts_household_id_fkey(
        id,
        admin_user_id,
        shared_tokens_enabled
      )
    `)
    .eq('id', userId)
    .single()

  if (accountError || !account) {
    return { success: false, error: 'User account not found' }
  }

  // Get user's token balance (calculated from token_transactions and token_usage)
  const { data: userBalance, error: balanceError } = await supabase
    .rpc('get_user_token_balance', { p_user_id: userId })
    .single()

  if (balanceError) {
    console.error('Failed to get token balance:', balanceError)
    return { success: false, error: 'Failed to get token balance' }
  }

  const userTokens = (userBalance as any)?.total_active || 0

  // 2. Check if user has enough tokens individually
  if (userTokens >= tokenAmount) {
    // User has enough - deduction will happen automatically via trackTokenUsage()
    // Balance calculated as: SUM(unexpired grants) - SUM(usage)
    return { success: true, usedSharedTokens: false }
  }

  // 3. User doesn't have enough tokens - check household sharing
  const household = account.household as unknown as Household

  if (!household || !household.shared_tokens_enabled || !account.allow_shared_tokens) {
    return { success: false, error: 'Insufficient tokens' }
  }

  // Don't allow admin to pull from themselves (logic error)
  if (household.admin_user_id === userId) {
    return { success: false, error: 'Insufficient tokens' }
  }

  // 4. Get admin's token balance
  const { data: adminBalance, error: adminError } = await supabase
    .rpc('get_user_token_balance', { p_user_id: household.admin_user_id })
    .single()

  if (adminError) {
    return { success: false, error: 'Failed to get admin balance' }
  }

  const adminTokens = (adminBalance as any)?.total_active || 0
  const neededFromAdmin = tokenAmount - userTokens

  // 5. Check if household has enough cumulative tokens
  if (adminTokens < neededFromAdmin) {
    return { success: false, error: 'Insufficient household tokens' }
  }

  // 6. Household has enough tokens - allow the operation
  // Actual deduction happens automatically via trackTokenUsage()
  // Balance recalculated as: SUM(unexpired grants) - SUM(usage)
  // NOTE: This means household member will have negative individual balance
  //       but that's OK - their usage is tracked and household total covers it
  
  return { success: true, usedSharedTokens: true }
}

/**
 * Invite a partner to a household and send them an onboarding email.
 * Works with a provided supabaseAdmin client (for webhook/service contexts).
 */
export async function invitePartnerToHousehold(params: {
  supabaseAdmin: SupabaseClient
  householdId: string
  adminUserId: string
  adminName: string
  adminEmail: string
  householdName: string
  partnerFirstName?: string
  partnerLastName?: string
  partnerEmail: string
}): Promise<{ success: boolean; invitationToken?: string; partnerId?: string; error?: string }> {
  const {
    supabaseAdmin,
    householdId,
    adminUserId,
    adminName,
    adminEmail,
    householdName,
    partnerFirstName = '',
    partnerLastName = '',
    partnerEmail,
  } = params

  try {
    const firstName = partnerFirstName ? toTitleCase(partnerFirstName) : ''
    const lastName = partnerLastName ? toTitleCase(partnerLastName) : ''
    const fullName = `${firstName} ${lastName}`.trim()

    // ── 1. Create auth account (handle existing) ──
    const userMetadata: Record<string, string> = {
      invited_to_household: householdId,
    }
    if (firstName) userMetadata.first_name = firstName
    if (lastName) userMetadata.last_name = lastName
    if (fullName) userMetadata.full_name = fullName

    let partnerId: string | null = null

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: partnerEmail,
      email_confirm: true,
      user_metadata: userMetadata,
    })

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        // Look up existing user by email via user_accounts
        const { data: existing } = await supabaseAdmin
          .from('user_accounts')
          .select('id')
          .eq('email', partnerEmail)
          .maybeSingle()
        partnerId = existing?.id ?? null
        console.log('Partner already has auth account:', partnerId)
      } else {
        console.error('Failed to create partner auth account:', authError)
        return { success: false, error: 'Failed to create partner account' }
      }
    } else {
      partnerId = authData.user.id
      console.log('Created partner auth account:', partnerId)
    }

    if (!partnerId) {
      console.error('Could not resolve partner user ID')
      return { success: false, error: 'Could not resolve partner account' }
    }

    // ── 2. Provision household membership ──
    // Update user_accounts with household info (created by handle_new_user trigger)
    await supabaseAdmin
      .from('user_accounts')
      .update({
        household_id: householdId,
        is_household_admin: false,
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastName ? { last_name: lastName } : {}),
      })
      .eq('id', partnerId)

    // Add to household_members as active (idempotent via upsert)
    const { error: memberError } = await supabaseAdmin
      .from('household_members')
      .upsert(
        {
          household_id: householdId,
          user_id: partnerId,
          role: 'member' as const,
          status: 'active' as const,
          allow_shared_tokens: true,
          invited_by: adminUserId,
          invited_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
        { onConflict: 'household_id,user_id', ignoreDuplicates: false },
      )

    if (memberError) {
      console.error('Failed to add partner as household member:', memberError)
    } else {
      console.log('Partner added as active household member:', partnerId)
    }

    // ── 3. Record invitation (auto-accepted) ──
    // Cancel any stale pending invitations for this email first
    await supabaseAdmin
      .from('household_invitations')
      .update({ status: 'canceled' })
      .eq('household_id', householdId)
      .eq('invited_email', partnerEmail)
      .eq('status', 'pending')

    const invitationToken = crypto.randomUUID()
    await supabaseAdmin.from('household_invitations').insert({
      household_id: householdId,
      invited_email: partnerEmail,
      invited_by: adminUserId,
      invitation_token: invitationToken,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })

    // ── 4. Generate magic link → setup-password → dashboard ──
    let invitationLink = `${OUTBOUND_URL}/auth/login`

    const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: partnerEmail,
    })

    if (magicLinkError) {
      console.error('Failed to generate magic link for partner:', magicLinkError)
    } else if (magicLinkData?.properties?.hashed_token) {
      const hashedToken = magicLinkData.properties.hashed_token
      invitationLink = `${OUTBOUND_URL}/auth/callback?token_hash=${hashedToken}&type=magiclink`
      console.log('Magic link generated for partner:', partnerEmail)
    }

    // ── 5. Send welcome email ──
    const { sendAndLogEmail } = await import('@/lib/email/send')
    const { generateHouseholdInvitationEmail } = await import('@/lib/email/templates/household-invitation')

    const emailContent = await generateHouseholdInvitationEmail({
      inviterName: adminName,
      inviterEmail: adminEmail,
      householdName,
      invitationLink,
      expiresInDays: 7,
    })

    await sendAndLogEmail({
      to: partnerEmail,
      subject: emailContent.subject,
      htmlBody: emailContent.htmlBody,
      textBody: emailContent.textBody,
      context: { guestEmail: partnerEmail },
    })

    console.log(`[household] Invitation email sent to partner: ${partnerEmail}`)

    const { triggerEvent } = await import('@/lib/messaging/events')
    triggerEvent('household.invited', {
      email: partnerEmail,
      name: fullName,
      userId: adminUserId,
    }).catch((err) => console.error('triggerEvent household.invited error:', err))

    return { success: true, invitationToken, partnerId }
  } catch (error) {
    console.error('Error inviting partner to household:', error)
    return { success: false, error: 'Failed to invite partner' }
  }
}


