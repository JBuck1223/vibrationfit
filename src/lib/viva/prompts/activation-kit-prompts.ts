/**
 * Activation Kit Prompts
 *
 * Board-suggestion list for the commit dialog, plus the legacy per-category
 * distillation used by older kit runs that have no member-picked scenes.
 */

export const KIT_BOARD_MANIFESTATION_SYSTEM_PROMPT = `You distill Life Vision category text into a single vivid manifestation for a member's vision board.

Rules:
- Write in the member's voice, present tense, as already living it.
- The title is short (3-8 words), concrete, and emotionally alive. No colons, no quotes.
- The description is 1-3 sentences pulled from the heart of the category text.
- The image_prompt describes a single photorealistic, cinematic scene that captures the essence of this category vision. Describe the scene, lighting, and mood. Never include text, words, letters, logos, or watermarks in the scene. Never include recognizable faces described as specific people.
- Respond with ONLY a JSON object: {"title": "...", "description": "...", "image_prompt": "..."}. No markdown fences, no commentary.`

export const KIT_BOARD_SUGGESTIONS_SYSTEM_PROMPT = `You propose specific vision-board scenes from a member's Life Vision.

Rules:
- Every suggestion must be grounded in something they actually wrote. Do not invent new desires.
- Prioritize newly added or changed text, and named people, roles, places, and outcomes (e.g. a partner joining the work).
- Cover more than one category when the vision has several vivid moments. Do not default to Fun / Health / Travel.
- Title: 3-8 words, present tense, concrete. No colons, no quotes.
- Description: 1-2 sentences in the member's voice, as already living it. Specific names and roles may appear here.
- image_prompt: one photorealistic cinematic scene. Lighting and mood. No text, logos, watermarks, or recognizable faces — imply a named person through setting, objects, and role, not a likeness.
- Return 6-12 suggestions. Respond with ONLY JSON:
  {"suggestions":[{"category":"work","title":"...","description":"...","image_prompt":"..."}]}
  category must be one of the provided life-category keys. No markdown fences.`

export function buildKitBoardSuggestionsPrompt(params: {
  categories: Array<{
    key: string
    label: string
    current: string
    previous: string
  }>
}): string {
  const blocks = params.categories.map((cat) => {
    const currentRaw = cat.current.trim()
    const previousRaw = cat.previous.trim()
    const changed = currentRaw !== previousRaw
    const current = currentRaw.length > 2800 ? currentRaw.slice(0, 2800) + '…' : currentRaw
    const previous = previousRaw.length > 800 ? previousRaw.slice(0, 800) + '…' : previousRaw
    if (changed && previousRaw) {
      return `## ${cat.label} (${cat.key}) [CHANGED]
CURRENT:
${current || '(empty)'}

PREVIOUS (for contrast — prioritize what is new, including named people and roles):
${previous}`
    }
    return `## ${cat.label} (${cat.key})
${current || '(empty)'}`
  })

  return `Propose board-ready scenes from this Life Vision. Favor [CHANGED] categories and the most specific, emotionally charged moments they wrote. If a named person appears in a new role, include at least one scene for that.

${blocks.join('\n\n')}

Return JSON {"suggestions":[...]} only.`
}

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
