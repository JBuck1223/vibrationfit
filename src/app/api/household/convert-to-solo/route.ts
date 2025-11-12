// Convert removed member to solo household admin
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { convertToSoloHousehold } from '@/lib/supabase/household'

// =====================================================================
// POST /api/household/convert-to-solo - Convert to solo household
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

    // Check user's current household status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        household_id,
        is_household_admin,
        household_member:household_members!household_members_user_id_fkey(status)
      `)
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user is already a solo admin
    if (profile.is_household_admin) {
      return NextResponse.json(
        { error: 'You are already a household admin' },
        { status: 400 }
      )
    }

    // Check if user was removed from their household
    const householdMember = profile.household_member?.[0]
    if (!householdMember || householdMember.status !== 'removed') {
      return NextResponse.json(
        { error: 'You must be removed from a household before converting to solo' },
        { status: 400 }
      )
    }

    // Convert to solo household
    const result = await convertToSoloHousehold(user.id)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create solo household' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      household: result.household,
      message: 'Solo household created successfully',
      // Redirect user to subscription page to complete setup
      redirect_to: '/subscribe?plan=solo&household_id=' + result.household?.id
    })
  } catch (error) {
    console.error('Error in POST /api/household/convert-to-solo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================================
// GET /api/household/convert-to-solo - Check if user can convert
// =====================================================================

export async function GET(request: NextRequest) {
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

    // Check user's current status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        household_id,
        is_household_admin,
        household_member:household_members!household_members_user_id_fkey(
          status,
          removed_at
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const householdMember = profile.household_member?.[0]
    const canConvert = 
      !profile.is_household_admin && 
      householdMember?.status === 'removed'

    return NextResponse.json({
      can_convert: canConvert,
      is_admin: profile.is_household_admin,
      member_status: householdMember?.status || null,
      removed_at: householdMember?.removed_at || null
    })
  } catch (error) {
    console.error('Error in GET /api/household/convert-to-solo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

