import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('🚀 PROFILE API GET REQUEST STARTED')
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const versionId = searchParams.get('versionId')
    const includeVersions = searchParams.get('includeVersions') === 'true'

    // If requesting a specific version
    if (versionId) {
      try {
        const { data: version, error: versionError } = await supabase
          .from('profile_versions')
          .select('*')
          .eq('id', versionId)
          .eq('user_id', user.id)
          .single()

        if (versionError) {
          console.error('Version fetch error:', versionError)
          return NextResponse.json({ error: 'Version not found' }, { status: 404 })
        }

        return NextResponse.json({
          profile: version.profile_data,
          completionPercentage: version.completion_percentage,
          version: {
            id: version.id,
            version_number: version.version_number,
            is_draft: version.is_draft,
            created_at: version.created_at,
            updated_at: version.updated_at
          }
        })
      } catch (dbError) {
        console.error('Database error:', dbError)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }

    // Get current profile (use most recent data from either table)
    try {
      let profile = null
      let completionPercentage = 0
      let versions: any[] = []

      // Get latest profile version
      const { data: latestVersion, error: versionError } = await supabase
        .from('profile_versions')
        .select('*')
        .eq('user_id', user.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      // Get current user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Use whichever has the most recent updated_at timestamp
      if (userProfile && latestVersion) {
        const userProfileDate = new Date(userProfile.updated_at)
        const versionDate = new Date(latestVersion.updated_at)
        
        console.log('Profile API: userProfile updated_at:', userProfile.updated_at)
        console.log('Profile API: latestVersion updated_at:', latestVersion.updated_at)
        console.log('Profile API: userProfileDate > versionDate:', userProfileDate > versionDate)
        
        if (userProfileDate > versionDate) {
          // User profile is more recent
          profile = userProfile
          completionPercentage = calculateCompletionManually(userProfile)
          console.log('Profile API: Using userProfile, completion:', completionPercentage)
          console.log('Profile API: Manual calculation details:', {
            totalFormFields: 25,
            completedFormFields: ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender',
              'relationship_status', 'partner_name', 'number_of_children', 'children_ages',
              'units', 'height', 'weight', 'exercise_frequency', 'living_situation',
              'time_at_location', 'city', 'state', 'postal_code', 'country',
              'employment_type', 'occupation', 'company', 'time_in_role', 'household_income',
              'profile_picture_url'].filter(field =>
                userProfile[field] !== null && 
                userProfile[field] !== undefined && 
                userProfile[field] !== ''
              ).length,
            allProfileKeys: Object.keys(userProfile)
          })
        } else {
          // Version is more recent
          profile = latestVersion.profile_data
          completionPercentage = latestVersion.completion_percentage
          console.log('Profile API: Using latestVersion, completion:', completionPercentage)
        }
      } else if (userProfile) {
        // Only user profile exists
        profile = userProfile
        completionPercentage = calculateCompletionManually(userProfile)
        console.log('Profile API: Only userProfile exists, completion:', completionPercentage)
      } else if (latestVersion) {
        // Only version exists
        profile = latestVersion.profile_data
        completionPercentage = latestVersion.completion_percentage
        console.log('Profile API: Only latestVersion exists, completion:', completionPercentage)
      } else {
        // Neither exists
        profile = {}
        completionPercentage = 0
        console.log('Profile API: No profile data exists')
      }

      // Get all versions if requested
      if (includeVersions) {
        console.log('🔍 PROFILE API: Fetching versions for user:', user.id)
        const { data: allVersions, error: versionsError } = await supabase
          .from('profile_versions')
          .select('id, version_number, completion_percentage, is_draft, created_at, updated_at')
          .eq('user_id', user.id)
          .order('version_number', { ascending: false })

        if (versionsError) {
          console.error('❌ PROFILE API: Versions fetch error:', versionsError)
        } else {
          console.log('✅ PROFILE API: Found versions:', allVersions?.length || 0)
          versions = allVersions || []
        }
      }

      // Debug: Log the final response
      console.log('🎯 PROFILE API: Final response - completionPercentage:', completionPercentage)
      console.log('📊 PROFILE API: Profile keys:', Object.keys(profile || {}))
      console.log('📋 PROFILE API: Versions being returned:', versions.length)
      console.log('✅ PROFILE API: Returning data to client')

      return NextResponse.json({
        profile,
        completionPercentage,
        versions
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({
        profile: {},
        completionPercentage: 0,
        versions: []
      })
    }
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  console.log('🗑️ PROFILE API DELETE REQUEST STARTED')
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const versionId = searchParams.get('versionId')

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID is required' }, { status: 400 })
    }

    // Delete the version
    const { error: deleteError } = await supabase
      .from('profile_versions')
      .delete()
      .eq('id', versionId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Version delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 })
    }

    console.log('✅ PROFILE API: Version deleted successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile API delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { profileData, saveAsVersion = false, isDraft = true } = await request.json()

    if (!profileData) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 })
    }

    // Debug: Log what data is being received
    console.log('Profile API: Received profile data:', JSON.stringify(profileData, null, 2))

    try {
      if (saveAsVersion) {
        // Create a new profile version
        const { data: versionId, error: versionError } = await supabase
          .rpc('create_profile_version', {
            user_uuid: user.id,
            profile_data: profileData,
            is_draft: isDraft
          })

        if (versionError) {
          console.error('Version creation error:', versionError)
          throw versionError
        }

        // Get the created version
        const { data: version, error: fetchError } = await supabase
          .from('profile_versions')
          .select('*')
          .eq('id', versionId)
          .single()

        if (fetchError) {
          console.error('Version fetch error:', fetchError)
          throw fetchError
        }

        // Update user stats if not a draft
        if (!isDraft) {
          await supabase.rpc('update_profile_stats', { user_uuid: user.id })
        }

        return NextResponse.json({
          profile: version.profile_data,
          completionPercentage: version.completion_percentage,
          version: {
            id: version.id,
            version_number: version.version_number,
            is_draft: version.is_draft,
            created_at: version.created_at,
            updated_at: version.updated_at
          }
        })
      } else {
        // Regular profile update (user_profiles table)
        const { data: profile, error: profileError } = await supabase
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

        if (profileError) {
          console.error('Profile save error:', profileError)
          throw profileError
        }

        // Calculate completion percentage
        let completionPercentage = 0
        try {
          const { data: completionData, error: completionError } = await supabase
            .rpc('calculate_profile_completion', { profile_data: profile })
          
          if (!completionError && completionData) {
            completionPercentage = completionData
          }
        } catch (rpcError) {
          console.log('RPC not available, using manual calculation')
          completionPercentage = calculateCompletionManually(profile)
        }

        return NextResponse.json({
          profile,
          completionPercentage
        })
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        message: 'Error occurred - cannot save profile',
        profile: {}
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Fallback completion calculation function
function calculateCompletionManually(profileData: any): number {
  if (!profileData) return 0

  // Only count actual form fields that exist in the UI, not database metadata
  const formFields = [
    'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender',
    'relationship_status', 'partner_name', 'number_of_children', 'children_ages',
    'units', 'height', 'weight', 'exercise_frequency', 'living_situation',
    'time_at_location', 'city', 'state', 'postal_code', 'country',
    'employment_type', 'occupation', 'company', 'time_in_role', 'household_income',
    'profile_picture_url'
  ]

  const completedFields = formFields.filter(field =>
    profileData[field] !== null &&
    profileData[field] !== undefined &&
    profileData[field] !== ''
  )

  const missingFields = formFields.filter(field =>
    profileData[field] === null ||
    profileData[field] === undefined ||
    profileData[field] === ''
  )

  console.log('🔢 Manual calculation:', {
    totalFormFields: formFields.length,
    completedFormFields: completedFields.length,
    percentage: Math.round((completedFields.length / formFields.length) * 100),
    completedFields: completedFields,
    missingFields: missingFields
  })

  return Math.round((completedFields.length / formFields.length) * 100)
}