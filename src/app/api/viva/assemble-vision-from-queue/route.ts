// API route to assemble vision from queue-generated category texts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBookendTemplate, determineWooLevel, type Perspective } from '@/lib/viva/bookend-templates'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all category vision texts
    const categoryKeys = VISION_CATEGORIES
      .filter(c => c.order > 0 && c.order < 13)
      .map(c => c.key)

    const { data: categoryStates } = await supabase
      .from('vision_new_category_state')
      .select('category, category_vision_text')
      .eq('user_id', user.id)
      .in('category', categoryKeys)

    // Verify all categories have vision text
    const categoryTexts: Record<string, string> = {}
    categoryStates?.forEach(state => {
      if (state.category_vision_text) {
        categoryTexts[state.category] = state.category_vision_text
      }
    })

    const missingCategories = categoryKeys.filter(key => !categoryTexts[key])
    if (missingCategories.length > 0) {
      return NextResponse.json(
        { error: `Missing vision text for categories: ${missingCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Get user's voice profile for woo level and determine perspective
    let wooLevel: 'high' | 'medium' | 'low' = 'medium'
    let perspective: Perspective = 'singular'
    
    try {
      const { data: voiceProfile } = await supabase
        .from('voice_profiles')
        .select('woo')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (voiceProfile?.woo) {
        wooLevel = determineWooLevel(voiceProfile.woo)
      }

      // Get perspective from profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('perspective')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .maybeSingle()
      
      if (profile?.perspective && (profile.perspective === 'singular' || profile.perspective === 'plural')) {
        perspective = profile.perspective
      }
    } catch (e) {
      console.log('Using default woo level and perspective')
    }

    // Get bookend templates
    const bookendTemplate = getBookendTemplate(wooLevel, perspective)
    const finalForward = bookendTemplate.forward
    const finalConclusion = bookendTemplate.conclusion

    // Standard activation message
    const activationMessage = `Your Life Vision is complete and ready for activation. This is your north star, your decision filter, and your reminder of what matters most. Return to it regularly to stay aligned with your most fun and satisfying life.`

    // Deactivate any existing active visions
    await supabase
      .from('vision_versions')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Create new vision_versions row
    const { data: insertedVision, error: insertError } = await supabase
      .from('vision_versions')
      .insert({
        user_id: user.id,
        title: 'Life Vision',
        forward: finalForward,
        fun: categoryTexts.fun || '',
        travel: categoryTexts.travel || '',
        home: categoryTexts.home || '',
        family: categoryTexts.family || '',
        love: categoryTexts.love || '',
        health: categoryTexts.health || '',
        money: categoryTexts.money || '',
        work: categoryTexts.work || '',
        social: categoryTexts.social || '',
        stuff: categoryTexts.stuff || '',
        giving: categoryTexts.giving || '',
        spirituality: categoryTexts.spirituality || '',
        conclusion: finalConclusion,
        activation_message: activationMessage,
        is_draft: false,
        is_active: true,
        perspective: perspective,
        richness_metadata: {
          assembly_method: 'queue',
          woo_level: wooLevel,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Assemble Vision] Failed to insert vision:', insertError)
      throw new Error('Failed to save vision to database')
    }

    console.log('[Assemble Vision] Created vision_versions row:', insertedVision.id)

    return NextResponse.json({
      visionId: insertedVision.id,
      vision: insertedVision
    })

  } catch (err) {
    console.error('[Assemble Vision] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to assemble vision' },
      { status: 500 }
    )
  }
}

