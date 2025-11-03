import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper function to calculate profile completion percentage
async function calculateProfileCompletion(profileData: any): Promise<number> {
  const sections = [
    'personal_info', 'fun_recreation', 'travel_adventure', 'home_location',
    'family_parenting', 'health_vitality', 'romance_partnership', 'career_business',
    'financial_wealth', 'social_friends', 'possessions_lifestyle', 
    'spirituality_growth', 'giving_legacy'
  ]
  
  let completedSections = 0
  
  for (const section of sections) {
    const sectionData = profileData[section]
    if (sectionData && typeof sectionData === 'object') {
      // Check if section has meaningful content
      const hasContent = Object.values(sectionData).some(value => 
        value && typeof value === 'string' && value.trim().length > 0
      )
      if (hasContent) completedSections++
    }
  }
  
  return Math.round((completedSections / sections.length) * 100)
}

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
          .from('user_profiles')
          .select('*')
          .eq('id', versionId)
          .eq('user_id', user.id)
          .single()

        if (versionError) {
          console.error('Version fetch error:', versionError)
          return NextResponse.json({ error: 'Version not found' }, { status: 404 })
        }

        return NextResponse.json({
          profile: version,
          completionPercentage: version.completion_percentage || calculateCompletionManually(version),
          version: {
            id: version.id,
            version_number: version.version_number,
            is_draft: version.is_draft,
            is_active: version.is_active,
            version_notes: version.version_notes,
            parent_version_id: version.parent_version_id,
            created_at: version.created_at,
            updated_at: version.updated_at
          }
        })
      } catch (dbError) {
        console.error('Database error:', dbError)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }

    // Get current active profile
    try {
      let profile = null
      let completionPercentage = 0
      let versions: any[] = []

      // Get the active profile (non-draft)
      const { data: activeProfile, error: activeError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .single()

      if (activeProfile) {
        profile = activeProfile
        completionPercentage = activeProfile.completion_percentage || calculateCompletionManually(activeProfile)
        console.log('Profile API: Using active profile, completion:', completionPercentage)
      } else {
        // Fallback to any profile if no active one exists
        const { data: fallbackProfile, error: fallbackError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        if (fallbackProfile) {
          profile = fallbackProfile
          completionPercentage = fallbackProfile.completion_percentage || calculateCompletionManually(fallbackProfile)
          console.log('Profile API: Using fallback profile, completion:', completionPercentage)
        } else {
          profile = {}
          completionPercentage = 0
          console.log('Profile API: No profile data exists')
        }
      }

      // Get all versions if requested
      if (includeVersions) {
        console.log('🔍 PROFILE API: Fetching versions for user:', user.id)
        const { data: allVersions, error: versionsError } = await supabase
          .from('user_profiles')
          .select('id, version_number, completion_percentage, is_draft, is_active, version_notes, created_at, updated_at')
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

    // Verify the profile belongs to the user
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id, is_draft, is_active')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single()

    if (profileError || !existingProfile) {
      return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 })
    }

    // Prevent deletion of active version
    if (existingProfile.is_active) {
      return NextResponse.json({ error: 'Cannot delete active version. Please set another version as active first.' }, { status: 400 })
    }

    // Delete the profile version
    const { error: deleteError } = await supabase
      .from('user_profiles')
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

    const { profileData, saveAsVersion = false, isDraft = true, sourceProfileId } = await request.json()

    if (!profileData) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 })
    }

    // Debug: Log what data is being received
    console.log('Profile API: Received profile data:', JSON.stringify(profileData, null, 2))

    try {
      if (saveAsVersion) {
        // Check for existing draft if trying to create a new draft
        if (isDraft) {
          const { data: existingDraft, error: draftError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_draft', true)
            .single()

          if (existingDraft) {
            console.log('Found existing draft, updating it instead of creating new one')
            // Update existing draft instead of creating new one
            const completionPercentage = calculateCompletionManually(profileData)
            const { data: updatedDraft, error: updateError } = await supabase
              .from('user_profiles')
              .update({
                ...profileData,
                completion_percentage: completionPercentage,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingDraft.id)
              .select()
              .single()

            if (updateError) {
              console.error('Draft update error:', updateError)
              throw updateError
            }

            return NextResponse.json({
              success: true,
              profile: updatedDraft,
              completionPercentage,
              version: {
                id: updatedDraft.id,
                version_number: updatedDraft.version_number,
                is_draft: updatedDraft.is_draft,
                is_active: updatedDraft.is_active,
                version_notes: updatedDraft.version_notes,
                parent_version_id: updatedDraft.parent_version_id,
                created_at: updatedDraft.created_at,
                updated_at: updatedDraft.updated_at
              },
              message: 'Draft updated successfully'
            })
          }
        }

        // Create a new profile version using our database function
        let newDraftId: string
        if (sourceProfileId) {
          // Create version from existing source
          const { data: draftId, error: versionError } = await supabase
            .rpc('create_draft_from_version', {
              p_source_profile_id: sourceProfileId,
              p_user_id: user.id,
              p_version_notes: isDraft ? 'Draft version' : 'Committed version'
            })

          if (versionError) {
            console.error('Version creation error:', versionError)
            throw versionError
          }
          newDraftId = draftId
        } else {
          // Create new profile from scratch
          const completionPercentage = calculateCompletionManually(profileData)
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              ...profileData,
              completion_percentage: completionPercentage,
              is_draft: isDraft,
              is_active: !isDraft,
              version_number: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single()

          if (insertError) {
            console.error('Profile creation error:', insertError)
            throw insertError
          }
          newDraftId = newProfile.id
        }

        // Get the version we just created
        let updatedVersion: any
        if (sourceProfileId) {
          // Update with profileData changes if created from source
          const completionPercentage = calculateCompletionManually(profileData)
          const { data: updated, error: updateError } = await supabase
            .from('user_profiles')
            .update({
              ...profileData,
              completion_percentage: completionPercentage,
              updated_at: new Date().toISOString()
            })
            .eq('id', newDraftId)
            .select()
            .single()

          if (updateError) {
            console.error('Version update error:', updateError)
            throw updateError
          }
          updatedVersion = updated
        } else {
          // Fetch the version we just created
          const { data: fetched, error: fetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', newDraftId)
            .single()

          if (fetchError) {
            console.error('Version fetch error:', fetchError)
            throw fetchError
          }
          updatedVersion = fetched
        }

        // If committing (not draft), make it active
        if (!isDraft) {
          const { error: commitError } = await supabase
            .rpc('commit_draft_as_active', {
              p_draft_profile_id: newDraftId,
              p_user_id: user.id
            })

          if (commitError) {
            console.error('Commit error:', commitError)
            throw commitError
          }

          // Fetch the updated version
          const { data: committedVersion, error: fetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', newDraftId)
            .single()

          if (fetchError) {
            console.error('Version fetch error:', fetchError)
            throw fetchError
          }

          return NextResponse.json({
            profile: committedVersion,
            completionPercentage: committedVersion.completion_percentage,
            version: {
              id: committedVersion.id,
              version_number: committedVersion.version_number,
              is_draft: committedVersion.is_draft,
              is_active: committedVersion.is_active,
              version_notes: committedVersion.version_notes,
              parent_version_id: committedVersion.parent_version_id,
              created_at: committedVersion.created_at,
              updated_at: committedVersion.updated_at
            }
          })
        }

        return NextResponse.json({
          profile: updatedVersion,
          completionPercentage: updatedVersion.completion_percentage,
          version: {
            id: updatedVersion.id,
            version_number: updatedVersion.version_number,
            is_draft: updatedVersion.is_draft,
            is_active: updatedVersion.is_active,
            version_notes: updatedVersion.version_notes,
            parent_version_id: updatedVersion.parent_version_id,
            created_at: updatedVersion.created_at,
            updated_at: updatedVersion.updated_at
          }
        })
      } else {
        // Regular profile update (user_profiles table)
        const completionPercentage = calculateCompletionManually(profileData)
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            ...profileData,
            completion_percentage: completionPercentage,
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

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fieldUpdates = await request.json()

    if (!fieldUpdates || Object.keys(fieldUpdates).length === 0) {
      return NextResponse.json({ error: 'Field updates are required' }, { status: 400 })
    }

    console.log('Profile API PUT: Updating fields:', Object.keys(fieldUpdates))

    try {
      // Update the user profile with the specific fields
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .update({
          ...fieldUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (profileError) {
        console.error('Profile update error:', profileError)
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

      console.log('Profile API PUT: Update successful, completion:', completionPercentage)

      return NextResponse.json({
        profile,
        completionPercentage,
        success: true
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        error: 'Error occurred - cannot update profile',
        profile: {}
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Profile API PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Fallback completion calculation function with intelligent conditionals
function calculateCompletionManually(profileData: any): number {
  if (!profileData) return 0

  let totalFields = 0
  let completedFields = 0

  // Helper to check if a field has value
  const hasValue = (field: string) => {
    const value = profileData[field]
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'boolean') return true // Booleans always count as having a value
    return value !== null && value !== undefined && value !== ''
  }

  // Core Fields (always required)
  const coreFields = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'profile_picture_url']
  coreFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Relationship Fields (conditional)
  totalFields++ // relationship_status is always counted
  if (hasValue('relationship_status')) {
    completedFields++
    // If not single, partner_name and relationship_length are expected
    if (profileData.relationship_status !== 'Single') {
      totalFields += 2
      if (hasValue('partner_name')) completedFields++
      if (hasValue('relationship_length')) completedFields++
    }
  }

  // Family Fields (conditional)
  totalFields++ // has_children is always counted
  if (profileData.has_children !== undefined && profileData.has_children !== null) {
    completedFields++
    // If has children, expect number and ages
    if (profileData.has_children === true) {
      totalFields += 2
      if (hasValue('number_of_children')) completedFields++
      if (hasValue('children_ages')) completedFields++
    }
  }

  // Health Fields
  const healthFields = ['units', 'height', 'weight', 'exercise_frequency']
  healthFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Location Fields
  const locationFields = ['living_situation', 'time_at_location', 'city', 'state', 'postal_code', 'country']
  locationFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Career Fields
  const careerFields = ['employment_type', 'occupation', 'company', 'time_in_role']
  careerFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Financial Fields
  const financialFields = ['currency', 'household_income', 'savings_retirement', 'assets_equity', 'consumer_debt']
  financialFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Life Category Story Fields (12 categories - each story field counts)
  const storyFields = [
    'health_vitality_story',
    'romance_partnership_story',
    'family_parenting_story',
    'career_work_story',
    'money_wealth_story',
    'home_environment_story',
    'fun_recreation_story',
    'travel_adventure_story',
    'social_friends_story',
    'possessions_lifestyle_story',
    'spirituality_growth_story',
    'giving_legacy_story'
  ]
  storyFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Structured Life Category Fields
  // Fun & Recreation
  const funFields = ['hobbies', 'leisure_time_weekly']
  funFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Travel & Adventure
  const travelFields = ['travel_frequency', 'passport', 'countries_visited']
  travelFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Social & Friends
  const socialFields = ['close_friends_count', 'social_preference']
  socialFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Possessions & Lifestyle
  const lifestyleFields = ['lifestyle_category', 'primary_vehicle']
  lifestyleFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Spirituality & Growth
  const spiritualityFields = ['spiritual_practice', 'meditation_frequency', 'personal_growth_focus']
  spiritualityFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  // Giving & Legacy
  const givingFields = ['volunteer_status', 'charitable_giving', 'legacy_mindset']
  givingFields.forEach(field => {
    totalFields++
    if (hasValue(field)) completedFields++
  })

  const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0

  console.log('🔢 Manual calculation:', {
    totalFormFields: totalFields,
    completedFormFields: completedFields,
    percentage: percentage
  })

  return percentage
}