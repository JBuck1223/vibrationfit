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
    console.log('Profile API: Starting request')
    
    let supabase
    try {
      supabase = createClient()
      console.log('Profile API: Supabase client created successfully')
    } catch (supabaseError) {
      console.error('Profile API: Failed to create Supabase client:', supabaseError)
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    console.log('Profile API: User check', { user: user?.id, error: userError })

    if (userError || !user) {
      console.log('Profile API: Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user profile
    console.log('Profile API: Fetching profile for user', user.id)
    
    let profile, profileError
    try {
      const result = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      profile = result.data
      profileError = result.error
      console.log('Profile API: Profile fetch result', { profile, error: profileError })
    } catch (tableError) {
      console.error('Profile API: Table access error:', tableError)
      return NextResponse.json({ 
        error: 'Table access failed. Please ensure user_profiles table exists.' 
      }, { status: 500 })
    }

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

    const response = {
      profile: profile || {},
      completionPercentage: completionPercentage
    }
    
    console.log('Profile API: Returning response', response)
    return NextResponse.json(response)
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