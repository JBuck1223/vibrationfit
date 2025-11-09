import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  VoiceProfile,
  EmotionalIntensityPreference,
  NarrativePreference,
  DepthPreference,
} from '@/lib/viva/voice-profile'

function parsePreference<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const rawProfile = body.voice_profile as Partial<VoiceProfile> | undefined

    if (!rawProfile) {
      return NextResponse.json({ error: 'voice_profile is required in body' }, { status: 400 })
    }

    await supabase
      .from('voice_profiles')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true)

    const profile: VoiceProfile = {
      user_id: user.id,
      word_flow: rawProfile.word_flow ?? 'balanced_expressive',
      emotional_range: rawProfile.emotional_range ?? 'warm_genuine',
      detail_level: rawProfile.detail_level ?? 'sensory_balanced',
      energy_tempo: rawProfile.energy_tempo ?? 'upbeat_flowing',
      woo_level: rawProfile.woo_level ?? 2,
      humor_personality: rawProfile.humor_personality ?? 'lighthearted_approachable',
      speech_rhythm: rawProfile.speech_rhythm ?? 'warm_conversational',
      emotional_intensity_preference: rawProfile.emotional_intensity_preference
        ? parsePreference<EmotionalIntensityPreference>(
            rawProfile.emotional_intensity_preference,
            ['low', 'medium', 'high'] as const,
            'medium'
          )
        : 'medium',
      narrative_preference: rawProfile.narrative_preference
        ? parsePreference<NarrativePreference>(
            rawProfile.narrative_preference,
            ['short_affirmations', 'compact_scenes', 'story_mode'] as const,
            'compact_scenes'
          )
        : 'compact_scenes',
      depth_preference: rawProfile.depth_preference
        ? parsePreference<DepthPreference>(
            rawProfile.depth_preference,
            ['surface_light', 'balanced', 'deep_reflective'] as const,
            'balanced'
          )
        : 'balanced',
      style_label: rawProfile.style_label ?? 'Balanced, warm, and expressive in a natural way.',
      forbidden_styles: rawProfile.forbidden_styles ?? [],
      sample_phrases: rawProfile.sample_phrases ?? [],
      source: 'quiz',
      last_refined_at: rawProfile.last_refined_at ?? null,
      is_active: true,
    }

    const { data, error } = await supabase
      .from('voice_profiles')
      .insert({
        user_id: profile.user_id,
        word_flow: profile.word_flow,
        emotional_range: profile.emotional_range,
        detail_level: profile.detail_level,
        energy_tempo: profile.energy_tempo,
        woo_level: profile.woo_level,
        humor_personality: profile.humor_personality,
        speech_rhythm: profile.speech_rhythm,
        emotional_intensity_preference: profile.emotional_intensity_preference,
        narrative_preference: profile.narrative_preference,
        depth_preference: profile.depth_preference,
        style_label: profile.style_label,
        forbidden_styles: profile.forbidden_styles,
        sample_phrases: profile.sample_phrases,
        source: profile.source,
        last_refined_at: profile.last_refined_at,
        is_active: profile.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('voice_profile upsert error', error)
      return NextResponse.json({ error: 'Failed to save voice profile' }, { status: 500 })
    }

    return NextResponse.json({ voice_profile: data })
  } catch (error) {
    console.error('voice_profile quiz error', error)
    return NextResponse.json({ error: 'Failed to save voice profile' }, { status: 500 })
  }
}
