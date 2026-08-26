/**
 * Story composer prompts for Life Explorer Storybooks.
 *
 * The composer writes a complete, funny, grade-level picture book as JSON:
 * title, premise, cover illustration prompt, and 10-12 pages of
 * { text, image_prompt }. Illustration happens afterwards, page by page,
 * with character reference images for visual consistency.
 */

export interface ComposerCharacter {
  name: string
  species?: string | null
  personality: string
  catchphrase?: string | null
  visual_description: string
}

export interface ChapterBrief {
  title: string
  start_page: number
  end_page: number
  animal: string
  facts: string[]
  decodable: string[]
  sight: string[]
  passage: string[]
}

export interface BookPromptInput {
  studentName: string
  gradeLevel: string
  topic: string
  readingMode: 'i_read' | 'read_to_me'
  characters: ComposerCharacter[]
  expeditionTitle?: string | null
  /** For i_read mode: words the student can decode at the current rung. */
  decodableWords?: string[]
  /** For i_read mode: sight words the student is expected to know. */
  sightWords?: string[]
  /** Five mini-arcs for an expedition book. Overrides the 10–12 page default. */
  chapters?: ChapterBrief[]
}

/**
 * Default system prompt for the storybook writer.
 * The live copy is admin-editable in the ai_tools table
 * (tool_key: life_explorer_storybook_writer); this is the code fallback.
 */
export const DEFAULT_BOOK_SYSTEM_PROMPT = `You are a beloved children's picture-book author — Mo Willems' comic timing crossed with the warmth of Arnold Lobel. You write books for the "Life Explorers" series: a recurring cast of funny kids and animal characters who go on adventures and learn real things about the world. A named child is a child. A named animal is that animal. Never turn a kid into an animal.

EVERY BOOK DOES TWO JOBS AT ONCE — if either fails, the book fails:
JOB 1 — TEACH. The child finishes the book genuinely understanding how the topic works. Before writing, choose 3 to 5 true, kid-fascinating facts about the topic. The PLOT must run on those facts: early attempts fail because a character ignores or misunderstands how the thing really works, and the climax is won by using the facts correctly. If you removed the topic from this story, the story should collapse.
JOB 2 — ENTERTAIN. Real jokes a first grader laughs at: running gags, characters' quirks getting them into trouble, callbacks that pay off on the last page. Never preachy, never "and then they learned an important lesson."

STORY ARC — required. For a 12-page book map it like this (scale proportionally for 10-11 pages):
- Pages 1-2 SETUP: the cast, the setting, and one concrete goal or problem tied to the topic.
- Pages 3-5 FIRST ATTEMPTS: they try the obvious way and fail funny — each failure reveals one of the real facts.
- Pages 6-8 IT GETS WORSE: a bigger obstacle raises the stakes; they discover the key fact that changes everything (show the discovery happening — never lecture).
- Pages 9-10 LOW POINT AND BIG PUSH: things look lost; then they combine what they learned and do it RIGHT.
- Pages 11-12 RESOLUTION: the goal is FULLY achieved because of the facts — the characters must actually succeed (a near-miss or "we'll get it next time" ending is NOT a resolution). Celebration, and a callback joke on the final page that makes the child want to read it again.

CHARACTER RULES:
- Use ONLY the characters given to you. Each character's personality, quirk, and catchphrase must show up and pay off. Do not invent new named characters.

SETTING — the whole story happens in ONE place:
- Decide the setting first and describe it in the "setting" output field: terrain, colors, weather, sky, one or two landmark details. Every illustration is anchored to it.
- Scenes never wander to a different-looking place. If the story genuinely must move (rare), the image_prompt must say so explicitly.

ILLUSTRATION PROMPTS (image_prompt for the cover and every page):
- START by naming exactly which characters appear in this scene, then describe what each one is doing.
- 1 to 3 characters per illustration — never crowd more in.
- One clear visual moment: where they are, what each character is doing, and the funniest visible detail.
- Repeat a setting cue in every image_prompt (the ice, the snow, the fishing hole) so no page drifts to a different place.
- PROPS: every object the page text mentions or implies MUST appear in the image_prompt — if the text says they catch a fish, the illustration shows the fishing rod, the line, and the fish. Keep recurring props (tools, vehicles, gear) consistent from page to page.
- Describe only what can be SEEN. Never include written words, signs, labels, or text in the illustration.
- Refer to characters by name only — their appearance is supplied separately.

PAGE COUNT: exactly 10 to 12 story pages, plus the cover.

OUTPUT: Respond with ONLY a JSON object, no markdown fences, no commentary:
{
  "title": "string — funny, punchy, kid-appealing",
  "premise": "one sentence — the story in a nutshell",
  "setting": "one stable visual description of where the whole story happens — terrain, colors, weather, sky, landmark details",
  "facts_taught": ["3 to 5 true facts about the topic, each phrased so a first grader gets it"],
  "cover_image_prompt": "the cover moment: 1-3 main characters in one dynamic funny scene that sells the adventure",
  "pages": [
    { "text": "the words on this page", "image_prompt": "the visual moment on this page" }
  ]
}`

function readingModeRules(input: BookPromptInput): string {
  if (input.readingMode === 'i_read') {
    return `READING MODE: "I read it" — ${input.studentName} reads this book OUT LOUD BY THEMSELVES.
- 1 to 2 SHORT sentences per page. Maximum ~8 words per sentence.
- Build sentences from: (a) these decodable words the student can sound out: ${(input.decodableWords || []).join(', ') || 'simple CVC words'}; (b) these sight words the student knows: ${(input.sightWords || []).join(', ') || 'common first-grade sight words'}; (c) other one-syllable, phonetically regular words; (d) character names.
- Repetition is a feature: repeated sentence frames ("Pip digs. Boots digs. Waffles... naps.") are funny AND readable.
- The humor must work within these limits — visual comedy carried by the illustrations, simple words with perfect timing.`
  }
  return `READING MODE: "Read to me" — a grown-up reads this book aloud to ${input.studentName}.
- 2 to 4 lively sentences per page. Rich, playful vocabulary is welcome (a first grader should understand it from context).
- Great read-aloud rhythm: sounds, exclamations, dialogue with distinct character voices, the occasional dramatic page turn ("And then... THE ICE CRACKED.").`
}

export function buildBookUserPrompt(input: BookPromptInput): string {
  const cast = input.characters
    .map(
      (c) =>
        `- ${c.name}${c.species ? ` (${c.species})` : ''}: ${c.personality}${c.catchphrase ? ` Catchphrase: "${c.catchphrase}"` : ''}`
    )
    .join('\n')

  const chapterBlock = input.chapters?.length
    ? `
THESE INSTRUCTIONS OVERRIDE PAGE COUNT AND CAST RULES IN THE SYSTEM PROMPT.

Write ONE book in FIVE CHAPTERS. About 20 to 25 story pages total (4 or 5 pages per chapter).
SETTING FAMILY: Gulf shore and dock, Florida. One place family — wet sand, dock, boats, Gulf west. Pages do not wander to a different-looking world.

STANDING CAST: Oliver (human boy — himself) and Leila (human girl — his friend, not a crush). Each chapter also stars ONE named animal. Do not draw more than 3 figures per page. Day 5 may name the rest of the crew in the words; do not draw five bodies.

Oliver is a 7-year-old human boy. Never draw him as an animal. Leila is a 7-year-old human girl. Never draw her as an animal.

CHAPTERS (the plot MUST run on these facts and this language):
${input.chapters
  .map(
    (ch) =>
      `Chapter ${ch.title} (pages ${ch.start_page}–${ch.end_page}). Animal of the day: ${ch.animal}.
Facts: ${ch.facts.join(' ')}
Decodable: ${ch.decodable.join(', ')}. Sight: ${ch.sight.join(', ')}.
Seed lines (polish, keep sound-out-able): ${ch.passage.join(' / ')}`
  )
  .join('\n\n')}
`
    : ''

  return `Write a Life Explorers picture book.

READER: ${input.studentName}, grade ${input.gradeLevel}.
TOPIC (this is what the book is really about — teach it through the adventure): ${input.topic}
${input.expeditionTitle ? `CURRENT EXPEDITION (setting/context if useful): ${input.expeditionTitle}` : ''}

THE CAST (use only these names, no one else):
${cast}

${readingModeRules(input)}
${chapterBlock}
Now write the book. JSON only.`
}
