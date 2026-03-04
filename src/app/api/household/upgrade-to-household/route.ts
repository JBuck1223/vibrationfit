import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { invitePartnerToHousehold } from '@/lib/supabase/household'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceClient = createServiceClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { partnerFirstName, partnerLastName, partnerEmail } = body as {
      partnerFirstName?: string
      partnerLastName?: string
      partnerEmail?: string
    }

    if (!partnerFirstName?.trim() || !partnerLastName?.trim() || !partnerEmail?.trim()) {
      return NextResponse.json(
        { error: 'Partner first name, last name, and email are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(partnerEmail)) {
      return NextResponse.json({ error: 'Invalid partner email format' }, { status: 400 })
    }

    if (partnerEmail.trim().toLowerCase() === user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Partner email must be different from your own' },
        { status: 400 }
      )
    }

    // Check current household membership
    const { data: membership } = await serviceClient
      .from('household_members')
      .select('household_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'No active household found for your account' },
        { status: 404 }
      )
    }

    if (membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only the household admin can upgrade to a household plan' },
        { status: 403 }
      )
    }

    const { data: household } = await serviceClient
      .from('households')
      .select('*')
      .eq('id', membership.household_id)
      .single()

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Upgrade household to 2 seats if it's currently solo (max_members = 1)
    if (household.max_members < 2) {
      await serviceClient
        .from('households')
        .update({
          max_members: 2,
          shared_tokens_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', household.id)
    }

    // Check capacity -- allow if fewer than 2 active members
    const { data: activeMembers } = await serviceClient
      .from('household_members')
      .select('id')
      .eq('household_id', household.id)
      .eq('status', 'active')

    if (activeMembers && activeMembers.length >= 2) {
      return NextResponse.json(
        { error: 'Household already has the maximum number of members' },
        { status: 400 }
      )
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await serviceClient
      .from('household_invitations')
      .select('id')
      .eq('household_id', household.id)
      .eq('invited_email', partnerEmail.trim().toLowerCase())
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'This email already has a pending invitation' },
        { status: 400 }
      )
    }

    // Get admin profile for the invitation email
    const { data: adminProfile } = await serviceClient
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    const adminName = adminProfile?.first_name
      ? `${adminProfile.first_name} ${adminProfile.last_name || ''}`.trim()
      : user.email?.split('@')[0] || 'A VibrationFit user'

    const result = await invitePartnerToHousehold({
      supabaseAdmin: serviceClient,
      householdId: household.id,
      adminUserId: user.id,
      adminName,
      adminEmail: user.email || '',
      householdName: household.name,
      partnerFirstName: partnerFirstName.trim(),
      partnerLastName: partnerLastName.trim(),
      partnerEmail: partnerEmail.trim().toLowerCase(),
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to invite partner' },
        { status: 500 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'

    return NextResponse.json({
      success: true,
      invitation_url: `${appUrl}/household/invite/${result.invitationToken}`,
      message: `Invitation sent to ${partnerEmail}`,
    })
  } catch (error) {
    console.error('Error in POST /api/household/upgrade-to-household:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
