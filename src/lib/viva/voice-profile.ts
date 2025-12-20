// ===============================
// TYPES
// ===============================

export type WordFlow = 'simple_direct' | 'balanced_expressive' | 'lyrical_reflective'
export type EmotionalRange = 'grounded' | 'warm_genuine' | 'passionate_vibrant'
export type DetailLevel = 'clean_focused' | 'sensory_balanced' | 'immersive_cinematic'
export type EnergyTempo = 'steady_measured' | 'upbeat_flowing' | 'spirited_fast'
export type WooLevel = 1 | 2 | 3
export type HumorPersonality = 'grounded_sincere' | 'lighthearted_approachable' | 'playful_bold'
export type SpeechRhythm = 'neutral' | 'warm_conversational' | 'distinct_rooted'
export type EmotionalIntensityPreference = 'low' | 'medium' | 'high'
export type NarrativePreference = 'short_affirmations' | 'compact_scenes' | 'story_mode'
export type DepthPreference = 'surface_light' | 'balanced' | 'deep_reflective'

export interface VoiceProfile {
  id?: string
  user_id: string
  word_flow: WordFlow
  emotional_range: EmotionalRange
  detail_level: DetailLevel
  energy_tempo: EnergyTempo
  woo_level: WooLevel
  humor_personality: HumorPersonality
  speech_rhythm: SpeechRhythm
  emotional_intensity_preference?: EmotionalIntensityPreference | null
  narrative_preference?: NarrativePreference | null
  depth_preference?: DepthPreference | null
  style_label?: string | null
  forbidden_styles?: string[] | null
  forbidden_words?: string[] | null
  sample_phrases?: string[] | null
  source?: 'quiz' | 'ai_analysis' | 'hybrid' | 'manual_edit' | null
  last_refined_at?: string | null
  is_active?: boolean | null
}

export interface VoiceAnalyzerPromptInput {
  samples: string[]
  currentProfile?: Partial<VoiceProfile> | null
}

// ===============================
// EXPORT: renderVoiceProfileForPrompt
// ===============================

export function renderVoiceProfileForPrompt(
  profile: Partial<VoiceProfile> | null | undefined
): string {
  if (!profile) {
    return `
VOICE PROFILE (default):
- Style: Neutral, clear, natural.
- Word flow: balanced sentences, no heavy poetry.
- Emotional tone: warm but not dramatic.
- Detail level: moderate; use sensory detail where it helps.
- Energy: calm and steady.
- Spiritual tone: grounded; mention intuition or alignment only if clearly present in user data.
- Humor: light and genuine, never sarcastic.
- Speech rhythm: neutral and timeless.
- If your default writing style clashes with this, adjust to match this profile.
`.trim()
  }

  const lines: string[] = []
  lines.push('VOICE PROFILE (obey this when writing):')

  // Word Flow
  switch (profile.word_flow) {
    case 'simple_direct':
      lines.push('- Word flow: simple and direct. Short, clear sentences that sound like natural speech.')
      break
    case 'balanced_expressive':
      lines.push('- Word flow: balanced and expressive. Mix short and medium sentences with a bit of rhythm.')
      break
    case 'lyrical_reflective':
      lines.push('- Word flow: lyrical and reflective. Flowing sentences are okay, but keep them readable.')
      break
    default:
      lines.push('- Word flow: natural and clear; prioritize ease of reading.')
  }

  // Emotional Range
  switch (profile.emotional_range) {
    case 'grounded':
      lines.push('- Emotional tone: grounded and calm. Express feeling without drama; let steadiness lead.')
      break
    case 'warm_genuine':
      lines.push('- Emotional tone: warm and genuine. Open-hearted but not over the top.')
      break
    case 'passionate_vibrant':
      lines.push('- Emotional tone: passionate and vibrant. Let enthusiasm and joy be clearly felt.')
      break
  }

  // Detail Level
  switch (profile.detail_level) {
    case 'clean_focused':
      lines.push('- Detail level: clean and focused. Use a few strong details instead of long descriptions.')
      break
    case 'sensory_balanced':
      lines.push('- Detail level: sensory and balanced. Include sights, sounds, and feelings where it matters.')
      break
    case 'immersive_cinematic':
      lines.push('- Detail level: immersive and cinematic. Vivid detail is welcome, as long as it stays grounded in the user\'s data.')
      break
  }

  // Energy / Tempo
  switch (profile.energy_tempo) {
    case 'steady_measured':
      lines.push('- Energy/tempo: steady and measured. The writing should feel calm and unhurried.')
      break
    case 'upbeat_flowing':
      lines.push('- Energy/tempo: upbeat and flowing. The writing should feel like smooth, optimistic forward motion.')
      break
    case 'spirited_fast':
      lines.push('- Energy/tempo: spirited and dynamic. Allow a sense of momentum and excitement.')
      break
  }

  // Woo Level
  switch (profile.woo_level) {
    case 1:
      lines.push('- Spiritual tone (Woo Level 1): mostly practical and grounded. Avoid metaphysical language unless the user uses it.')
      break
    case 2:
      lines.push('- Spiritual tone (Woo Level 2): balanced. Comfortable with terms like alignment, intuition, energy, or flow, but stay down-to-earth.')
      break
    case 3:
      lines.push('- Spiritual tone (Woo Level 3): spiritual language is welcome, especially if the user uses it.')
      break
  }

  // Humor / Personality
  switch (profile.humor_personality) {
    case 'grounded_sincere':
      lines.push('- Humor/personality: grounded and sincere. Warm, but not jokey or exaggerated.')
      break
    case 'lighthearted_approachable':
      lines.push('- Humor/personality: lighthearted and approachable. A gentle smile-in-the-words is good.')
      break
    case 'playful_bold':
      lines.push('- Humor/personality: playful and bold, but always supportive.')
      break
  }

  // Speech Rhythm
  switch (profile.speech_rhythm) {
    case 'neutral':
      lines.push('- Speech rhythm: neutral and timeless.')
      break
    case 'warm_conversational':
      lines.push('- Speech rhythm: warm and conversational. Write like a friendly, real person talking.')
      break
    case 'distinct_rooted':
      lines.push('- Speech rhythm: distinct and rooted. A clear sense of individual voice without caricature.')
      break
  }

  // Emotional Intensity
  if (profile.emotional_intensity_preference) {
    const flavour =
      profile.emotional_intensity_preference === 'low'
        ? 'soft and understated'
        : profile.emotional_intensity_preference === 'medium'
        ? 'clear but not extreme'
        : 'big, bright, and fully expressed'
    lines.push(`- Emotional intensity preference: ${profile.emotional_intensity_preference} (feelings should be ${flavour}).`)
  }

  // Narrative Preference
  if (profile.narrative_preference) {
    switch (profile.narrative_preference) {
      case 'short_affirmations':
        lines.push('- Narrative preference: short affirmations. Prefer concise lines over long stories.')
        break
      case 'compact_scenes':
        lines.push('- Narrative preference: compact scenes. Use short vignettes rather than long narratives.')
        break
      case 'story_mode':
        lines.push('- Narrative preference: story mode. Multi-paragraph unfolding scenes are welcome.')
        break
    }
  }

  // Depth Preference
  if (profile.depth_preference) {
    switch (profile.depth_preference) {
      case 'surface_light':
        lines.push('- Depth preference: light. Keep insight gentle and present-focused.')
        break
      case 'balanced':
        lines.push('- Depth preference: balanced. Reflection is welcome, but grounded.')
        break
      case 'deep_reflective':
        lines.push('- Depth preference: deep and reflective. Exploring inner meaning is welcome.')
        break
    }
  }

  if (profile.style_label) {
    lines.push(`- Style label: ${profile.style_label}`)
  }

  if (profile.forbidden_styles?.length) {
    lines.push(`- Forbidden styles: ${profile.forbidden_styles.join(', ')}.`)
  }

  if (profile.forbidden_words?.length) {
    lines.push(`- Forbidden words: ${profile.forbidden_words.join(', ')}. Never use these words.`)
  }

  if (profile.sample_phrases?.length) {
    const phrases = profile.sample_phrases.map((p) => `"${p}"`).join(', ')
    lines.push(`- Sample phrases they actually use: ${phrases}.`)
  }

  lines.push('- If your default writing style clashes with this profile, you MUST adjust to match this profile.')

  return lines.join('\n')
}

// ===============================
// EXPORT: buildVoiceAnalyzerPrompt

// ===============================

export function buildVoiceAnalyzerPrompt({
  samples,
  currentProfile,
}: VoiceAnalyzerPromptInput): string {
  const sampleText = samples.map((s, i) => `SAMPLE ${i + 1}:\n${s}`).join('\n\n')

  const flavorOnlyProfile =
    currentProfile
      ? {
          style_label: currentProfile.style_label,
          forbidden_styles: currentProfile.forbidden_styles ?? [],
          sample_phrases: currentProfile.sample_phrases ?? [],
          source: currentProfile.source,
        }
      : null

  return `
You are analyzing how a person naturally writes and speaks, based on their own words.

Your job:
- Infer or refine this person's voice across these dimensions based on the TEXT SAMPLES ONLY.
- Do NOT use any previous slider values (word_flow, emotional_range, detail_level, energy_tempo, woo_level, humor_personality, speech_rhythm, emotional_intensity_preference, narrative_preference, depth_preference) as input.
- You must infer ALL slider fields fresh from the samples every time.

${
  flavorOnlyProfile
    ? `Existing flavor context (you may refine this if the samples suggest better wording, but do NOT treat it as ground truth for sliders):\n${JSON.stringify(
        flavorOnlyProfile,
        null,
        2
      )}\n`
    : ''
}

VERY IMPORTANT:
- Do NOT default to middle options like "warm_genuine", "sensory_balanced", "woo_level 2", or "medium".
- Only choose middle values when the writing clearly mixes both extremes.
- If the writing leans noticeably toward an extreme, choose the extreme.

Core sliders:
  - word_flow: "simple_direct" | "balanced_expressive" | "lyrical_reflective"
  - emotional_range: "grounded" | "warm_genuine" | "passionate_vibrant"
  - detail_level: "clean_focused" | "sensory_balanced" | "immersive_cinematic"
  - energy_tempo: "steady_measured" | "upbeat_flowing" | "spirited_fast"
  - woo_level: 1 | 2 | 3
  - humor_personality: "grounded_sincere" | "lighthearted_approachable" | "playful_bold"
  - speech_rhythm: "neutral" | "warm_conversational" | "distinct_rooted"

Stylistic preferences:
  - emotional_intensity_preference: "low" | "medium" | "high"
  - narrative_preference: "short_affirmations" | "compact_scenes" | "story_mode"
  - depth_preference: "surface_light" | "balanced" | "deep_reflective"

Flavor:
  - style_label: short description of their voice
  - forbidden_styles: list of styles that would feel wrong for them
  - sample_phrases: 3–7 short phrases or patterns they actually use

If any previous profile or flavor context is provided, treat it as a rough draft ONLY for style_label / forbidden_styles / sample_phrases.
You MUST override all slider fields based solely on the TEXT SAMPLES.
The samples are always the source of truth for sliders.

Respond with ONLY valid JSON in this exact shape (no comments, no backticks):
{
  "word_flow": "simple_direct" | "balanced_expressive" | "lyrical_reflective",
  "emotional_range": "grounded" | "warm_genuine" | "passionate_vibrant",
  "detail_level": "clean_focused" | "sensory_balanced" | "immersive_cinematic",
  "energy_tempo": "steady_measured" | "upbeat_flowing" | "spirited_fast",
  "woo_level": 1 | 2 | 3,
  "humor_personality": "grounded_sincere" | "lighthearted_approachable" | "playful_bold",
  "speech_rhythm": "neutral" | "warm_conversational" | "distinct_rooted",
  "emotional_intensity_preference": "low" | "medium" | "high",
  "narrative_preference": "short_affirmations" | "compact_scenes" | "story_mode",
  "depth_preference": "surface_light" | "balanced" | "deep_reflective",
  "style_label": string,
  "forbidden_styles": string[],
  "sample_phrases": string[],
  "source": "ai_analysis"
}

TEXT SAMPLES:
${sampleText}
`.trim()
}
