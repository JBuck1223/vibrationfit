import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
            const { data: newVision, error: createError } = await supabase
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
            
            if (createError) {
              console.error('Error creating new vision:', createError)
              return NextResponse.json({ error: 'Failed to create vision' }, { status: 500 })
            }
            
            return NextResponse.json({
              vision: newVision,
              versions: []
            })
          }
          
          return NextResponse.json({ error: 'Vision not found' }, { status: 404 })
        }

        // Load versions if requested
        let versions = []
        if (includeVersions) {
          const { data: versionsData } = await supabase
            .from('vision_versions')
            .select('*')
            .eq('user_id', user.id)
            .order('version_number', { ascending: false })
          
          versions = versionsData || []
        }

        return NextResponse.json({
          vision,
          versions
        })
      } catch (dbError) {
        console.error('Database error:', dbError)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }

    // If no specific vision requested, get the latest vision for the user
    try {
      const { data: latestVision, error: latestError } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      if (latestError && latestError.code !== 'PGRST116') {
        console.error('Latest vision fetch error:', latestError)
        return NextResponse.json({ error: 'Failed to fetch latest vision' }, { status: 500 })
      }

      // Load versions if requested
      let versions = []
      if (includeVersions) {
        const { data: versionsData } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('user_id', user.id)
          .order('version_number', { ascending: false })
        
        versions = versionsData || []
      }

      return NextResponse.json({
        vision: latestVision,
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
