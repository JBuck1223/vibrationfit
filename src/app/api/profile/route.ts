import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Manual completion calculation fallback
function calculateCompletionManually(profile: any): number {
  if (!profile) return 0
  
  const fields = [
    'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender',
    'relationship_status', 'partner_name', 'children_count', 'children_names',
    'health_conditions', 'medications', 'exercise_frequency', 'living_situation',
    'time_at_location', 'city', 'state', 'postal_code', 'country',
    'employment_type', 'occupation', 'company', 'time_in_role', 'household_income'
  ]
  
  const completedFields = fields.filter(field => 
    profile[field] !== null && profile[field] !== undefined && profile[field] !== ''
  ).length
  
  return Math.round((completedFields / fields.length) * 100)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Calculate completion percentage
    let completionPercentage = 0
    try {
      const { data: completionData, error: completionError } = await supabase
        .rpc('calculate_profile_completion', { p_user_id: user.id })

      if (completionError) {
        console.error('Error calculating completion:', completionError)
        // Fallback: calculate manually if RPC fails
        completionPercentage = calculateCompletionManually(profile)
      } else {
        completionPercentage = completionData || 0
      }
    } catch (error) {
      console.error('RPC function not available, calculating manually:', error)
      completionPercentage = calculateCompletionManually(profile)
    }

    return NextResponse.json({
      profile: profile || {},
      completionPercentage: completionPercentage
    })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profileData = await request.json()

    // Update or insert profile
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        ...profileData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving profile:', error)
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('Profile save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}