// Household Invitation API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  getUserHousehold,
  invitePartnerToHousehold,
} from '@/lib/supabase/household'

// =====================================================================
// POST /api/household/invite - Create invitation (admin only)
// Creates auth account + magic link so partner can onboard seamlessly.
// =====================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, firstName, lastName } = body as {
      email?: string
      firstName?: string
      lastName?: string
    }

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 })
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const household = await getUserHousehold(user.id)
    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    if (household.admin_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only household admin can invite members' },
        { status: 403 },
      )
    }

    const { data: members } = await serviceClient
      .from('household_members')
      .select('id')
      .eq('household_id', household.id)
      .eq('status', 'active')

    const { data: existingInvite } = await serviceClient
      .from('household_invitations')
      .select('id')
      .eq('household_id', household.id)
      .eq('invited_email', email.trim().toLowerCase())
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'This email already has a pending invitation' },
        { status: 400 },
      )
    }

    const { data: inviterAccount } = await serviceClient
      .from('user_accounts')
      .select('first_name, last_name')
      .eq('id', user.id)
      .maybeSingle()

    const inviterName = inviterAccount?.first_name
      ? `${inviterAccount.first_name} ${inviterAccount.last_name || ''}`.trim()
      : 'A VibrationFit member'

    const result = await invitePartnerToHousehold({
      supabaseAdmin: serviceClient,
      householdId: household.id,
      adminUserId: user.id,
      adminName: inviterName,
      adminEmail: user.email || '',
      householdName: household.name,
      partnerFirstName: firstName?.trim(),
      partnerLastName: lastName?.trim(),
      partnerEmail: email.trim().toLowerCase(),
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create invitation' },
        { status: 500 },
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'

    return NextResponse.json({
      invitation: {
        invited_email: email.trim().toLowerCase(),
        status: 'pending',
      },
      invitation_url: `${appUrl}/household/invite/${result.invitationToken}`,
    })
  } catch (error) {
    console.error('Error in POST /api/household/invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =====================================================================
// GET /api/household/invite?token={token} - Get invitation details
// =====================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get token from query params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Get invitation
    const { data: invitation, error } = await supabase
      .from('household_invitations')
      .select(`
        *,
        household:households!household_invitations_household_id_fkey(
          id,
          name,
          plan_type
        )
      `)
      .eq('invitation_token', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (new Date(invitation.expires_at as string) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      )
    }

    // Check if already accepted
    if ((invitation as any).status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation is ${(invitation as any).status}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      invitation: {
        household_name: (invitation as any).household.name,
        invited_email: (invitation as any).invited_email,
        expires_at: (invitation as any).expires_at,
        invitation_status: (invitation as any).status
      }
    })
  } catch (error) {
    console.error('Error in GET /api/household/invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================================
// DELETE /api/household/invite?id={invitationId} - Cancel invitation (admin only)
// =====================================================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get invitation ID from query params
    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    // Get user's household to verify they're admin
    const household = await getUserHousehold(user.id)
    if (!household) {
      return NextResponse.json(
        { error: 'Household not found' },
        { status: 404 }
      )
    }

    // Check if user is admin
    if (household.admin_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only household admin can cancel invitations' },
        { status: 403 }
      )
    }

    // Delete the invitation using service role client to bypass RLS
    const serviceClient = createServiceClient()
    const { error: deleteError } = await serviceClient
      .from('household_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('household_id', household.id) // Ensure it's their household
      .eq('status', 'pending') // Can only delete pending invitations

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError)
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/household/invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

