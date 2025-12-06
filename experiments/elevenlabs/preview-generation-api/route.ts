import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVisionCategoryKeys } from '@/lib/design-system'
import { generateAudioTracks } from '../audioService-with-dryrun'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { visionId, voice = 'alloy', variant = 'standard' } = await request.json()
    
    if (!visionId) {
      return NextResponse.json({ error: 'visionId is required' }, { status: 400 })
    }

    console.log(`\n📋 [Preview] Running DRY RUN for vision: ${visionId}`)

    // Get vision data
    const { data: vision, error: visionError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .single()

    if (visionError || !vision) {
      return NextResponse.json({ error: 'Vision not found' }, { status: 404 })
    }

    // Build sections (same as real generation)
    const categoryKeys = getVisionCategoryKeys().filter(k => k !== 'forward' && k !== 'conclusion')
    const sections = [
      { key: 'forward', text: vision.forward || '' },
      ...categoryKeys.map(key => ({ key, text: vision[key] || '' })),
      { key: 'conclusion', text: vision.conclusion || '' }
    ].filter(s => s.text.trim().length > 0)

    const sectionsPayload = sections.map(s => ({
      sectionKey: s.key,
      text: s.text
    }))

    // Run the REAL generation function with dryRun=true
    // This uses the exact same code path as actual generation!
    const startTime = Date.now()
    
    await generateAudioTracks({
      userId: user.id,
      visionId,
      sections: sectionsPayload,
      voice,
      variant,
      dryRun: true // THIS IS THE MAGIC - same code, no API calls!
    })
    
    const duration = Date.now() - startTime

    // Parse the console output to extract character counts
    // (The generateAudioTracks function logs everything we need)
    
    return NextResponse.json({
      success: true,
      message: 'Dry run completed! Check terminal logs for detailed breakdown of what would be sent.',
      visionId,
      voice,
      variant,
      sectionCount: sections.length,
      durationMs: duration,
      note: 'Look at terminal logs for: [DRY RUN] messages showing exact character counts per chunk'
    })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Preview failed'
    }, { status: 500 })
  }
}

