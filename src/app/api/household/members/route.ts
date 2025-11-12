// Household Members API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getUserHousehold,
  getHouseholdWithMembers,
  removeMemberFromHousehold 
} from '@/lib/supabase/household'

// =====================================================================
// GET /api/household/members - Get all household members (admin only)
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

    // Get user's household
    const household = await getUserHousehold(user.id)
    if (!household) {
      return NextResponse.json(
        { error: 'Household not found' },
        { status: 404 }
      )
    }

    // Get household with members
    const householdWithMembers = await getHouseholdWithMembers(household.id)
    if (!householdWithMembers) {
      return NextResponse.json(
        { error: 'Failed to fetch household members' },
        { status: 500 }
      )
    }

    // Calculate totals
    const totalTokensRemaining = householdWithMembers.members.reduce(
      (sum, member) => sum + (member.profile?.vibe_assistant_tokens_remaining || 0),
      0
    )
    const totalTokensUsed = householdWithMembers.members.reduce(
      (sum, member) => sum + (member.profile?.vibe_assistant_tokens_used || 0),
      0
    )

    return NextResponse.json({
      household: householdWithMembers.household,
      members: householdWithMembers.members.map(member => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        status: member.status,
        allow_shared_tokens: member.allow_shared_tokens,
        joined_at: member.joined_at,
        first_name: member.profile?.first_name,
        last_name: member.profile?.last_name,
        email: member.profile?.email,
        profile_picture_url: member.profile?.profile_picture_url,
        tokens_remaining: member.profile?.vibe_assistant_tokens_remaining || 0,
        tokens_used: member.profile?.vibe_assistant_tokens_used || 0
      })),
      summary: {
        total_members: householdWithMembers.members.length,
        total_tokens_remaining: totalTokensRemaining,
        total_tokens_used: totalTokensUsed,
        shared_tokens_enabled: householdWithMembers.household.shared_tokens_enabled,
        max_members: householdWithMembers.household.max_members
      }
    })
  } catch (error) {
    console.error('Error in GET /api/household/members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================================
// DELETE /api/household/members?userId={userId} - Remove member (admin only)
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

    // Get userId from query params
    const { searchParams } = new URL(request.url)
    const userIdToRemove = searchParams.get('userId')

    if (!userIdToRemove) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Prevent removing yourself
    if (userIdToRemove === user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself. Transfer admin rights first.' },
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
        { error: 'Only household admin can remove members' },
        { status: 403 }
      )
    }

    // Verify the user to remove is actually in this household
    const { data: memberToRemove } = await supabase
      .from('household_members')
      .select('id, role')
      .eq('household_id', household.id)
      .eq('user_id', userIdToRemove)
      .eq('status', 'active')
      .single()

    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'User is not a member of this household' },
        { status: 404 }
      )
    }

    // Cannot remove another admin
    if (memberToRemove.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot remove another admin' },
        { status: 400 }
      )
    }

    // Remove member
    const result = await removeMemberFromHousehold(household.id, userIdToRemove)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to remove member' },
        { status: 500 }
      )
    }

    // TODO: Send notification email to removed member
    // await sendMemberRemovedEmail({
    //   to: removedMemberEmail,
    //   householdName: household.name
    // })

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/household/members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

