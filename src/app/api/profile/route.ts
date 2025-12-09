import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateProfileCompletion } from '@/lib/utils/profile-completion'

// Helper function to clean profile data by removing invalid fields
function cleanProfileData(profileData: any): any {
  if (!profileData || typeof profileData !== 'object') return profileData
  
  // Create a copy to avoid mutating the original
  const cleaned = { ...profileData }
  
  // Remove education_level if it exists (old field name)
  if ('education_level' in cleaned) {
    delete cleaned.education_level
    // If education is not already set, we could migrate the value, but for now just remove it
    // The user will need to set education again if needed
  }
  
  return cleaned
}

// calculateProfileCompletion is now imported from shared utility

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
      console.log('🔍 PROFILE API: Fetching specific version:', versionId, 'for user:', user.id)
      try {
        const { data: version, error: versionError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', versionId)
          .eq('user_id', user.id)
          .single()

        if (versionError) {
          console.error('❌ PROFILE API: Version fetch error:', versionError)
          console.error('   Version ID:', versionId)
          console.error('   User ID:', user.id)
          return NextResponse.json({ error: 'Version not found' }, { status: 404 })
        }
        
        if (!version) {
          console.error('❌ PROFILE API: No version data returned for:', versionId)
          return NextResponse.json({ error: 'Version not found' }, { status: 404 })
        }
        
        console.log('✅ PROFILE API: Version found:', version.id)

        // Calculate version number based on chronological order
        const { data: calculatedVersionNumber } = await supabase
          .rpc('get_profile_version_number', { p_profile_id: version.id })
        
        const versionNumber = calculatedVersionNumber || version.version_number || 1

        // Always recalculate completion to ensure accuracy
        const calculatedCompletion = calculateProfileCompletion(version)
        
        return NextResponse.json({
          profile: version,
          completionPercentage: calculatedCompletion,
          version: {
            id: version.id,
            version_number: versionNumber,
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
        // Always recalculate completion to ensure accuracy
        completionPercentage = calculateProfileCompletion(activeProfile)
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
          // Always recalculate completion to ensure accuracy
          completionPercentage = calculateProfileCompletion(fallbackProfile)
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
          .select('id, version_number, is_draft, is_active, version_notes, created_at, updated_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        // Debug: Check raw database values
        if (allVersions && allVersions.length > 0) {
          console.log('🔍 PROFILE API: Raw DB values for is_active:', allVersions.map(v => ({ id: v.id, is_active: v.is_active, is_active_type: typeof v.is_active, is_draft: v.is_draft })))
        }

        if (versionsError) {
          console.error('❌ PROFILE API: Versions fetch error:', versionsError)
        } else {
          console.log('✅ PROFILE API: Found versions:', allVersions?.length || 0)
          
          // Safety check: If there's only one non-draft profile and it's not active, set it as active
          let versionsToProcess = allVersions || []
          const nonDraftVersions = versionsToProcess.filter((v: any) => !v.is_draft)
          const activeVersions = versionsToProcess.filter((v: any) => v.is_active && !v.is_draft)
          
          if (nonDraftVersions.length === 1 && activeVersions.length === 0) {
            console.log('⚠️ PROFILE API: Only one non-draft version exists but it\'s not active. Setting it as active...')
            const { error: autoActiveError } = await supabase
              .rpc('set_version_active', {
                p_profile_id: nonDraftVersions[0].id,
                p_user_id: user.id
              })
            if (autoActiveError) {
              console.error('❌ PROFILE API: Failed to auto-set version as active:', autoActiveError)
            } else {
              console.log('✅ PROFILE API: Successfully set version as active')
              // Re-fetch versions after setting active
              const { data: refreshedVersions } = await supabase
                .from('user_profiles')
                .select('id, version_number, is_draft, is_active, version_notes, created_at, updated_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
              if (refreshedVersions) {
                versionsToProcess = refreshedVersions
              }
            }
          }
          
          // Log raw version data for debugging
          console.log('🔍 PROFILE API: Raw versions data:', JSON.stringify(versionsToProcess, null, 2))
          // Calculate version numbers based on chronological order
          // Fetch full profile data for each version to calculate completion accurately
          versions = await Promise.all(versionsToProcess.map(async (version: any) => {
            const { data: calculatedVersion } = await supabase
              .rpc('get_profile_version_number', { p_profile_id: version.id })
            
            // Fetch full profile data to calculate completion accurately
            const { data: fullVersion } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', version.id)
              .single()
            
            // Calculate completion percentage (for response, not stored)
            const accurateCompletion = fullVersion ? calculateProfileCompletion(fullVersion) : 0
            
            const versionWithNumber = {
              ...version,
              version_number: calculatedVersion || version.version_number || 1
              // Note: completion_percentage is calculated on-the-fly but not included in version cards
            }
            console.log(`📊 PROFILE API: Version ${version.id} - calculated completion: ${accurateCompletion}%`)
            return versionWithNumber
          }))
          // Sort by calculated version number (descending)
          versions.sort((a: any, b: any) => b.version_number - a.version_number)
          console.log('✅ PROFILE API: Final versions with calculated numbers:', JSON.stringify(versions.map(v => ({ id: v.id, version_number: v.version_number, is_active: v.is_active, is_draft: v.is_draft })), null, 2))
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

    // Log to track when versions are being created
    if (saveAsVersion) {
      console.log('⚠️ PROFILE API: Creating version - saveAsVersion:', saveAsVersion, 'isDraft:', isDraft, 'sourceProfileId:', sourceProfileId)
    } else {
      console.log('📝 PROFILE API: Regular profile update (not creating version)')
    }

    // Clean profile data to remove invalid fields (like education_level)
    const cleanedProfileData = cleanProfileData(profileData)

    // Debug: Log what data is being received
    console.log('Profile API: Received profile data:', JSON.stringify(cleanedProfileData, null, 2))

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
            const completionPercentage = calculateProfileCompletion(cleanedProfileData)
            
            // Remove id and versioning fields from profileData to avoid conflicts
            const { id, version_number, is_draft, is_active, parent_version_id, created_at, updated_at, ...profileDataToUpdate } = cleanedProfileData
            
            const { data: updatedDraft, error: updateError } = await supabase
              .from('user_profiles')
              .update({
                ...profileDataToUpdate,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingDraft.id)
              .select()
              .single()

            if (updateError) {
              console.error('Draft update error:', updateError)
              throw updateError
            }

            // Calculate completion (for response, not stored)
            const recalculatedCompletion = calculateProfileCompletion(updatedDraft)
            
            // Calculate version number based on chronological order
            const { data: calculatedVersionNumber } = await supabase
              .rpc('get_profile_version_number', { p_profile_id: updatedDraft.id })
            const versionNumber = calculatedVersionNumber || updatedDraft.version_number || 1

            return NextResponse.json({
              success: true,
              profile: updatedDraft,
              completionPercentage: recalculatedCompletion,
              version: {
                id: updatedDraft.id,
                version_number: versionNumber,
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
        let actualSourceId = sourceProfileId
        
        // If no sourceProfileId provided, find existing active profile to use as source
        if (!actualSourceId) {
          const { data: activeProfile } = await supabase
            .from('user_profiles')
            .select('id, is_active, is_draft')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .eq('is_draft', false)
            .single()
          
          if (activeProfile) {
            actualSourceId = activeProfile.id
            console.log('No sourceProfileId provided, using active profile as source:', actualSourceId)
          } else {
            // Fallback: find any non-draft profile
            const { data: fallbackProfile } = await supabase
              .from('user_profiles')
              .select('id, is_active, is_draft')
              .eq('user_id', user.id)
              .eq('is_draft', false)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()
            
            if (fallbackProfile) {
              actualSourceId = fallbackProfile.id
              console.log('⚠️ PROFILE API: No active profile found, using latest non-draft profile as source:', actualSourceId)
            } else {
              // CRITICAL: Cannot create version without a source profile
              console.error('❌ PROFILE API: Cannot create version - no source profile found')
              return NextResponse.json({ 
                error: 'Cannot create version: No source profile found. Please ensure you have an active profile first.',
                message: 'Cannot create version without source profile'
              }, { status: 400 })
            }
          }
        }
        
        // CRITICAL: Require sourceProfileId to create version when saveAsVersion is true
        if (!actualSourceId) {
          console.error('❌ PROFILE API: Cannot create version - sourceProfileId is required but missing')
          return NextResponse.json({ 
            error: 'Cannot create version: Source profile ID is required',
            message: 'Source profile ID is required to create a version'
          }, { status: 400 })
        }
        
        // Create version from existing source
        console.log('✅ PROFILE API: Creating version from source:', actualSourceId)
        const { data: draftId, error: versionError } = await supabase
          .rpc('create_draft_from_version', {
            p_source_profile_id: actualSourceId,
            p_user_id: user.id,
            p_version_notes: isDraft ? 'Draft version' : 'Committed version'
          })
        
        // Set parent_id explicitly if trigger didn't catch it
        if (!versionError && draftId) {
          await supabase
            .from('user_profiles')
            .update({ parent_id: actualSourceId })
            .eq('id', draftId)
        }

        if (versionError) {
          console.error('Version creation error:', versionError)
          throw versionError
        }
        newDraftId = draftId
        
        // Calculate completion percentage (for response, not stored)
        const completionPercentage = calculateProfileCompletion(cleanedProfileData)
        
        // Remove id and versioning fields from profileData to avoid conflicts
        const { id, version_number, is_draft, is_active, parent_version_id, created_at, updated_at, ...profileDataToUpdate } = cleanedProfileData
        
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            ...profileDataToUpdate,
            updated_at: new Date().toISOString()
          })
          .eq('id', newDraftId)

        if (updateError) {
          console.error('Error updating draft with new data:', updateError)
          // Don't throw - the draft was created, we just couldn't update it
          // But log it for debugging
        }

        // Get the version we just created
        const { data: updatedVersion, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', newDraftId)
          .single()

        if (fetchError) {
          console.error('Version fetch error:', fetchError)
          throw fetchError
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

          // Calculate version number based on chronological order
          const { data: calculatedVersionNumber } = await supabase
            .rpc('get_profile_version_number', { p_profile_id: committedVersion.id })
          const versionNumber = calculatedVersionNumber || committedVersion.version_number || 1

          // Calculate completion (for response, not stored)
          const recalculatedCompletion = calculateProfileCompletion(committedVersion)

          return NextResponse.json({
            profile: committedVersion,
            completionPercentage: recalculatedCompletion,
            version: {
              id: committedVersion.id,
              version_number: versionNumber,
              is_draft: committedVersion.is_draft,
              is_active: committedVersion.is_active,
              version_notes: committedVersion.version_notes,
              parent_version_id: committedVersion.parent_version_id,
              created_at: committedVersion.created_at,
              updated_at: committedVersion.updated_at
            }
          })
        }

        // Calculate version number based on chronological order
        const { data: calculatedVersionNumber } = await supabase
          .rpc('get_profile_version_number', { p_profile_id: updatedVersion.id })
        const versionNumber = calculatedVersionNumber || updatedVersion.version_number || 1

        // Calculate completion (for response, not stored)
        const recalculatedCompletion = calculateProfileCompletion(updatedVersion)

        return NextResponse.json({
          profile: updatedVersion,
          completionPercentage: recalculatedCompletion,
          version: {
            id: updatedVersion.id,
            version_number: versionNumber,
            is_draft: updatedVersion.is_draft,
            is_active: updatedVersion.is_active,
            version_notes: updatedVersion.version_notes,
            parent_version_id: updatedVersion.parent_version_id,
            created_at: updatedVersion.created_at,
            updated_at: updatedVersion.updated_at
          }
        })
      } else {
        // Regular profile update (user_profiles table) - NOT creating a version
        // Only update the existing active profile or create first profile if none exists
        console.log('📝 PROFILE API: Performing regular profile update (not creating version)')
        
        // First, check if user has an active profile
        const { data: activeProfile } = await supabase
          .from('user_profiles')
          .select('id, is_active, is_draft')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .eq('is_draft', false)
          .single()
        
        if (activeProfile) {
          // Update existing active profile
          console.log('📝 PROFILE API: Updating existing active profile:', activeProfile.id)
          const completionPercentage = calculateProfileCompletion(cleanedProfileData)
          
          // Remove versioning fields to prevent accidental version creation
          const { id, version_number, is_draft, is_active, parent_version_id, created_at, updated_at, ...profileDataToUpdate } = cleanedProfileData
          
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .update({
              ...profileDataToUpdate,
              updated_at: new Date().toISOString()
            })
            .eq('id', activeProfile.id)
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
        } else {
          // No active profile exists - check if any profile exists
          const { data: anyProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .single()
          
          if (anyProfile) {
            // User has profiles but none are active - this shouldn't happen, but update the latest one
            console.log('⚠️ PROFILE API: No active profile found, updating latest profile:', anyProfile.id)
            const completionPercentage = calculateProfileCompletion(cleanedProfileData)
            
            const { id, version_number, is_draft, is_active, parent_version_id, created_at, updated_at, ...profileDataToUpdate } = cleanedProfileData
            
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .update({
                ...profileDataToUpdate,
                updated_at: new Date().toISOString()
              })
              .eq('id', anyProfile.id)
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
          } else {
            // First profile ever - create it as active (not a version)
            console.log('✨ PROFILE API: Creating first profile (not a version)')
            const completionPercentage = calculateProfileCompletion(cleanedProfileData)
            
            const { id, version_number, is_draft, is_active, parent_version_id, created_at, updated_at, ...profileDataToUpdate } = cleanedProfileData
            
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                ...profileDataToUpdate,
                is_active: true,
                is_draft: false,
                version_number: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()

            if (profileError) {
              console.error('Profile creation error:', profileError)
              throw profileError
            }

            return NextResponse.json({
              profile,
              completionPercentage
            })
          }
        }
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      console.error('Database error details:', JSON.stringify(dbError, null, 2))
      
      // Extract meaningful error message from Supabase errors
      let errorMessage = 'Unknown error'
      if (dbError instanceof Error) {
        errorMessage = dbError.message
      } else if (typeof dbError === 'object' && dbError !== null) {
        // Handle Supabase error objects
        errorMessage = (dbError as any).message || (dbError as any).details || JSON.stringify(dbError)
      }
      
      return NextResponse.json({ 
        message: 'Error occurred - cannot save profile',
        error: errorMessage,
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

    const { searchParams } = new URL(request.url)
    const profileIdParam = searchParams.get('profileId')

    const fieldUpdates = await request.json()

    if (!fieldUpdates || Object.keys(fieldUpdates).length === 0) {
      return NextResponse.json({ error: 'Field updates are required' }, { status: 400 })
    }

    console.log('Profile API PUT: Updating fields:', Object.keys(fieldUpdates))
    if (profileIdParam) {
      console.log('Profile API PUT: Targeting specific profile:', profileIdParam)
    }

    try {
      // Find the profile to update
      let profileToUpdate = null
      
      // If a specific profileId is provided, use that
      if (profileIdParam) {
        const { data: specificProfile } = await supabase
          .from('user_profiles')
          .select('id, is_active, is_draft, user_id')
          .eq('id', profileIdParam)
          .eq('user_id', user.id) // Ensure it belongs to the user
          .maybeSingle()
        
        if (specificProfile) {
          profileToUpdate = specificProfile
          console.log('Profile API PUT: Updating specified profile:', specificProfile.id)
        } else {
          return NextResponse.json({ 
            error: 'Profile not found or access denied',
            profile: {}
          }, { status: 404 })
        }
      } else {
        // No specific profileId provided, use the existing logic
        // First, check for an active draft
        const { data: draftProfile } = await supabase
          .from('user_profiles')
          .select('id, is_active, is_draft')
          .eq('user_id', user.id)
          .eq('is_draft', true)
          .maybeSingle()
        
        if (draftProfile) {
          profileToUpdate = draftProfile
          console.log('Profile API PUT: Updating draft profile:', draftProfile.id)
        } else {
          // No draft, find active profile
          const { data: activeProfile } = await supabase
            .from('user_profiles')
            .select('id, is_active, is_draft')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .eq('is_draft', false)
            .maybeSingle()
          
          if (activeProfile) {
            profileToUpdate = activeProfile
            console.log('Profile API PUT: Updating active profile:', activeProfile.id)
          } else {
            // Fallback: get any profile for the user
            const { data: anyProfile } = await supabase
              .from('user_profiles')
              .select('id, is_active, is_draft')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            
            if (anyProfile) {
              profileToUpdate = anyProfile
              console.log('Profile API PUT: Updating latest profile:', anyProfile.id)
            }
          }
        }
      }
      
      if (!profileToUpdate) {
        return NextResponse.json({ 
          error: 'No profile found to update',
          profile: {}
        }, { status: 404 })
      }

      // Remove versioning fields from fieldUpdates to prevent accidental changes
      const { id, version_number, is_draft, is_active, parent_version_id, created_at, updated_at, ...safeFieldUpdates } = fieldUpdates

      // Update the user profile with the specific fields
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .update({
          ...safeFieldUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileToUpdate.id)
        .select()
        .single()

      if (profileError) {
        console.error('Profile update error:', profileError)
        throw profileError
      }

      // Calculate completion percentage using shared utility (for response only, not stored)
      const completionPercentage = calculateProfileCompletion(profile)

      // Auto-calculate refined_fields if this is a draft with a parent
      if (profile.parent_id && profile.is_draft) {
        const { data: parentProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', profile.parent_id)
          .single()
        
        if (parentProfile) {
          // Calculate which fields have changed
          const { getChangedFields } = await import('@/lib/profile/draft-helpers')
          const refinedFields = getChangedFields(profile, parentProfile)
          
          // Update refined_fields in database
          await supabase
            .from('user_profiles')
            .update({ refined_fields: refinedFields })
            .eq('id', profile.id)
          
          // Add to response
          profile.refined_fields = refinedFields
          
          console.log('Profile API PUT: Calculated refined_fields:', refinedFields)
        }
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

// calculateCompletionManually removed - now using shared utility from @/lib/utils/profile-completion