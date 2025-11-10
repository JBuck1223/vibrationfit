/**
 * Vibrational Analysis Prompts
 * 
 * Prompts for analyzing emotional valence, generating visualization scenes,
 * and creating North Star reflections for vibrational tracking.
 * 
 * Used by: Various vibrational tracking and scene generation features
 */

export interface VibrationalAnalyzerPromptInput {
  category: string
  text: string
}

/**
 * Builds prompt for analyzing emotional valence of user text
 * Returns JSON with emotional_valence, dominant_emotions, intensity, essence_word, etc.
 */
export function buildVibrationalAnalyzerPrompt({
  category,
  text,
}: VibrationalAnalyzerPromptInput): string {
  return `
You will receive a short piece of text from a member about the "${category}" category of their life.

Respond with ONLY a JSON object in this exact shape (no backticks, no comments, no extra text):
{
  "emotional_valence": "below_green_line" | "near_green_line" | "above_green_line",
  "dominant_emotions": string[],
  "intensity": number,
  "essence_word": string,
  "is_contrast": boolean,
  "summary_in_their_voice": string
}

Guidelines:
- emotional_valence: choose the dominant vibrational tone:
  - "below_green_line" = fear, shame, anger, hopelessness, overwhelm, anxiety, scarcity.
  - "near_green_line"  = mixed or wobbling; hopeful but worried, relieved but tense.
  - "above_green_line" = love, appreciation, joy, freedom, ease, confidence.
- Keep dominant_emotions to 3 items max, lowercase, snake_case if multi-word.
- intensity: 1–10, where 1 = very calm/neutral language and 10 = highly charged/intense language.
- essence_word: ONE short word that captures what they WANT to feel here (e.g. "ease", "freedom", "stability", "play", "connection").
- is_contrast: true if they are talking mostly about what's not working, what's missing, or what they don't want.
- summary_in_their_voice:
  - One sentence, present tense, simple language.
  - Paraphrase their felt experience using "I" statements.
  - Do NOT use "I want", "I will", "I wish", or "I don't want". Describe it as an active feeling state.

TEXT TO ANALYZE:
${text.trim()}
`.trim()
}

export interface SceneGenerationPromptInput {
  userId: string
  category: string
  profileGoesWellText?: string | null
  profileNotWellTextFlipped?: string | null
  assessmentSnippets?: string[] | null
  existingVisionParagraph?: string | null
  dataRichnessTier?: 'A' | 'B' | 'C'
}

/**
 * Builds prompt for generating 1-3 present-tense, first-person visualization scenes
 * Returns JSON with array of scenes (title, text, essence_word)
 */
export function buildSceneGenerationPrompt({
  category,
  profileGoesWellText,
  profileNotWellTextFlipped,
  assessmentSnippets,
  existingVisionParagraph,
  dataRichnessTier,
}: SceneGenerationPromptInput): string {
  const snippets = [
    profileGoesWellText ? `• What's going well: ${profileGoesWellText}` : null,
    profileNotWellTextFlipped ? `• Contrast flipped to desired state: ${profileNotWellTextFlipped}` : null,
    assessmentSnippets?.length
      ? `• Assessment highlights:\n${assessmentSnippets.map((s) => `  - ${s}`).join('\n')}`
      : null,
    existingVisionParagraph ? `• Vision excerpt: ${existingVisionParagraph}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return `
Create 1–3 present-tense, first-person visualization scenes for the "${category}" category.

Context (member's own words and signals):
${snippets || '• Limited data provided. Keep scenes universal yet vivid and emotionally resonant.'}

Data richness tier: ${dataRichnessTier || 'C'} (A = lots of detail available, C = very little detail available)

Instructions:
- Each scene is 90–140 words, cinematic and sensory:
  - Include what I see, hear, feel in my body, and the emotional tone.
  - Naturally touch on who I'm with (if relevant), what I'm doing, where I am, and why this moment matters to me.
- Use only details that are consistent with the context. Do NOT invent specific names, cities, companies, brands, or numbers unless clearly implied.
- Language rules:
  - First person ("I") and present tense ONLY.
  - No comparison or lack language:
    - Avoid "I want", "I will", "I wish", "I don't want", "I used to".
    - Avoid "but", "however", "even though", "despite" when contrasting past vs present.
  - Write as if the desired state is normal and natural right now.
- Each scene should end with a separate final line in the text: "Essence: <word>"
  - Essence word = the dominant feeling in that scene (e.g. "ease", "freedom", "connection", "play").
- For data richness:
  - Tier A: Feel free to weave in more specific details from the context.
  - Tier B: Use moderate specificity, staying close to what's given.
  - Tier C: Keep scenes more general but still vivid and emotionally rich.

Respond with ONLY valid JSON in this exact shape (no backticks, no comments, no additional keys):
{
  "scenes": [
    { "title": string, "text": string, "essence_word": string }
  ]
}
`.trim()
}

export interface NorthStarReflectionPromptInput {
  category: string
  snapshot: {
    current_valence: 'below_green_line' | 'near_green_line' | 'above_green_line'
    trending_direction: 'up' | 'down' | 'stable'
    primary_essence?: string | null
    dominant_essence_words?: string[] | null
    avg_intensity?: number | null
    event_count_30d?: number | null
  }
  recentEvents: Array<{
    created_at: string
    emotional_valence: 'below_green_line' | 'near_green_line' | 'above_green_line'
    essence_word?: string | null
    summary_in_their_voice?: string | null
  }>
  supportingVision?: string | null
  supportingScenes?: Array<{ title: string; essence_word?: string | null }> | null
}

/**
 * Builds prompt for generating North Star reflection for a category
 * Returns 2-4 paragraphs of warm, wise, encouraging guidance
 */
export function buildNorthStarReflectionPrompt({
  category,
  snapshot,
  recentEvents,
  supportingVision,
  supportingScenes,
}: NorthStarReflectionPromptInput): string {
  const eventsSection = recentEvents.length
    ? recentEvents
        .map(
          (event, index) =>
            `${index + 1}. ${new Date(event.created_at).toISOString()} | ${event.emotional_valence} | ${event.essence_word || '—'} | ${event.summary_in_their_voice || 'No summary'}`
        )
        .join('\n')
    : 'No recent vibrational events recorded.'

  const scenesSection =
    supportingScenes && supportingScenes.length
      ? supportingScenes
          .map(
            (scene) =>
              `- ${scene.title}${scene.essence_word ? ` (Essence: ${scene.essence_word})` : ''}`
          )
          .join('\n')
      : 'No active scenes logged.'

  return `
You are VIVA, the AI Vibrational Assistant.
You are preparing a North Star reflection for the "${category}" category of a member's life.
You are given INTERNAL CONTEXT ONLY (do not expose these details directly):
Snapshot:
- Current valence: ${snapshot.current_valence}
- Trending direction: ${snapshot.trending_direction}
- Primary essence: ${snapshot.primary_essence || 'unknown'}
- Dominant essence words: ${(snapshot.dominant_essence_words || []).join(', ') || 'none recorded'}
- Average intensity (recent): ${snapshot.avg_intensity?.toFixed(1) ?? 'n/a'}
- Event count (30d): ${snapshot.event_count_30d ?? 0}

Recent vibrational moments (summaries):
${eventsSection}

Supporting vision paragraph (if available):
${supportingVision || 'No vision paragraph available.'}

Supporting scenes (if available):
${scenesSection}

Your job:
- Write 2–4 short paragraphs speaking directly to the member in a warm, wise, encouraging tone.
- Do NOT mention:
  - numbers, scores, counts, "events", "trendlines", "snapshots", or "data".
  - technical terms like "valence", "intensity", "analysis", or "JSON".
- Instead, translate the internal context into:
  1) A gentle reflection of where they are emotionally right now in this category (present tense, no judgment).
  2) A clear highlight of the primary Essence they are reaching for (1–2 words, e.g. "ease", "freedom", "connection").
  3) ONE simple next focus or action that helps them feel slightly better NOW:
     - e.g., revisit a specific scene, reread a line from their vision, or answer a tiny self-reflection question.
- Keep everything present-tense and empowering. You are not fixing them; you are helping them notice and lean into better-feeling thoughts.

Write the response as if you are speaking directly to them. No bullet points, no headings, just natural paragraphs.
`.trim()
}

