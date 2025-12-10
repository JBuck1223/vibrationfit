import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  VoiceProfile,
  buildVoiceAnalyzerPrompt,
  type WordFlow,
  type EmotionalRange,
  type DetailLevel,
  type EnergyTempo,
  type WooLevel,
  type HumorPersonality,
  type SpeechRhythm,
  type EmotionalIntensityPreference,
  type NarrativePreference,
  type DepthPreference,
} from '@/lib/viva/voice-profile'
import { generateJSON } from '@/lib/ai/client'

interface VoiceAnalysisResult {
  word_flow: WordFlow
  emotional_range: EmotionalRange
  detail_level: DetailLevel
  energy_tempo: EnergyTempo
  woo_level: WooLevel
  humor_personality: HumorPersonality
  speech_rhythm: SpeechRhythm
  emotional_intensity_preference: EmotionalIntensityPreference
  narrative_preference: NarrativePreference
  depth_preference: DepthPreference
  style_label?: string | null
  forbidden_styles?: string[] | null
  sample_phrases?: string[] | null
  source: 'ai_analysis'
}

function normalizeArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  return []
}

function normalizeEnum<T extends string | number>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

const CLARITY_FIELDS = [
  'clarity_love',
  'clarity_family',
  'clarity_work',
  'clarity_money',
  'clarity_home',
  'clarity_health',
  'clarity_fun',
  'clarity_travel',
  'clarity_social',
  'clarity_stuff',
  'clarity_giving',
  'clarity_spirituality',
] as const

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's active profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_draft', false)
      .maybeSingle()

    if (profileError) {
      console.error('user_profiles fetch error', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile.' }, { status: 500 })
    }

    if (!userProfile) {
      return NextResponse.json({ error: 'No active user profile found.' }, { status: 404 })
    }

    // Collect clarity fields
    const samples: string[] = []

    // Add clarity fields
    CLARITY_FIELDS.forEach((field) => {
      const value = userProfile[field]
      if (value && typeof value === 'string' && value.trim().length > 0) {
        samples.push(`CLARITY (${field.replace('clarity_', '')}): ${value}`)
      }
    })

    if (samples.length === 0) {
      return NextResponse.json(
        { error: 'No clarity fields found in user profile. Complete your profile first.' },
        { status: 400 }
      )
    }

    // Check for existing voice profile
    const { data: existingProfileRow, error: existingError } = await supabase
      .from('voice_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (existingError) {
      console.error('voice_profiles fetch error', existingError)
    }

    const currentProfile: Partial<VoiceProfile> | null = existingProfileRow
      ? {
          user_id: existingProfileRow.user_id,
          word_flow: existingProfileRow.word_flow,
          emotional_range: existingProfileRow.emotional_range,
          detail_level: existingProfileRow.detail_level,
          energy_tempo: existingProfileRow.energy_tempo,
          woo_level: existingProfileRow.woo_level,
          humor_personality: existingProfileRow.humor_personality,
          speech_rhythm: existingProfileRow.speech_rhythm,
          emotional_intensity_preference: existingProfileRow.emotional_intensity_preference ?? undefined,
          narrative_preference: existingProfileRow.narrative_preference ?? undefined,
          depth_preference: existingProfileRow.depth_preference ?? undefined,
          style_label: existingProfileRow.style_label ?? undefined,
          forbidden_styles: normalizeArray(existingProfileRow.forbidden_styles),
          sample_phrases: normalizeArray(existingProfileRow.sample_phrases),
          source: existingProfileRow.source ?? undefined,
          last_refined_at: existingProfileRow.last_refined_at ?? undefined,
        }
      : null

    const prompt = buildVoiceAnalyzerPrompt({ samples, currentProfile })

    const analysis = await generateJSON<VoiceAnalysisResult>(
      prompt,
      'VIVA_VOICE_ANALYZER',
      (data): data is VoiceAnalysisResult => {
        if (!data || typeof data !== 'object') return false
        const candidate = data as Record<string, unknown>
        return (
          typeof candidate.word_flow === 'string' &&
          typeof candidate.emotional_range === 'string' &&
          typeof candidate.detail_level === 'string' &&
          typeof candidate.energy_tempo === 'string' &&
          typeof candidate.woo_level === 'number' &&
          typeof candidate.humor_personality === 'string' &&
          typeof candidate.speech_rhythm === 'string' &&
          typeof candidate.emotional_intensity_preference === 'string' &&
          typeof candidate.narrative_preference === 'string' &&
          typeof candidate.depth_preference === 'string'
        )
      },
      {
        userId: user.id,
        actionType: 'voice_profile_analysis',
        supabaseClient: supabase,
        metadata: {
          sample_count: samples.length,
          has_existing_profile: Boolean(currentProfile),
          source: 'clarity_fields',
        },
      }
    )

    if (!analysis) {
      return NextResponse.json({ error: 'Failed to analyze voice profile.' }, { status: 500 })
    }

    const nowIso = new Date().toISOString()
    const analysisForbidden = normalizeArray(analysis.forbidden_styles)
    const analysisPhrases = normalizeArray(analysis.sample_phrases)

    // Deactivate existing profiles
    await supabase
      .from('voice_profiles')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true)

    const merged: VoiceProfile = {
      user_id: user.id,
      word_flow: analysis.word_flow ?? currentProfile?.word_flow ?? 'balanced_expressive',
      emotional_range: analysis.emotional_range ?? currentProfile?.emotional_range ?? 'warm_genuine',
      detail_level: analysis.detail_level ?? currentProfile?.detail_level ?? 'sensory_balanced',
      energy_tempo: analysis.energy_tempo ?? currentProfile?.energy_tempo ?? 'upbeat_flowing',
      woo_level: normalizeEnum<WooLevel>(analysis.woo_level, [1, 2, 3] as const, currentProfile?.woo_level ?? 2),
      humor_personality:
        analysis.humor_personality ?? currentProfile?.humor_personality ?? 'lighthearted_approachable',
      speech_rhythm: analysis.speech_rhythm ?? currentProfile?.speech_rhythm ?? 'warm_conversational',
      emotional_intensity_preference:
        analysis.emotional_intensity_preference ?? currentProfile?.emotional_intensity_preference ?? null,
      narrative_preference:
        analysis.narrative_preference ?? currentProfile?.narrative_preference ?? null,
      depth_preference: analysis.depth_preference ?? currentProfile?.depth_preference ?? null,
      style_label:
        analysis.style_label ?? currentProfile?.style_label ?? 'Balanced, warm, and expressive in a natural way.',
      forbidden_styles: analysisForbidden.length ? analysisForbidden : currentProfile?.forbidden_styles ?? [],
      sample_phrases: analysisPhrases.length ? analysisPhrases : currentProfile?.sample_phrases ?? [],
      source: currentProfile ? 'hybrid' : 'ai_analysis',
      last_refined_at: nowIso,
      is_active: true,
    }

    const { data: upserted, error: upsertError } = await supabase
      .from('voice_profiles')
      .insert({
        user_id: merged.user_id,
        word_flow: merged.word_flow,
        emotional_range: merged.emotional_range,
        detail_level: merged.detail_level,
        energy_tempo: merged.energy_tempo,
        woo_level: merged.woo_level,
        humor_personality: merged.humor_personality,
        speech_rhythm: merged.speech_rhythm,
        emotional_intensity_preference: merged.emotional_intensity_preference,
        narrative_preference: merged.narrative_preference,
        depth_preference: merged.depth_preference,
        style_label: merged.style_label,
        forbidden_styles: merged.forbidden_styles,
        sample_phrases: merged.sample_phrases,
        source: merged.source,
        last_refined_at: merged.last_refined_at,
        is_active: true,
      })
      .select()
      .single()

    if (upsertError) {
      console.error('voice_profile upsert error', upsertError)
      return NextResponse.json({ error: 'Failed to save voice profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      voice_profile: upserted,
      samples_analyzed: samples.length,
    })
  } catch (error) {
    console.error('voice_profile initial analyze error', error)
    return NextResponse.json({ error: 'Failed to analyze voice profile' }, { status: 500 })
  }
}

