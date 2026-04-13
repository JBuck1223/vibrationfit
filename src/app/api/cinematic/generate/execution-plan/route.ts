import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { generateExecutionPlan } from '@/lib/cinematic/execution-plan-prompt'
import { buildKeyframePrompt, buildClipPrompt } from '@/lib/cinematic/prompt-builder'
import { FAL_DEFAULT_IMAGE_MODEL, FAL_DEFAULT_EDIT_MODEL, FAL_DEFAULT_VIDEO_MODEL } from '@/lib/cinematic/fal-models'
import type { CuCharacter, StyleGuide, ExecutionPlan } from '@/lib/cinematic/types'

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const { story_prompt, series_id, episode_id, save } = body

  if (!story_prompt?.trim()) {
    return NextResponse.json({ error: 'story_prompt is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Load series + characters
  let characters: CuCharacter[] = []
  let styleGuide: StyleGuide = {}
  let seriesConcept: string | undefined
  let seriesTone: string | undefined
  let targetAspectRatio = 'landscape_16_9'

  if (series_id) {
    const { data: series } = await supabase
      .from('cu_series')
      .select('*')
      .eq('id', series_id)
      .single()

    if (series) {
      styleGuide = (series.style_guide as StyleGuide) || {}
      seriesConcept = series.concept ?? undefined
      seriesTone = series.tone ?? undefined
    }

    const { data: chars } = await supabase
      .from('cu_characters')
      .select('*')
      .or(`series_id.eq.${series_id},series_id.is.null`)

    characters = (chars ?? []) as CuCharacter[]
  }

  if (episode_id) {
    const { data: episode } = await supabase
      .from('cu_episodes')
      .select('target_aspect_ratio')
      .eq('id', episode_id)
      .single()

    if (episode?.target_aspect_ratio) {
      targetAspectRatio = episode.target_aspect_ratio
    }
  }

  try {
    const plan = await generateExecutionPlan({
      storyPrompt: story_prompt,
      characters,
      styleGuide,
      targetAspectRatio,
      seriesConcept,
      seriesTone,
    })

    // If save=true and episode_id provided, save plan to episode and create keyframe/clip rows
    if (save && episode_id) {
      await savePlanToEpisode(supabase, episode_id, plan, characters, styleGuide, targetAspectRatio)
    }

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error('Execution plan generation failed:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate execution plan' }, { status: 500 })
  }
}

async function savePlanToEpisode(
  supabase: ReturnType<typeof createAdminClient>,
  episodeId: string,
  plan: ExecutionPlan,
  characters: CuCharacter[],
  styleGuide: StyleGuide,
  targetAspectRatio: string
) {
  // Save the raw plan to the episode
  await supabase
    .from('cu_episodes')
    .update({ execution_plan: plan, status: 'planning' })
    .eq('id', episodeId)

  // Delete existing keyframes/clips for this episode (fresh start)
  await supabase.from('cu_clips').delete().eq('episode_id', episodeId)
  await supabase.from('cu_keyframes').delete().eq('episode_id', episodeId)

  // Create keyframe rows
  const keyframeRows = plan.keyframes.map((kf) => {
    const built = buildKeyframePrompt({
      keyframe: kf,
      characters,
      styleGuide,
      targetAspectRatio,
    })

    return {
      episode_id: episodeId,
      sort_order: kf.sort_order,
      description: kf.description,
      prompt: built.prompt,
      negative_prompt: built.negativePrompt,
      fal_model: built.generationApproach === 'image_edit' ? FAL_DEFAULT_EDIT_MODEL : FAL_DEFAULT_IMAGE_MODEL,
      target_size: targetAspectRatio,
      character_ids: characters
        .filter((c) => kf.characters.some((name) => c.name.toLowerCase() === name.toLowerCase()))
        .map((c) => c.id),
      reference_image_url: built.referenceImageUrl ?? null,
    }
  })

  const { data: insertedKeyframes } = await supabase
    .from('cu_keyframes')
    .insert(keyframeRows)
    .select('id, sort_order')

  if (!insertedKeyframes) return

  // Build a map from sort_order to keyframe id
  const sortToId = new Map(insertedKeyframes.map((kf) => [kf.sort_order, kf.id]))

  // Wire up style_reference_keyframe_id for keyframes that reference prior ones
  for (const planKf of plan.keyframes) {
    if (planKf.style_reference_sort_order != null) {
      const thisId = sortToId.get(planKf.sort_order)
      const refId = sortToId.get(planKf.style_reference_sort_order)
      if (thisId && refId) {
        await supabase
          .from('cu_keyframes')
          .update({ style_reference_keyframe_id: refId })
          .eq('id', thisId)
      }
    }
  }

  // Create clip rows with enriched prompts using full keyframe context
  const clipRows = plan.clips.map((clip) => {
    const firstId = sortToId.get(clip.first_frame_keyframe)
    const lastId = sortToId.get(clip.last_frame_keyframe)

    const firstKf = plan.keyframes.find((kf) => kf.sort_order === clip.first_frame_keyframe)
    const lastKf = plan.keyframes.find((kf) => kf.sort_order === clip.last_frame_keyframe)

    const clipPrompt = (firstKf && lastKf)
      ? buildClipPrompt({
          clip,
          firstFrameKeyframe: firstKf,
          lastFrameKeyframe: lastKf,
          characters,
          styleGuide,
        })
      : buildClipPrompt(clip.action, clip.camera_motion, styleGuide)

    return {
      episode_id: episodeId,
      sort_order: clip.sort_order,
      first_frame_keyframe_id: firstId!,
      last_frame_keyframe_id: lastId!,
      transition_type: clip.transition_type || 'chain',
      prompt: clipPrompt,
      fal_model: FAL_DEFAULT_VIDEO_MODEL,
      duration_seconds: clip.duration_seconds || 6,
    }
  })

  await supabase.from('cu_clips').insert(clipRows)
}
