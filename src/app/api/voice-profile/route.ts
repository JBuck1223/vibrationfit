'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  VoiceProfile,
  WordFlow,
  EmotionalRange,
  DetailLevel,
  EnergyTempo,
  WooLevel,
  HumorPersonality,
  SpeechRhythm,
  EmotionalIntensityPreference,
  NarrativePreference,
  DepthPreference,
} from '@/lib/viva/voice-profile'

const WORD_FLOWS: readonly WordFlow[] = ['simple_direct', 'balanced_expressive', 'lyrical_reflective'] as const
const EMOTIONAL_RANGES: readonly EmotionalRange[] = ['grounded', 'warm_genuine', 'passionate_vibrant'] as const
const DETAIL_LEVELS: readonly DetailLevel[] = ['clean_focused', 'sensory_balanced', 'immersive_cinematic'] as const
const ENERGY_TEMPOS: readonly EnergyTempo[] = ['steady_measured', 'upbeat_flowing', 'spirited_fast'] as const
const WOO_LEVELS: readonly WooLevel[] = [1, 2, 3] as const
const HUMOR_PERSONALITIES: readonly HumorPersonality[] = ['grounded_sincere', 'lighthearted_approachable', 'playful_bold'] as const
const SPEECH_RHYTHMS: readonly SpeechRhythm[] = ['neutral', 'warm_conversational', 'distinct_rooted'] as const
const EMOTIONAL_INTENSITIES: readonly EmotionalIntensityPreference[] = ['low', 'medium', 'high'] as const
const NARRATIVE_PREFERENCES: readonly NarrativePreference[] = ['short_affirmations', 'compact_scenes', 'story_mode'] as const
const DEPTH_PREFERENCES: readonly DepthPreference[] = ['surface_light', 'balanced', 'deep_reflective'] as const

function normalizeEnum<T extends string | number>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function normalizeArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }
  return []
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('voice_profiles fetch error', error)
    return NextResponse.json({ error: 'Failed to load voice profiles' }, { status: 500 })
  }

  const versions = (data ?? []).map((item, index, arr) => ({
    id: item.id,
    user_id: item.user_id,
    word_flow: item.word_flow,
    emotional_range: item.emotional_range,
    detail_level: item.detail_level,
    energy_tempo: item.energy_tempo,
    woo_level: item.woo_level,
    humor_personality: item.humor_personality,
    speech_rhythm: item.speech_rhythm,
    emotional_intensity_preference: item.emotional_intensity_preference,
    narrative_preference: item.narrative_preference,
    depth_preference: item.depth_preference,
    style_label: item.style_label,
    forbidden_styles: item.forbidden_styles ?? [],
    forbidden_words: item.forbidden_words ?? [],
    sample_phrases: item.sample_phrases ?? [],
    source: item.source,
    is_active: item.is_active,
    created_at: item.created_at,
    last_refined_at: item.last_refined_at,
    versionNumber: arr.length - index,
  }))

  const activeProfile = versions.find((item) => item.is_active) ?? null

  return NextResponse.json({ profile: activeProfile, versions })
}

export async function PUT(request: NextRequest) {
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

    const nowIso = new Date().toISOString()
    const profile: VoiceProfile = {
      user_id: user.id,
      word_flow: normalizeEnum<WordFlow>(rawProfile.word_flow, WORD_FLOWS, 'balanced_expressive'),
      emotional_range: normalizeEnum<EmotionalRange>(rawProfile.emotional_range, EMOTIONAL_RANGES, 'warm_genuine'),
      detail_level: normalizeEnum<DetailLevel>(rawProfile.detail_level, DETAIL_LEVELS, 'sensory_balanced'),
      energy_tempo: normalizeEnum<EnergyTempo>(rawProfile.energy_tempo, ENERGY_TEMPOS, 'upbeat_flowing'),
      woo_level: normalizeEnum<WooLevel>(rawProfile.woo_level, WOO_LEVELS, 2),
      humor_personality: normalizeEnum<HumorPersonality>(rawProfile.humor_personality, HUMOR_PERSONALITIES, 'lighthearted_approachable'),
      speech_rhythm: normalizeEnum<SpeechRhythm>(rawProfile.speech_rhythm, SPEECH_RHYTHMS, 'warm_conversational'),
      emotional_intensity_preference: normalizeEnum<EmotionalIntensityPreference>(
        rawProfile.emotional_intensity_preference,
        EMOTIONAL_INTENSITIES,
        'medium'
      ),
      narrative_preference: normalizeEnum<NarrativePreference>(
        rawProfile.narrative_preference,
        NARRATIVE_PREFERENCES,
        'compact_scenes'
      ),
      depth_preference: normalizeEnum<DepthPreference>(rawProfile.depth_preference, DEPTH_PREFERENCES, 'balanced'),
      style_label: rawProfile.style_label ?? 'Balanced, warm, and expressive in a natural way.',
      forbidden_styles: normalizeArray(rawProfile.forbidden_styles),
      forbidden_words: normalizeArray(rawProfile.forbidden_words),
      sample_phrases: normalizeArray(rawProfile.sample_phrases),
      source: 'manual_edit',
      last_refined_at: nowIso,
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
        forbidden_words: profile.forbidden_words,
        sample_phrases: profile.sample_phrases,
        source: profile.source,
        last_refined_at: profile.last_refined_at,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('voice_profile manual edit error', error)
      return NextResponse.json({ error: 'Failed to save voice profile' }, { status: 500 })
    }

    return NextResponse.json({ voice_profile: data })
  } catch (error) {
    console.error('voice_profile update error', error)
    return NextResponse.json({ error: 'Failed to update voice profile' }, { status: 500 })
  }
}
