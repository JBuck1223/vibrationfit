// Household Invitation API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  getUserHousehold,
  createHouseholdInvitation,
  acceptHouseholdInvitation
} from '@/lib/supabase/household'
import { sendEmail } from '@/lib/email/aws-ses'
import { generateHouseholdInvitationEmail } from '@/lib/email/templates/household-invitation'
import { triggerEvent } from '@/lib/messaging/events'

// =====================================================================
// POST /api/household/invite - Create invitation (admin only)
// =====================================================================

export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get user's household
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
        { error: 'Only household admin can invite members' },
        { status: 403 }
      )
    }

    // Check if household is at max capacity
    const { data: members } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', household.id)
      .eq('status', 'active')
    
    if (members && members.length >= household.max_members) {
      return NextResponse.json(
        { error: `Household is at maximum capacity (${household.max_members} members)` },
        { status: 400 }
      )
    }

    // Check if email is already invited or a member
    const { data: existingInvite } = await supabase
      .from('household_invitations')
      .select('id')
      .eq('household_id', household.id)
      .eq('invited_email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'This email already has a pending invitation' },
        { status: 400 }
      )
    }

    // Check if user with this email is already a member
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      const { data: existingMember } = await supabase
        .from('household_members')
        .select('id')
        .eq('household_id', household.id)
        .eq('user_id', existingUser.id)
        .eq('status', 'active')
        .single()

      if (existingMember) {
        return NextResponse.json(
          { error: 'This user is already a member of your household' },
          { status: 400 }
        )
      }
    }

    // Create invitation
    const invitation = await createHouseholdInvitation({
      householdId: household.id,
      invitedEmail: email,
      invitedBy: user.id
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Get inviter profile for email
    const { data: inviterProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    const inviterName = inviterProfile?.first_name 
      ? `${inviterProfile.first_name} ${inviterProfile.last_name || ''}`.trim()
      : user.email?.split('@')[0] || 'A VibrationFit user'

    // Send invitation email via AWS SES
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'
      const invitationLink = `${appUrl}/household/invite/${invitation.invitation_token}`
      
      const emailContent = await generateHouseholdInvitationEmail({
        inviterName,
        inviterEmail: user.email || '',
        householdName: household.name,
        invitationLink,
        expiresInDays: 7, // Invitations expire in 7 days
      })

      await sendEmail({
        to: email,
        subject: emailContent.subject,
        htmlBody: emailContent.htmlBody,
        textBody: emailContent.textBody,
      })

      console.log('✅ Household invitation email sent to:', email)
    } catch (emailError) {
      console.error('❌ Failed to send invitation email:', emailError)
    }

    triggerEvent('household.invited', { email }).catch((err) =>
      console.error('triggerEvent error:', err)
    )

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        invited_email: invitation.invited_email,
        status: invitation.status,
        expires_at: invitation.expires_at
      },
      // Include invitation URL (useful if email fails or for testing)
      invitation_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL}/household/invite/${invitation.invitation_token}`
    })
  } catch (error) {
    console.error('Error in POST /api/household/invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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

