import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAudioTracks } from '@/lib/services/audioService'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { visionId, sectionKey = 'forward', voice } = await request.json()
    
    if (!visionId) {
      return NextResponse.json({ error: 'visionId is required' }, { status: 400 })
    }

    console.log(`\n🧪 [TEST] Single Section Generation`)
    console.log(`🧪 Vision ID: ${visionId}`)
    console.log(`🧪 Section: ${sectionKey}`)
    console.log(`🧪 Voice: ${voice}`)

    // Get vision data
    const { data: vision, error: visionError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .single()

    if (visionError || !vision) {
      return NextResponse.json({ error: 'Vision not found' }, { status: 404 })
    }

    // Get the specific section
    const sectionText = vision[sectionKey]
    if (!sectionText) {
      return NextResponse.json({ error: `Section "${sectionKey}" not found or empty` }, { status: 400 })
    }

    console.log(`🧪 Section text length: ${sectionText.length} characters`)
    console.log(`🧪 First 100 chars: ${sectionText.substring(0, 100)}...`)

    // Generate just this one section
    const sections = [{
      sectionKey,
      text: sectionText
    }]

    const sectionsPayload = sections.map(s => ({
      sectionKey: s.sectionKey,
      text: s.text
    }))

    // Create batch for tracking (just like real generation)
    const { data: batch, error: batchError } = await supabase
      .from('audio_generation_batches')
      .insert({
        user_id: user.id,
        vision_id: visionId,
        variant_ids: ['standard'],
        voice_id: voice || 'alloy',
        sections_requested: sectionsPayload,
        total_tracks_expected: 1,
        status: 'pending'
      })
      .select()
      .single()

    if (batchError || !batch) {
      console.error('🧪 Failed to create batch:', batchError)
      return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })
    }

    console.log(`🧪 Batch created: ${batch.id}`)
    
    // Create a dedicated test audio set (don't reuse existing)
    const { data: testSet, error: setError } = await supabase
      .from('audio_sets')
      .insert({
        vision_id: visionId,
        user_id: user.id,
        name: `Test: ${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)} (${new Date().toLocaleTimeString()})`,
        description: `Single section test - ${sectionKey}`,
        voice_id: voice || 'alloy',
        variant: 'standard'
      })
      .select()
      .single()
    
    if (setError || !testSet) {
      console.error('🧪 Failed to create test audio set:', setError)
      return NextResponse.json({ error: 'Failed to create test audio set' }, { status: 500 })
    }
    
    console.log(`🧪 Created dedicated test audio set: ${testSet.id}`)
    console.log(`🧪 This is a BRAND NEW audio set - no existing tracks to skip!`)
    
    // Update batch with audio_set_id
    await supabase
      .from('audio_generation_batches')
      .update({ audio_set_ids: [testSet.id] })
      .eq('id', batch.id)
    
    console.log(`🧪 Starting generation with force=true...`)
    
    const results = await generateAudioTracks({
      userId: user.id,
      visionId,
      sections,
      voice: voice || 'alloy',
      format: 'mp3',
      force: true, // Force regeneration
      variant: 'standard',
      batchId: batch.id, // Track in batch!
      audioSetId: testSet.id // Use dedicated test set!
    })

    console.log(`🧪 Generation complete!`)
    console.log(`🧪 Results:`, JSON.stringify(results, null, 2))

    return NextResponse.json({
      success: true,
      sectionKey,
      sectionLength: sectionText.length,
      batchId: batch.id,
      results
    })
  } catch (error) {
    console.error('❌ [TEST] Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 })
  }
}

