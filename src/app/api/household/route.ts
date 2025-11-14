// Household API - Main routes for household management
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getUserHousehold,
  getHouseholdWithMembers,
  getHouseholdTokenSummary,
  updateHousehold
} from '@/lib/supabase/household'

// =====================================================================
// GET /api/household - Get current user's household
// =====================================================================

export async function GET(request: NextRequest) {
  try {
    console.log('[GET /api/household] Starting request...')
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('[GET /api/household] Auth check:', { userId: user?.id, authError })
    
    if (authError || !user) {
      console.error('[GET /api/household] Unauthorized:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const includeMembers = searchParams.get('includeMembers') === 'true'
    const includeTokens = searchParams.get('includeTokens') === 'true'
    console.log('[GET /api/household] Query params:', { includeMembers, includeTokens })

    // Get household
    console.log('[GET /api/household] Fetching household for user:', user.id)
    const household = await getUserHousehold(user.id)
    console.log('[GET /api/household] Household result:', household ? `Found: ${household.id}` : 'Not found')
    
    if (!household) {
      console.log('[GET /api/household] No household found for user')
      return NextResponse.json(
        { error: 'Household not found' },
        { status: 404 }
      )
    }

    // Build response
    const response: any = { 
      household,
      isAdmin: household.admin_user_id === user.id,
      currentUserId: user.id
    }

    // Include members if requested
    if (includeMembers) {
      const householdWithMembers = await getHouseholdWithMembers(household.id)
      response.members = householdWithMembers?.members || []
      response.invitations = householdWithMembers?.invitations || []
    }

    // Include token summary if requested
    if (includeTokens) {
      const tokenSummary = await getHouseholdTokenSummary(household.id)
      response.tokenSummary = tokenSummary
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/household:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================================
// PATCH /api/household - Update household settings (admin only)
// =====================================================================

export async function PATCH(request: NextRequest) {
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
    const { name, shared_tokens_enabled } = body

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
        { error: 'Only household admin can update settings' },
        { status: 403 }
      )
    }

    // Update household
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (shared_tokens_enabled !== undefined) updates.shared_tokens_enabled = shared_tokens_enabled

    const updatedHousehold = await updateHousehold(household.id, updates)
    
    if (!updatedHousehold) {
      return NextResponse.json(
        { error: 'Failed to update household' },
        { status: 500 }
      )
    }

    return NextResponse.json({ household: updatedHousehold })
  } catch (error) {
    console.error('Error in PATCH /api/household:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

