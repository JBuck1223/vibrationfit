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
  console.log('Profile API: Route called')
  
  try {
    // Try to create Supabase client
    let supabase
    try {
      supabase = createClient()
      console.log('Profile API: Supabase client created')
    } catch (supabaseError) {
      console.error('Profile API: Supabase client failed:', supabaseError)
      // Return empty profile if Supabase is not configured
      return NextResponse.json({
        profile: {},
        completionPercentage: 0,
        message: 'Supabase not configured - returning empty profile'
      })
    }
    
    // Try to get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('Profile API: No authenticated user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Profile API: User authenticated:', user.id)
    
    // Try to fetch profile (gracefully handle if table doesn't exist)
    let profile = {}
    let completionPercentage = 0
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.log('Profile API: Table access error (table may not exist):', profileError.message)
        // Continue with empty profile
      } else {
        profile = profileData || {}
        console.log('Profile API: Profile loaded successfully')
      }
    } catch (tableError) {
      console.log('Profile API: Table not accessible (may not exist):', tableError)
      // Continue with empty profile
    }
    
    // Calculate completion percentage
    completionPercentage = calculateCompletionManually(profile)
    
    return NextResponse.json({
      profile,
      completionPercentage,
      message: 'Profile loaded successfully'
    })
    
  } catch (error) {
    console.error('Profile API error:', error)
    // Return empty profile instead of error
    return NextResponse.json({
      profile: {},
      completionPercentage: 0,
      message: 'Error occurred - returning empty profile'
    })
  }
}

export async function POST(request: NextRequest) {
  console.log('Profile API POST: Route called')
  
  try {
    // Try to create Supabase client
    let supabase
    try {
      supabase = createClient()
    } catch (supabaseError) {
      console.error('Profile API POST: Supabase client failed:', supabaseError)
      return NextResponse.json({ 
        message: 'Supabase not configured - cannot save profile',
        profile: {}
      })
    }
    
    // Try to get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const profileData = await request.json()
    
    // Try to save profile (gracefully handle if table doesn't exist)
    try {
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
        console.log('Profile API POST: Save error (table may not exist):', error.message)
        return NextResponse.json({ 
          message: 'Profile table not available - cannot save',
          profile: profileData
        })
      }

      return NextResponse.json({ 
        message: 'Profile saved successfully',
        profile: data 
      })
    } catch (tableError) {
      console.log('Profile API POST: Table not accessible:', tableError)
      return NextResponse.json({ 
        message: 'Profile table not accessible - cannot save',
        profile: profileData
      })
    }
    
  } catch (error) {
    console.error('Profile API POST error:', error)
    return NextResponse.json({ 
      message: 'Error occurred - cannot save profile',
      profile: {}
    })
  }
}