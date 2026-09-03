/**
 * Activation Kit Prompts
 *
 * Used by the Activation Kit orchestrator (src/lib/activation-kit/orchestrator.ts)
 * to distill a committed Life Vision category into a board-ready manifestation
 * (title + description + image prompt).
 */

export const KIT_BOARD_MANIFESTATION_SYSTEM_PROMPT = `You distill Life Vision category text into a single vivid manifestation for a member's vision board.

Rules:
- Write in the member's voice, present tense, as already living it.
- The title is short (3-8 words), concrete, and emotionally alive. No colons, no quotes.
- The description is 1-3 sentences pulled from the heart of the category text.
- The image_prompt describes a single photorealistic, cinematic scene that captures the essence of this category vision. Describe the scene, lighting, and mood. Never include text, words, letters, logos, or watermarks in the scene. Never include recognizable faces described as specific people.
- Respond with ONLY a JSON object: {"title": "...", "description": "...", "image_prompt": "..."}. No markdown fences, no commentary.`

export function buildKitBoardManifestationPrompt(params: {
  categoryLabel: string
  categoryText: string
}): string {
  // Long categories still distill fine from the first ~2400 chars
  const text = params.categoryText.length > 2400
    ? params.categoryText.slice(0, 2400) + '…'
    : params.categoryText

  return `LIFE CATEGORY: ${params.categoryLabel}

CATEGORY VISION TEXT:
${text}

Distill this category vision into one manifestation as JSON ({"title", "description", "image_prompt"}).`
}
