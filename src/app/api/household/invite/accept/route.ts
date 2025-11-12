// Accept Household Invitation API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { acceptHouseholdInvitation } from '@/lib/supabase/household'

// =====================================================================
// POST /api/household/invite/accept - Accept invitation
// =====================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in first' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { invitation_token } = body

    if (!invitation_token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Check if user is already in a household
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('household_id, is_household_admin')
      .eq('user_id', user.id)
      .single()

    if (existingProfile?.household_id) {
      // User is already in a household
      if (existingProfile.is_household_admin) {
        return NextResponse.json(
          { 
            error: 'You are currently the admin of a household. Please leave or transfer your household first.' 
          },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { 
            error: 'You are already a member of a household. Please leave your current household first.' 
          },
          { status: 400 }
        )
      }
    }

    // Accept invitation
    const result = await acceptHouseholdInvitation({
      invitationToken: invitation_token,
      userId: user.id
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to accept invitation' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      household: result.household,
      message: `Welcome to ${result.household?.name}!`
    })
  } catch (error) {
    console.error('Error in POST /api/household/invite/accept:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

