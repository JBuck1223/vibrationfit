import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

export async function GET(request: NextRequest) {
  console.log('🚀 VISION API GET REQUEST STARTED')
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const visionId = searchParams.get('id')
    const includeVersions = searchParams.get('includeVersions') === 'true'

    // If requesting a specific vision
    if (visionId) {
      try {
        const { data: vision, error: visionError } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('id', visionId)
          .eq('user_id', user.id)
          .single()

        if (visionError) {
          console.error('Vision fetch error:', visionError)
          
          // If vision doesn't exist, create a new one
          if (visionError.code === 'PGRST116') {
            console.log('Vision not found, creating new vision...')
            
            // Try creating with new fields first, fallback to status if columns don't exist
            let newVision = null
            let createError = null
            
            // Try creating with status only (reliable)
            const result = await supabase
              .from('vision_versions')
              .insert({
                id: visionId,
                user_id: user.id,
                status: 'draft',
                vision: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()
            
            newVision = result.data
            createError = result.error
            
            if (createError) {
              console.error('Error creating new vision:', createError)
              return NextResponse.json({ error: 'Failed to create vision' }, { status: 500 })
            }
            
            if (!newVision) {
              return NextResponse.json({ error: 'Failed to create vision' }, { status: 500 })
            }
            
            // Calculate version number based on chronological order
            let versionNumber = 1
            try {
              const { data: calculatedVersionNumber } = await supabase
                .rpc('get_vision_version_number', { p_vision_id: newVision.id })
              
              versionNumber = calculatedVersionNumber || 1
            } catch (error) {
              // If RPC function doesn't exist yet, default to 1
              console.warn('Could not calculate version number, using default:', error)
            }
            
            return NextResponse.json({
              vision: {
                ...newVision,
                version_number: versionNumber
              },
              versions: []
            })
          }
          
          return NextResponse.json({ error: 'Vision not found' }, { status: 404 })
        }

        // Calculate version number for the current vision first
        let visionVersionNumber = 1
        try {
          const { data: calculatedVersionNumber } = await supabase
            .rpc('get_vision_version_number', { p_vision_id: vision.id })
          
          visionVersionNumber = calculatedVersionNumber || 1
        } catch (error) {
          // If RPC function doesn't exist yet, default to 1
          console.warn('Could not calculate version number, using default:', error)
        }

        // Load versions if requested
        let versions = []
        if (includeVersions) {
          const { data: versionsData } = await supabase
            .from('vision_versions')
            .select('*')
            .eq('user_id', user.id)
            .is('household_id', null)  // Only personal visions (exclude household)
            .eq('is_draft', false)  // Exclude drafts from main query (will add separately)
            .order('created_at', { ascending: false })
          
          // Calculate version numbers based on chronological order
          if (versionsData) {
            versions = await Promise.all(
              versionsData.map(async (v: any) => {
                const { data: calculatedVersionNumber } = await supabase
                  .rpc('get_vision_version_number', { p_vision_id: v.id })
                
                const versionNumber = calculatedVersionNumber || 1
                
                return {
                  ...v,
                  version_number: versionNumber
                }
              })
            )
          }

        // Check if draft vision exists (is_draft=true, is_active=false)
        // Use limit(1) instead of maybeSingle() to handle case where multiple drafts exist
        const { data: draftVisions } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .is('household_id', null)  // Only personal visions
          .eq('is_draft', true)
          .eq('is_active', false)
          .order('created_at', { ascending: false })
          .limit(1)

        const draftVision = draftVisions?.[0] || null

        if (draftVision) {
            // Add draft vision to beginning of versions array
            versions = [{
              ...draftVision,
              isDraft: true,
              draftCategories: (draftVision.refined_categories || []).length,
              totalCategories: VISION_CATEGORIES.length
            }, ...versions]
          }
        }

        return NextResponse.json({
          vision: {
            ...vision,
            version_number: visionVersionNumber
          },
          versions
        })
      } catch (dbError) {
        console.error('Database error:', dbError)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }

    // If no specific vision requested, get the active vision for the user
    try {
      let latestVision = null
      
      // First, try to get the vision where is_active = true
      const { data: activeVision } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .is('household_id', null)  // Only personal visions
        .eq('is_active', true)
        .maybeSingle()

      if (activeVision) {
        latestVision = activeVision
      } else {
        // Fallback: Get latest non-draft vision
        const { data: fallbackVision } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .is('household_id', null)  // Only personal visions
          .eq('is_draft', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fallbackVision) {
          latestVision = fallbackVision
        } else {
          // Last resort: get any non-draft vision
          const { data: anyVision } = await supabase
            .from('vision_versions')
            .select('*')
            .eq('user_id', user.id)
            .is('household_id', null)  // Only personal visions
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          latestVision = anyVision || null
        }
      }

      // Calculate version number for the latest vision first
      let visionWithVersionNumber = latestVision
      let visionVersionNumber = 1
      if (latestVision) {
        try {
          const { data: calculatedVersionNumber } = await supabase
            .rpc('get_vision_version_number', { p_vision_id: latestVision.id })
          
          visionVersionNumber = calculatedVersionNumber || 1
        } catch (error) {
          // If RPC function doesn't exist yet, default to 1
          console.warn('Could not calculate version number, using default:', error)
        }
        
        visionWithVersionNumber = {
          ...latestVision,
          version_number: visionVersionNumber
        }
      }

      // Load versions if requested
      let versions = []
      if (includeVersions) {
        const { data: versionsData } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .is('household_id', null)  // Only personal visions
          .eq('is_draft', false)  // Exclude drafts from main query (will add separately)
          .order('created_at', { ascending: false })
        
        // Calculate version numbers based on chronological order
        if (versionsData) {
          versions = await Promise.all(
            versionsData.map(async (v: any) => {
              try {
                const { data: calculatedVersionNumber } = await supabase
                  .rpc('get_vision_version_number', { p_vision_id: v.id })
                
                const versionNumber = calculatedVersionNumber || 1
                
                return {
                  ...v,
                  version_number: versionNumber
                }
              } catch (error) {
                // If RPC function doesn't exist yet, default to 1
                console.warn('Could not calculate version number, using default:', error)
                return {
                  ...v,
                  version_number: 1
                }
              }
            })
          )
        }

        // Check if draft vision exists for user
        // Use limit(1) instead of maybeSingle() to handle case where multiple drafts exist
        const { data: draftVisions } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .is('household_id', null)  // Only personal visions
          .eq('is_draft', true)
          .eq('is_active', false)
          .order('created_at', { ascending: false })
          .limit(1)

        const draftVision = draftVisions?.[0] || null

        if (draftVision) {
          // Add draft vision to beginning of versions array
          versions = [{
            ...draftVision,
            isDraft: true,
            draftCategories: (draftVision.refined_categories || []).length,
            totalCategories: VISION_CATEGORIES.length
          }, ...versions]
        }
      }

      return NextResponse.json({
        vision: visionWithVersionNumber,
        versions
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

  } catch (error) {
    console.error('Vision API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 VISION API POST REQUEST STARTED')
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { visionId, vision, versionNumber } = body

    if (!visionId) {
      return NextResponse.json({ error: 'Missing visionId' }, { status: 400 })
    }

    // Calculate completion percentage
    const VISION_SECTIONS = [
      { key: 'forward', title: 'Forward' },
      { key: 'fun', title: 'Fun' },
      { key: 'travel', title: 'Travel' },
      { key: 'home', title: 'Home' },
      { key: 'family', title: 'Family' },
      { key: 'romance', title: 'Romance' },
      { key: 'health', title: 'Health' },
      { key: 'money', title: 'Money' },
      { key: 'business', title: 'Business' },
      { key: 'social', title: 'Social' },
      { key: 'possessions', title: 'Possessions' },
      { key: 'giving', title: 'Giving' },
      { key: 'spirituality', title: 'Spirituality' },
      { key: 'conclusion', title: 'Conclusion' }
    ]

    const totalSections = VISION_SECTIONS.length
    const completedSections = VISION_SECTIONS.filter(section => {
      const content = vision[section.key]
      return content && content.trim().length > 0
    })
    const completionPercentage = Math.round((completedSections.length / totalSections) * 100)

    // Prepare update data with all vision fields
    const updateData = {
      forward: vision.forward || '',
      fun: vision.fun || '',
      travel: vision.travel || '',
      home: vision.home || '',
      family: vision.family || '',
      romance: vision.romance || '',
      health: vision.health || '',
      money: vision.money || '',
      business: vision.business || '',
      social: vision.social || '',
      possessions: vision.possessions || '',
      giving: vision.giving || '',
      spirituality: vision.spirituality || '',
      conclusion: vision.conclusion || '',
      completion_percent: completionPercentage,
      updated_at: new Date().toISOString()
    }

    // Update the vision
    const { data: updatedVision, error: updateError } = await supabase
      .from('vision_versions')
      .update(updateData)
      .eq('id', visionId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Vision update error:', updateError)
      return NextResponse.json({ error: 'Failed to update vision' }, { status: 500 })
    }

    return NextResponse.json({
      vision: updatedVision,
      success: true
    })

  } catch (error) {
    console.error('Vision API POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  console.log('🗑️ VISION API DELETE REQUEST STARTED')
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const visionId = searchParams.get('id')

    if (!visionId) {
      return NextResponse.json({ error: 'Missing vision ID' }, { status: 400 })
    }

    // Verify the vision belongs to the user before deleting
    const { data: vision, error: fetchError } = await supabase
      .from('vision_versions')
      .select('id, user_id, is_draft')
      .eq('id', visionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !vision) {
      return NextResponse.json({ error: 'Vision not found or access denied' }, { status: 404 })
    }

    // Use admin client to bypass RLS recursion issues
    const adminClient = createAdminClient()
    const { error: deleteError } = await adminClient
      .from('vision_versions')
      .delete()
      .eq('id', visionId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Vision delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete vision' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Vision API DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
