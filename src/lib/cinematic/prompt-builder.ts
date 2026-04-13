// Cinematic Universe -- Character-aware prompt construction
// Takes execution plan keyframe descriptions and weaves in character references,
// style guide settings, and consistency directives to produce fal.ai-ready prompts.

import type { CuCharacter, StyleGuide, ExecutionPlanKeyframe, ExecutionPlanClip } from './types'

interface BuildPromptInput {
  keyframe: ExecutionPlanKeyframe
  characters: CuCharacter[]
  styleGuide: StyleGuide
  targetAspectRatio: string
}

function buildStyleBibleSuffix(styleGuide: StyleGuide): string {
  const parts: string[] = []
  if (styleGuide.visual_style) parts.push(styleGuide.visual_style)
  if (styleGuide.color_grading) parts.push(styleGuide.color_grading)
  if (styleGuide.photorealistic !== false) parts.push('Photorealistic, cinematic quality')
  if (styleGuide.extra_notes) parts.push(styleGuide.extra_notes)
  parts.push('no text, no titles, no watermarks')
  return parts.length > 0 ? parts.join(', ') : 'Photorealistic, cinematic quality, no text, no titles, no watermarks'
}

function buildCharacterFragments(characters: CuCharacter[], names: string[]): string[] {
  return characters
    .filter((c) => names.some((name) => c.name.toLowerCase() === name.toLowerCase()))
    .map((c) => {
      if (c.style_notes) return c.style_notes
      if (c.description) return `${c.name}: ${c.description}`
      return null
    })
    .filter((f): f is string => f !== null)
}

/**
 * Build a complete fal.ai-ready prompt for a keyframe image generation.
 * Combines the keyframe description with character style notes, lens/lighting,
 * and the series style bible appended as a consistency suffix.
 */
export function buildKeyframePrompt(input: BuildPromptInput): {
  prompt: string
  negativePrompt: string
  generationApproach: 'generate' | 'image_edit'
  referenceImageUrl?: string
} {
  const { keyframe, characters, styleGuide } = input

  const referencedCharacters = characters.filter((c) =>
    keyframe.characters.some((name) => c.name.toLowerCase() === name.toLowerCase())
  )

  const characterFragments = buildCharacterFragments(characters, keyframe.characters)

  const parts: string[] = []

  parts.push(keyframe.description)

  if (keyframe.camera) parts.push(keyframe.camera)
  if (keyframe.setting) parts.push(keyframe.setting)
  if (keyframe.lens) parts.push(keyframe.lens)
  if (keyframe.lighting) parts.push(keyframe.lighting)
  if (characterFragments.length > 0) parts.push(characterFragments.join('. '))

  // Style bible suffix for consistency across all keyframes
  parts.push(buildStyleBibleSuffix(styleGuide))

  const prompt = parts.join('. ')

  const negativePrompt = 'text, words, letters, titles, subtitles, captions, watermark, logo, signature, stamp, writing, typography, font, label, banner, overlay, cartoon, anime, drawing, sketch, painting, watercolor, low quality, blurry, distorted, deformed'

  let referenceImageUrl: string | undefined
  if (keyframe.generation_approach === 'image_edit') {
    const realPersonChar = referencedCharacters.find(
      (c) => c.character_type === 'real_person' && c.reference_images.length > 0
    )
    if (realPersonChar) {
      referenceImageUrl = realPersonChar.reference_images[0]
    }
  }

  return {
    prompt,
    negativePrompt,
    generationApproach: keyframe.generation_approach,
    referenceImageUrl,
  }
}

export interface BuildClipPromptInput {
  clip: ExecutionPlanClip
  firstFrameKeyframe: ExecutionPlanKeyframe
  lastFrameKeyframe: ExecutionPlanKeyframe
  characters: CuCharacter[]
  styleGuide: StyleGuide
}

/**
 * Build a video clip prompt with full context: clip action, camera motion,
 * keyframe descriptions, character details, and style bible.
 */
export function buildClipPrompt(input: BuildClipPromptInput): string
export function buildClipPrompt(action: string, cameraMotion: string, styleGuide: StyleGuide): string
export function buildClipPrompt(
  actionOrInput: string | BuildClipPromptInput,
  cameraMotion?: string,
  styleGuide?: StyleGuide
): string {
  // Legacy signature for backward compatibility
  if (typeof actionOrInput === 'string') {
    const parts = [actionOrInput]
    if (cameraMotion) parts.push(`Camera: ${cameraMotion}`)
    if (styleGuide?.mood) parts.push(`Mood: ${styleGuide.mood}`)
    parts.push(buildStyleBibleSuffix(styleGuide || {}))
    return parts.join('. ')
  }

  const { clip, firstFrameKeyframe, lastFrameKeyframe, characters, styleGuide: sg } = actionOrInput
  const parts: string[] = []

  parts.push(clip.action)

  if (clip.dialogue) parts.push(clip.dialogue)

  if (clip.camera_motion) parts.push(`Camera: ${clip.camera_motion}`)

  // Include scene context from keyframes
  const sceneContext = firstFrameKeyframe.setting || lastFrameKeyframe.setting
  if (sceneContext) parts.push(`Scene: ${sceneContext}`)

  // Include character appearance for consistency
  const allCharNames = [
    ...new Set([...firstFrameKeyframe.characters, ...lastFrameKeyframe.characters]),
  ]
  const charFragments = buildCharacterFragments(characters, allCharNames)
  if (charFragments.length > 0) parts.push(charFragments.join('. '))

  // Lighting from keyframes
  const lightingContext = firstFrameKeyframe.lighting || lastFrameKeyframe.lighting
  if (lightingContext) parts.push(lightingContext)

  if (sg.mood) parts.push(`Mood: ${sg.mood}`)

  // Style bible suffix
  parts.push(buildStyleBibleSuffix(sg))

  return parts.join('. ')
}
