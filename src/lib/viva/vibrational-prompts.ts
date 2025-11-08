export interface VibrationalAnalyzerPromptInput {
  category: string
  text: string
}

export function buildVibrationalAnalyzerPrompt({
  category,
  text,
}: VibrationalAnalyzerPromptInput): string {
  return `
You will receive a short piece of text from a member about the "${category}" category of their life.

Respond with ONLY a JSON object in this exact shape:
{
  "emotional_valence": "below_green_line" | "near_green_line" | "above_green_line",
  "dominant_emotions": string[],
  "intensity": number (1-10),
  "essence_word": string,
  "is_contrast": boolean,
  "summary_in_their_voice": string
}

Guidelines:
- Determine the dominant vibrational tone (below/near/above the Green Line).
- Keep dominant_emotions to 3 items max, lowercase, snake_case if multi-word.
- intensity reflects how charged the language feels (1 = calm, 10 = highly charged).
- essence_word captures what they WANT to feel (e.g., ease, freedom, stability).
- is_contrast is true if they are focused on what's not working or unwanted.
- summary_in_their_voice is a single sentence paraphrase using present tense.

TEXT:
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

export function buildSceneGenerationPrompt({
  category,
  profileGoesWellText,
  profileNotWellTextFlipped,
  assessmentSnippets,
  existingVisionParagraph,
  dataRichnessTier,
}: SceneGenerationPromptInput): string {
  const snippets = [
    profileGoesWellText ? `• What’s going well: ${profileGoesWellText}` : null,
    profileNotWellTextFlipped ? `• Contrast flipped: ${profileNotWellTextFlipped}` : null,
    assessmentSnippets?.length
      ? `• Assessment highlights:\n${assessmentSnippets.map((s) => `  - ${s}`).join('\n')}`
      : null,
    existingVisionParagraph ? `• Vision excerpt: ${existingVisionParagraph}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return `
Create 1-3 present-tense, first-person visualization scenes for the "${category}" category.

Context:
${snippets || '• Limited data provided. Keep scenes universal yet vivid.'}

Data richness tier: ${dataRichnessTier || 'C'}

Instructions:
- Scenes are 90-140 words, cinematic, sensory (sight, sound, touch, smell, emotion).
- Use only details consistent with the context. Do not invent specifics like names or locations unless implied.
- Avoid any comparison, lack, or past-tense language. Keep everything in present tense.
- Highlight the emotional tone and embodiment of the desired state.
- Each scene ends with a line: "Essence: <word>"
- Provide a short evocative title for each scene.
- Return ONLY valid JSON in this shape:
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
      ? supportingScenes.map((scene) => `- ${scene.title}${scene.essence_word ? ` (Essence: ${scene.essence_word})` : ''}`).join('\n')
      : 'No active scenes logged.'

  return `
You are preparing a North Star reflection for the "${category}" category.

Snapshot:
- Current valence: ${snapshot.current_valence}
- Trending direction: ${snapshot.trending_direction}
- Primary essence: ${snapshot.primary_essence || 'unknown'}
- Dominant essence words: ${(snapshot.dominant_essence_words || []).join(', ') || 'none recorded'}
- Average intensity (recent): ${snapshot.avg_intensity?.toFixed(1) ?? 'n/a'}
- Event count (30d): ${snapshot.event_count_30d ?? 0}

Recent vibrational moments:
${eventsSection}

Supporting vision paragraph:
${supportingVision || 'No vision paragraph available.'}

Supporting scenes:
${scenesSection}

Write 2-4 short paragraphs:
1. Reflect gently on where they are emotionally (present tense, no judgment).
2. Highlight the primary Essence they are reaching for (1-2 words).
3. Offer ONE simple next focus (e.g., revisit a scene, recall a line, ask a tiny question).
4. Keep tone warm, grounded, encouraging. Focus on feeling better now.
`.trim()
}

