import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
                version_number: 1,
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
            let versionNumber = newVision.version_number || 1
            try {
              const { data: calculatedVersionNumber } = await supabase
                .rpc('get_vision_version_number', { p_vision_id: newVision.id })
              
              versionNumber = calculatedVersionNumber || newVision.version_number || 1
            } catch (error) {
              // If RPC function doesn't exist yet, use stored version_number
              console.warn('Could not calculate version number, using stored:', error)
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
        let visionVersionNumber = vision.version_number || 1
        try {
          const { data: calculatedVersionNumber } = await supabase
            .rpc('get_vision_version_number', { p_vision_id: vision.id })
          
          visionVersionNumber = calculatedVersionNumber || vision.version_number || 1
        } catch (error) {
          // If RPC function doesn't exist yet, use stored version_number
          console.warn('Could not calculate version number, using stored:', error)
        }

        // Load versions if requested
        let versions = []
        if (includeVersions) {
          const { data: versionsData } = await supabase
            .from('vision_versions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          
          // Calculate version numbers based on chronological order
          if (versionsData) {
            versions = await Promise.all(
              versionsData.map(async (v: any) => {
                const { data: calculatedVersionNumber } = await supabase
                  .rpc('get_vision_version_number', { p_vision_id: v.id })
                
                const versionNumber = calculatedVersionNumber || v.version_number || 1
                
                return {
                  ...v,
                  version_number: versionNumber
                }
              })
            )
          }

          // Check if draft refinements exist and add draft version
          const { data: refinements } = await supabase
            .from('refinements')
            .select('category, output_text, created_at')
            .eq('user_id', user.id)
            .eq('vision_id', visionId)
            .eq('operation_type', 'refine_vision')
            .order('created_at', { ascending: false })

          if (refinements && refinements.length > 0) {
            // Build draft vision
            const draftVision = { ...vision }
            const draftCategories: string[] = []
            
            // Map refinements by category (take the most recent one per category)
            const refinementMap = new Map<string, string>()
            refinements.forEach((refinement: any) => {
              if (refinement.category && refinement.output_text && !refinementMap.has(refinement.category)) {
                refinementMap.set(refinement.category, refinement.output_text)
                draftCategories.push(refinement.category)
              }
            })

            // Combine vision values with draft refinements
            VISION_CATEGORIES.forEach(category => {
              const categoryKey = category.key as keyof typeof vision
              if (refinementMap.has(category.key)) {
                draftVision[categoryKey] = refinementMap.get(category.key) as any
              }
            })

            // Calculate completion percentage for draft
            const completedSections = VISION_CATEGORIES.filter(category => {
              const categoryKey = category.key as keyof typeof draftVision
              const value = draftVision[categoryKey] as string
              return value && value.trim().length > 0
            })
            const draftCompletionPercentage = Math.round((completedSections.length / VISION_CATEGORIES.length) * 100)

            // Get latest refinement timestamp for draft created_at
            const latestRefinement = refinements[0]
            const draftCreatedAt = latestRefinement?.created_at || new Date().toISOString()

            // Create draft version object
            const draftVersion = {
              id: `draft-${visionId}`, // Special ID to identify draft
              user_id: vision.user_id,
              version_number: visionVersionNumber + 1, // Next version number
              status: 'draft',
              completion_percent: draftCompletionPercentage,
              created_at: draftCreatedAt,
              updated_at: new Date().toISOString(),
              isDraft: true, // Flag to identify this is a draft
              draftCategories: draftCategories.length,
              totalCategories: VISION_CATEGORIES.length
            }

            // Add draft at the top of versions list
            versions = [draftVersion, ...versions]
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
      // Use status-based query (reliable - columns definitely exist)
      let latestVision = null
      
      // Get latest non-draft vision
      const { data: fallbackVision } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fallbackVision) {
        latestVision = fallbackVision
      } else {
        // Last resort: get any vision
        const { data: anyVision } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        latestVision = anyVision || null
      }

      // Calculate version number for the latest vision first
      let visionWithVersionNumber = latestVision
      let visionVersionNumber = 1
      if (latestVision) {
        visionVersionNumber = latestVision.version_number || 1
        try {
          const { data: calculatedVersionNumber } = await supabase
            .rpc('get_vision_version_number', { p_vision_id: latestVision.id })
          
          visionVersionNumber = calculatedVersionNumber || latestVision.version_number || 1
        } catch (error) {
          // If RPC function doesn't exist yet, use stored version_number
          console.warn('Could not calculate version number, using stored:', error)
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
          .order('created_at', { ascending: false })
        
        // Calculate version numbers based on chronological order
        if (versionsData) {
          versions = await Promise.all(
            versionsData.map(async (v: any) => {
              try {
                const { data: calculatedVersionNumber } = await supabase
                  .rpc('get_vision_version_number', { p_vision_id: v.id })
                
                const versionNumber = calculatedVersionNumber || v.version_number || 1
                
                return {
                  ...v,
                  version_number: versionNumber
                }
              } catch (error) {
                // If RPC function doesn't exist yet, use stored version_number
                console.warn('Could not calculate version number, using stored:', error)
                return {
                  ...v,
                  version_number: v.version_number || 1
                }
              }
            })
          )
        }

        // Check if draft refinements exist for latest vision and add draft version
        if (latestVision) {
          const { data: refinements } = await supabase
            .from('refinements')
            .select('category, output_text, created_at')
            .eq('user_id', user.id)
            .eq('vision_id', latestVision.id)
            .eq('operation_type', 'refine_vision')
            .order('created_at', { ascending: false })

          if (refinements && refinements.length > 0) {
            // Build draft vision
            const draftVision = { ...latestVision }
            const draftCategories: string[] = []
            
            // Map refinements by category (take the most recent one per category)
            const refinementMap = new Map<string, string>()
            refinements.forEach((refinement: any) => {
              if (refinement.category && refinement.output_text && !refinementMap.has(refinement.category)) {
                refinementMap.set(refinement.category, refinement.output_text)
                draftCategories.push(refinement.category)
              }
            })

            // Combine vision values with draft refinements
            VISION_CATEGORIES.forEach(category => {
              const categoryKey = category.key as keyof typeof latestVision
              if (refinementMap.has(category.key)) {
                draftVision[categoryKey] = refinementMap.get(category.key) as any
              }
            })

            // Calculate completion percentage for draft
            const completedSections = VISION_CATEGORIES.filter(category => {
              const categoryKey = category.key as keyof typeof draftVision
              const value = draftVision[categoryKey] as string
              return value && value.trim().length > 0
            })
            const draftCompletionPercentage = Math.round((completedSections.length / VISION_CATEGORIES.length) * 100)

            // Get latest refinement timestamp for draft created_at
            const latestRefinement = refinements[0]
            const draftCreatedAt = latestRefinement?.created_at || new Date().toISOString()

            // Create draft version object
            const draftVersion = {
              id: `draft-${latestVision.id}`, // Special ID to identify draft
              user_id: latestVision.user_id,
              version_number: visionVersionNumber + 1, // Next version number
              status: 'draft',
              completion_percent: draftCompletionPercentage,
              created_at: draftCreatedAt,
              updated_at: new Date().toISOString(),
              isDraft: true, // Flag to identify this is a draft
              draftCategories: draftCategories.length,
              totalCategories: VISION_CATEGORIES.length
            }

            // Add draft at the top of versions list
            versions = [draftVersion, ...versions]
          }
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
