import { generateJSON, generateText } from '@/lib/ai/client'
import { buildNorthStarReflectionPrompt, buildSceneGenerationPrompt, buildVibrationalAnalyzerPrompt } from '@/lib/viva/vibrational-prompts'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ensureVibrationalSourceEnabled } from './sources'
import { isValidVibrationalSourceType } from './sourceTypes'
import type {
  EmotionalSnapshotRecord,
  EmotionalValence,
  SceneRecord,
  TrendingDirection,
  VibrationalAnalysis,
  VibrationalEventInsert,
  VibrationalEventRecord,
} from '@/lib/types/vibration'

export interface AnalyzeVibrationInput {
  userId: string
  category: string
  sourceType: string
  text: string
  sourceId?: string | null
  rawText?: string
  recomputeSnapshot?: boolean
}

export async function analyzeVibration(input: AnalyzeVibrationInput): Promise<VibrationalEventRecord> {
  if (!isValidVibrationalSourceType(input.sourceType) && input.sourceType !== 'scene') {
    console.warn(`analyzeVibration called with uncommon sourceType "${input.sourceType}"`)
  }

  const supabase = await createClient()
  await ensureVibrationalSourceEnabled(input.sourceType, supabase)

  const prompt = buildVibrationalAnalyzerPrompt({
    category: input.category,
    text: input.text,
  })

  const analysis =
    (await generateJSON<VibrationalAnalysis>(prompt, 'VIBRATIONAL_ANALYZER', validateVibrationalAnalysis)) ??
    fallbackAnalysis(input.text)

  return createVibrationalEventFromSource({
    userId: input.userId,
    sourceType: input.sourceType,
    supabaseClient: supabase,
    payload: {
      text: input.text,
      analysis,
    },
    overrides: {
      category: input.category,
      source_id: input.sourceId ?? null,
      raw_text: input.rawText ?? input.text,
      emotional_valence: analysis.emotional_valence,
      dominant_emotions: analysis.dominant_emotions,
      intensity: Math.max(1, Math.min(10, Math.round(analysis.intensity || 0))) || null,
      essence_word: analysis.essence_word,
      is_contrast: analysis.is_contrast,
      summary_in_their_voice: analysis.summary_in_their_voice,
    },
    recomputeSnapshot: input.recomputeSnapshot ?? false,
  })
}

export interface SceneGenerationInput {
  userId: string
  category: string
  profileGoesWellText?: string | null
  profileNotWellTextFlipped?: string | null
  assessmentSnippets?: string[] | null
  existingVisionParagraph?: string | null
  dataRichnessTier?: 'A' | 'B' | 'C'
}

export interface GeneratedSceneResult {
  scene: SceneRecord
  vibrationalEvent: VibrationalEventRecord
}

export async function generateScenesForCategory(input: SceneGenerationInput): Promise<GeneratedSceneResult[]> {
  const prompt = buildSceneGenerationPrompt(input)
  const scenePayload = await generateJSON<{ scenes: Array<{ title: string; text: string; essence_word?: string }> }>(
    prompt,
    'VIVA_SCENE_SUGGESTION',
    validateSceneGeneratorResponse
  )

  if (!scenePayload || !scenePayload.scenes.length) {
    return []
  }

  const supabase = await createClient()
  const results: GeneratedSceneResult[] = []

  for (const scene of scenePayload.scenes) {
    const initialInsert = {
      user_id: input.userId,
      category: input.category,
      title: scene.title,
      text: scene.text,
      essence_word: scene.essence_word ?? null,
      emotional_valence: 'near_green_line' as EmotionalValence,
      created_from: 'ai_suggested' as const,
    }

    const { data: insertedScene, error: insertError } = await supabase
      .from('scenes')
      .insert(initialInsert)
      .select()
      .single()

    if (insertError || !insertedScene) {
      console.error('Failed to insert AI-generated scene', insertError)
      continue
    }

    const vibrationalEvent = await analyzeVibration({
      userId: input.userId,
      category: input.category,
      sourceType: 'scene',
      sourceId: insertedScene.id,
      text: scene.text,
      rawText: scene.text,
      recomputeSnapshot: true,
    })

    const { data: updatedScene, error: updateError } = await supabase
      .from('scenes')
      .update({
        essence_word: vibrationalEvent.essence_word ?? scene.essence_word ?? null,
        emotional_valence: vibrationalEvent.emotional_valence,
      })
      .eq('id', insertedScene.id)
      .select()
      .single()

    if (updateError || !updatedScene) {
      console.error('Failed to update scene with analyzer results', updateError)
      continue
    }

    results.push({
      scene: updatedScene as SceneRecord,
      vibrationalEvent,
    })
  }

  return results
}

export async function recomputeEmotionalSnapshot(
  userId: string,
  category: string,
  client?: SupabaseClient
): Promise<EmotionalSnapshotRecord> {
  const supabase = client ?? (await createClient())
  const now = new Date()
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const { data: events, error } = await supabase
    .from('vibrational_events')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .gte('created_at', sixtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch vibrational events for snapshot: ${error.message}`)
  }

  const valenceScore = (valence: EmotionalValence): number => {
    switch (valence) {
      case 'above_green_line':
        return 1
      case 'below_green_line':
        return -1
      default:
        return 0
    }
  }

  const weightedScore = events?.reduce(
    (acc, event) => {
      const eventDate = new Date(event.created_at)
      const ageRatio = Math.min(1, Math.max(0.1, 1 - (now.getTime() - eventDate.getTime()) / (60 * 24 * 60 * 60 * 1000)))
      const score = valenceScore(event.emotional_valence as EmotionalValence)
      return {
        total: acc.total + score * ageRatio,
        weight: acc.weight + ageRatio,
      }
    },
    { total: 0, weight: 0 }
  )

  const averageWeightedScore = weightedScore && weightedScore.weight > 0 ? weightedScore.total / weightedScore.weight : 0
  const currentValence = scoreToValence(averageWeightedScore)

  const recent30 = (events || []).filter((event) => new Date(event.created_at) >= thirtyDaysAgo)
  const prior30 = (events || []).filter(
    (event) => new Date(event.created_at) >= sixtyDaysAgo && new Date(event.created_at) < thirtyDaysAgo
  )

  const avgRecent = getAverageScore(recent30, valenceScore)
  const avgPrior = getAverageScore(prior30, valenceScore)
  const trendingDirection = determineTrend(avgRecent, avgPrior)

  const intensityValues = (events || [])
    .map((event) => (typeof event.intensity === 'number' ? Number(event.intensity) : null))
    .filter((value): value is number => value !== null && !Number.isNaN(value))

  const avgIntensity =
    intensityValues.length > 0 ? Number((intensityValues.reduce((sum, value) => sum + value, 0) / intensityValues.length).toFixed(2)) : null

  const essenceCounts = new Map<string, number>()
  for (const event of events || []) {
    if (event.essence_word) {
      const key = String(event.essence_word).toLowerCase()
      essenceCounts.set(key, (essenceCounts.get(key) || 0) + 1)
    }
  }

  const dominantEssenceWords = Array.from(essenceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)

  const primaryEssence =
    events && events.length > 0
      ? events[events.length - 1].essence_word ?? dominantEssenceWords[0] ?? null
      : dominantEssenceWords[0] ?? null

  const lastEventAt = events && events.length > 0 ? events[events.length - 1].created_at : null
  const eventCount7d = (events || []).filter((event) => new Date(event.created_at) >= sevenDaysAgo).length
  const eventCount30d = recent30.length

  const lastSceneId =
    events
      ?.slice()
      .reverse()
      .find((event) => event.source_type === 'scene' && event.source_id)?.source_id ?? null

  const lastVisionId =
    events
      ?.slice()
      .reverse()
      .find((event) => event.source_type === 'vision_paragraph' && event.source_id)?.source_id ?? null

  const upsertPayload = {
    user_id: userId,
    category,
    current_valence: currentValence,
    trending_direction: trendingDirection,
    avg_intensity: avgIntensity,
    dominant_essence_words: dominantEssenceWords,
    primary_essence: primaryEssence,
    last_event_at: lastEventAt,
    event_count_7d: eventCount7d,
    event_count_30d: eventCount30d,
    last_scene_id: lastSceneId,
    last_vision_id: lastVisionId,
  }

  const { data, error: upsertError } = await supabase
    .from('emotional_snapshots')
    .upsert(upsertPayload, { onConflict: 'user_id,category' })
    .select()
    .single()

  if (upsertError || !data) {
    throw new Error(`Failed to upsert emotional snapshot: ${upsertError?.message}`)
  }

  return data as EmotionalSnapshotRecord
}

export interface NorthStarReflectionInput {
  category: string
  snapshot: EmotionalSnapshotRecord
  recentEvents: Array<Pick<VibrationalEventRecord, 'created_at' | 'emotional_valence' | 'essence_word' | 'summary_in_their_voice'>>
  supportingVision?: string | null
  supportingScenes?: Array<Pick<SceneRecord, 'title' | 'essence_word'>>
}

export async function generateNorthStarReflection(input: NorthStarReflectionInput): Promise<string> {
  const userPrompt = buildNorthStarReflectionPrompt({
    category: input.category,
    snapshot: {
      current_valence: input.snapshot.current_valence,
      trending_direction: input.snapshot.trending_direction,
      primary_essence: input.snapshot.primary_essence,
      dominant_essence_words: input.snapshot.dominant_essence_words,
      avg_intensity: input.snapshot.avg_intensity,
      event_count_30d: input.snapshot.event_count_30d,
    },
    recentEvents: input.recentEvents,
    supportingVision: input.supportingVision ?? null,
    supportingScenes: input.supportingScenes ?? null,
  })

  const response = await generateText({
    feature: 'VIVA_NORTH_STAR_REFLECTION',
    messages: [{ role: 'user', content: userPrompt }],
  })

  if (response.error) {
    throw new Error(`Failed to generate North Star reflection: ${response.error}`)
  }

  return response.content.trim()
}

function validateVibrationalAnalysis(data: any): data is VibrationalAnalysis {
  if (!data || typeof data !== 'object') return false
  const { emotional_valence, dominant_emotions, intensity, essence_word, is_contrast, summary_in_their_voice } = data
  return (
    ['below_green_line', 'near_green_line', 'above_green_line'].includes(emotional_valence) &&
    Array.isArray(dominant_emotions) &&
    typeof intensity === 'number' &&
    typeof essence_word === 'string' &&
    typeof is_contrast === 'boolean' &&
    typeof summary_in_their_voice === 'string'
  )
}

function fallbackAnalysis(text: string): VibrationalAnalysis {
  return {
    emotional_valence: 'near_green_line',
    dominant_emotions: [],
    intensity: 5,
    essence_word: 'ease',
    is_contrast: /not|without|tired|struggle|fear|worry|lack/i.test(text),
    summary_in_their_voice: text.slice(0, 140),
  }
}

function validateSceneGeneratorResponse(data: any): data is { scenes: Array<{ title: string; text: string; essence_word?: string }> } {
  if (!data || typeof data !== 'object' || !Array.isArray(data.scenes)) return false
  return data.scenes.every(
    (scene) => scene && typeof scene.title === 'string' && typeof scene.text === 'string' && scene.text.length > 0
  )
}

function scoreToValence(score: number): EmotionalValence {
  if (score > 0.25) return 'above_green_line'
  if (score < -0.25) return 'below_green_line'
  return 'near_green_line'
}

function getAverageScore(events: any[] | null | undefined, scoreFn: (valence: EmotionalValence) => number): number {
  if (!events || events.length === 0) return 0
  const total = events.reduce((sum, event) => sum + scoreFn(event.emotional_valence as EmotionalValence), 0)
  return total / events.length
}

function determineTrend(current: number, previous: number): TrendingDirection {
  const delta = current - previous
  if (delta > 0.15) return 'up'
  if (delta < -0.15) return 'down'
  return 'stable'
}

function getValueFromPath(source: Record<string, any>, path: string): any {
  return path.split('.').reduce<any>((value, segment) => {
    if (value === null || value === undefined) return undefined
    return value[segment]
  }, source)
}

export interface CreateVibrationalEventParams {
  userId: string
  sourceType: string
  supabaseClient?: SupabaseClient
  payload?: Record<string, any>
  overrides?: Partial<VibrationalEventInsert>
  recomputeSnapshot?: boolean
}

export async function createVibrationalEventFromSource({
  userId,
  sourceType,
  supabaseClient,
  payload = {},
  overrides = {},
  recomputeSnapshot = false,
}: CreateVibrationalEventParams): Promise<VibrationalEventRecord> {
  const supabase = supabaseClient ?? (await createClient())
  const source = await ensureVibrationalSourceEnabled(sourceType, supabase)

  const mapped: Partial<VibrationalEventInsert> = {}
  const fieldMap = source.field_map ?? {}

  for (const [column, path] of Object.entries(fieldMap)) {
    const value = getValueFromPath(payload, path)
    if (value !== undefined) {
      ;(mapped as Record<string, any>)[column] = value
    }
  }

  const category =
    overrides.category ??
    mapped.category ??
    source.default_category ??
    'general'

  const dominantEmotions = (() => {
    const overrideValue = overrides.dominant_emotions
    if (Array.isArray(overrideValue)) {
      return overrideValue
    }
    const mappedValue = mapped.dominant_emotions
    if (Array.isArray(mappedValue)) {
      return mappedValue
    }
    return undefined
  })()

  const insertPayload: VibrationalEventInsert = {
    user_id: userId,
    category,
    source_type: sourceType,
    source_id: overrides.source_id ?? mapped.source_id ?? null,
    raw_text: overrides.raw_text ?? mapped.raw_text ?? null,
    emotional_valence:
      overrides.emotional_valence ?? mapped.emotional_valence ?? 'near_green_line',
    dominant_emotions: dominantEmotions,
    intensity: overrides.intensity ?? mapped.intensity ?? null,
    essence_word: overrides.essence_word ?? mapped.essence_word ?? null,
    is_contrast: overrides.is_contrast ?? mapped.is_contrast ?? false,
    summary_in_their_voice:
      overrides.summary_in_their_voice ?? mapped.summary_in_their_voice ?? null,
  }

  const { data, error } = await supabase
    .from('vibrational_events')
    .insert(insertPayload)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to insert vibrational event: ${error?.message}`)
  }

  if (recomputeSnapshot) {
    try {
      await recomputeEmotionalSnapshot(userId, insertPayload.category, supabase)
    } catch (snapshotError) {
      console.error('Failed to recompute emotional snapshot:', snapshotError)
    }
  }

  return data as VibrationalEventRecord
}

