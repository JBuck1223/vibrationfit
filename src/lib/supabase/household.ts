// Household management types and utilities
import { createClient } from './server'

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
 */
export async function getUserHousehold(userId: string): Promise<Household | null> {
  const supabase = await createClient()
  
  // First get the household_id from household_members (using service role to bypass RLS)
  const { data: membership, error: memberError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (memberError || !membership) {
    console.error('Error fetching user household membership:', memberError)
    return null
  }

  // Then get the household details
  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('*')
    .eq('id', membership.household_id)
    .single()

  if (householdError || !household) {
    console.error('Error fetching household:', householdError)
    return null
  }

  return household
}

/**
 * Get household with all members and invitations
 */
export async function getHouseholdWithMembers(
  householdId: string
): Promise<{ household: Household; members: HouseholdMemberWithProfile[]; invitations: any[] } | null> {
  const supabase = await createClient()
  
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
    .select(`
      *,
      profile:user_profiles!household_members_user_id_fkey(
        first_name,
        last_name,
        email,
        profile_picture_url
      )
    `)
    .eq('household_id', householdId)
    .eq('status', 'active')

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
    members: (members as unknown as HouseholdMemberWithProfile[]) || [],
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
    .from('user_profiles')
    .select(`
      allow_shared_tokens,
      household:households!user_profiles_household_id_fkey(shared_tokens_enabled)
    `)
    .eq('user_id', userId)
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
      max_members: params.planType === 'solo' ? 1 : 6,
      shared_tokens_enabled: false
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

  // Update user_profiles
  await supabase
    .from('user_profiles')
    .update({
      household_id: data.id,
      is_household_admin: true
    })
    .eq('user_id', params.adminUserId)

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
  const supabase = await createClient()
  
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
 * Accept household invitation
 */
export async function acceptHouseholdInvitation(params: {
  invitationToken: string
  userId: string
}): Promise<{ success: boolean; household?: Household; error?: string }> {
  const supabase = await createClient()
  
  // Get invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('household_invitations')
    .select('*')
    .eq('invitation_token', params.invitationToken)
    .eq('status', 'pending')
    .single()

  if (inviteError || !invitation) {
    return { success: false, error: 'Invitation not found or expired' }
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from('household_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)
    
    return { success: false, error: 'Invitation has expired' }
  }

  // Get household
  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('*')
    .eq('id', invitation.household_id)
    .single()

  if (householdError || !household) {
    return { success: false, error: 'Household not found' }
  }

  // Add user to household
  const { error: memberError } = await supabase
    .from('household_members')
    .insert({
      household_id: invitation.household_id,
      user_id: params.userId,
      role: 'member',
      status: 'active',
      invited_by: invitation.invited_by,
      accepted_at: new Date().toISOString()
    })

  if (memberError) {
    return { success: false, error: 'Failed to add member to household' }
  }

  // Update user_profiles
  await supabase
    .from('user_profiles')
    .update({
      household_id: invitation.household_id,
      is_household_admin: false
    })
    .eq('user_id', params.userId)

  // Mark invitation as accepted
  await supabase
    .from('household_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
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

  // Note: We don't immediately clear household_id from user_profiles
  // This allows for potential re-invite or recovery
  // Admin can choose to fully remove later

  return { success: true }
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
      subscription_status: 'incomplete', // Needs to subscribe
      max_members: 1,
      shared_tokens_enabled: false
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

  // Update user_profiles
  await supabase
    .from('user_profiles')
    .update({
      household_id: newHousehold.id,
      is_household_admin: true
    })
    .eq('user_id', userId)

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

  // Also update in user_profiles for consistency
  await supabase
    .from('user_profiles')
    .update({ allow_shared_tokens: allowSharedTokens })
    .eq('user_id', userId)

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

  // 1. Get user profile with household info
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select(`
      *,
      household:households!user_profiles_household_id_fkey(
        id,
        admin_user_id,
        shared_tokens_enabled
      ),
      household_member:household_members!household_members_user_id_fkey(
        allow_shared_tokens
      )
    `)
    .eq('user_id', userId)
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'User profile not found' }
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
  const household = profile.household as unknown as Household
  const householdMember = profile.household_member?.[0] as unknown as HouseholdMember

  if (!household || !household.shared_tokens_enabled || !householdMember?.allow_shared_tokens) {
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

