export const LESSON_SYSTEM_PROMPT = `You are the Life Explorer Lesson Composer for Vibration Fit Homeschool — the world's most engaging curiosity-driven homeschool system.

HARD RULE: Do not confuse more content with a better lesson. The best lesson is the smallest complete experience that keeps the parent prepared, the child engaged, and the learning documented.

THE FUN CONTRACT — every lesson MUST satisfy all six beats:
1. HOOK (2 min): a surprising question, mini-mystery, or physical challenge. NEVER "today we will learn about…".
2. STORY MISSION: the lesson is a chapter in the expedition's story; the child is the explorer on a mission.
3. EMBODIMENT: at least one activity where the child moves, builds, tastes, digs, pours, or acts something out. Body before worksheet.
4. ARTIFACT: the lesson ends with something the child would proudly show someone (craft, contraption, comic, recording, experiment log).
5. CHOICE POINT: at least one genuine fork the child decides ("build the iceberg OR paint the map").
6. CELEBRATION CLOSE: present-tense wins, one-word essence, one new Wonder for tomorrow.
Mood check: if the lesson could appear in a public-school packet, it fails. Rewrite it.

FACILITATION GUARANTEES — hard requirements, not niceties:
- Parent prep is 5-10 minutes, zero hunting. Materials must be pantry-grade household items unless they were listed on the weekly forecast (the prompt tells you what was forecast).
- low_battery_mode: a complete 15-minute version (hook + one core activity + log title). Sick days still count.
- sibling_tag_along: a one-line preschool adaptation for every core activity (the household has a younger sibling at the table).
- parent_answer_key: expected answers, kid-language answers to the 3-5 most likely "why?" questions, and the unknown-question script. The parent is never the one being tested.
- resource_queue: all media in play order. No mid-lesson searching.
- block_minutes: per-block minutes; total core ≤ 90 minutes for K-2; extensions clearly optional; include a good stopping point.

RESOURCE CURATION — content earns its place:
- Tier 1 first: SciShow Kids, Nat Geo Kids, PBS Kids, Mystery Doug, Brains On!, Wow in the World, Tumble, Circle Round, Story Pirates, Steve Spangler, The Dad Lab, Exploratorium Snacks, NASA/JPL kids, award-list books, Life of Fred.
- Tier 2: museum/zoo/.gov/.edu kids' content.
- Tier 3 (VF original): if no great resource exists, AUTHOR a complete experiment/craft yourself: materials (household first), steps, kid-language science, what to notice, mess level, minutes.
- NEVER invent a URL, book page, runtime, or review score. Only use URLs given to you in this prompt. Everything else: needs_parent_link: true.
- ON-TOPIC ONLY: every resource you output (core_resource, resource_queue, parent_prep.links) must directly help answer THIS lesson's essential question. Never pad the lesson with off-topic verified URLs just because they are the only URLs available — when no verified resource fits the topic, author a Tier 3 VF-original activity or output a needs_parent_link entry with an honest, searchable title (e.g. "SciShow Kids episode about crystals — parent finds link").
- NO DUPLICATE LISTS: resource_queue is the ONE complete media list in play order — include the core_resource at its play position. parent_prep.links is only for things the parent must open, print, or prepare beforehand that are NOT already in the queue. Never list the same resource twice.
- Videos ≤ 10 min for K-2, ≤ 15 min for grades 3-5.

FOUNDATIONAL LADDERS — sequence never depends on the theme:
- The prompt tells you the child's current math rung and reading rung. The foundational_skills block practices the CURRENT RUNG, dressed in the expedition's story world (decodable mission logs, expedition word problems), and ends with the rung's 60-second mastery check.

RETENTION — the flashback provided in the prompt is precomputed. Copy it into the payload and wrap it in one of the quick game formats.

PRINTABLE — set "printable" ONLY when the hands-on activity genuinely needs a recording sheet (predictions to lock in, measurements or counts to chart). Most lessons need nothing beyond the weekly field-notes page: set printable to null. Never create a printable that is just a worksheet.

OTHER RULES:
- Organize through Life Category + Expedition, not isolated school subjects. Follow KNOW → WONDER → INVESTIGATE → CREATE → REFLECT → CHOOSE → CONTINUE.
- Structure belongs to the parent; curiosity belongs to the child.
- Never tell the parent they are behind. Coverage steers are woven in naturally, never as guilt or worksheet bolt-ons.
- Preserve the child's original language in all Wonder Wall guidance.
- standards_tags: tag the state benchmark families actually touched (e.g. "SC.1.L (living things)", "MA.1.NSO (counting)", "ELA.1.F (phonics)").
- Scripts: natural, warm, concise, non-religious unless asked.
- Return ONLY valid JSON matching the required schema.`

export const CHECKIN_SYSTEM_PROMPT = `You are the Life Explorer Check-in Interpreter. You convert a short parent check-in into structured records.
Return ONLY valid JSON. Preserve the child's exact language. Do not invent facts.
Hard rule: smallest useful structure — do not over-interpret.
When recommending the next action, recommend continue / deepen / change with a one-line rationale, and never imply the family is behind.`

export interface LessonPromptInput {
  studentName: string
  gradeLevel: string
  age: number | null
  interests: string[]
  strengths: string[]
  skillsNeedingSupport: string[]
  lifeCategory: string
  expeditionTitle: string
  essentialQuestions: string[]
  know: string[]
  wonder: Array<{ statement: string; interest_level: number | null; status: string }>
  learned: string[]
  /** The lead explorer's ordered Up Next queue (hard input, not a hint). */
  upNextQueue: string[]
  /** Expedition-level steer from the console: continue | deepen | wrap_up. */
  steerDirection: string | null
  latestRecordSummary: string | null
  recommendedNextAction: string | null
  lessonNumber: number
  /** Current ladder rungs (expedition-independent sequence). */
  mathRung: { label: string; key: string; mastery_check: string }
  readingRung: { label: string; key: string; mastery_check: string }
  /** Precomputed spaced-retrieval items to open the lesson with. */
  flashbackItems: Array<{ prompt: string; learned_statement: string; wonder_item_id?: string | null }>
  flashbackGame: string
  /** Soft coverage steers from the State Requirements Engine. */
  coverageSteers: string[]
  /** Verified pack resources — the ONLY URLs the composer may use. */
  packResources: Array<{
    title: string
    resource_type?: string
    url?: string | null
    needs_parent_link?: boolean
    engagement_tier?: string
    why_selected?: string
  }>
  /** Items already on the weekly materials forecast (may be required). */
  forecastMaterials: string[]
}

export function buildLessonUserPrompt(input: LessonPromptInput): string {
  return `Generate one complete daily lesson for ${input.studentName}.

Student:
- Grade: ${input.gradeLevel}
- Age: ${input.age ?? 'unknown'}
- Interests: ${input.interests.join('; ') || 'none listed'}
- Strengths: ${input.strengths.join('; ') || 'none listed'}
- Skills needing support: ${input.skillsNeedingSupport.join('; ') || 'none listed'}
- Household note: a preschool-age sibling is usually at the table — every core activity needs a sibling_tag_along line.

Expedition:
- Life Category: ${input.lifeCategory}
- Title: ${input.expeditionTitle}
- Essential questions: ${input.essentialQuestions.join('; ') || 'none yet'}
- Lesson number: ${input.lessonNumber}

Wonder Wall — Know (preserve exact wording, even if inaccurate):
${input.know.map((s) => `- ${s}`).join('\n') || '- (empty)'}

Wonder Wall — Wonder (prioritize high interest / unexplored):
${input.wonder.map((w) => `- [${w.status}] (interest ${w.interest_level ?? '?'}) ${w.statement}`).join('\n') || '- (empty)'}

Wonder Wall — Learned:
${input.learned.map((s) => `- ${s}`).join('\n') || '- (empty)'}

Up Next queue — the lead explorer chose these questions (HARD input, not a hint):
${
  input.upNextQueue.length > 0
    ? input.upNextQueue
        .map((q, i) =>
          i === 0
            ? `1. ${q}  ← BUILD THE ENTIRE LESSON AROUND THIS QUESTION`
            : `${i + 1}. ${q}  (weave in only if it fits naturally)`
        )
        .join('\n')
    : '- (queue empty — pick from the Wonder Wall by interest)'
}

Expedition steer from the lead explorer:
${
  input.steerDirection === 'deepen'
    ? '- DEEPEN: dig further into the most recent lesson topic instead of moving on.'
    : input.steerDirection === 'wrap_up'
      ? '- WRAP UP: this is the finale arc. Compose a celebration lesson: harvest the Learned column, build the Expedition Report, present to family, award the certificate from the Expedition Kit.'
      : '- CONTINUE: follow the Up Next queue / Wonder Wall as normal.'
}

Foundational ladders (practice the CURRENT rung inside the story world):
- Math rung: ${input.mathRung.label} — mastery check: ${input.mathRung.mastery_check}
- Reading rung: ${input.readingRung.label} — mastery check: ${input.readingRung.mastery_check}

Expedition Flashback (copy verbatim into payload.flashback, wrapped in the game):
- Game: ${input.flashbackGame}
${input.flashbackItems.map((f) => `- ${f.prompt} [wonder_item_id: ${f.wonder_item_id || 'null'}]`).join('\n') || '- (no items due — set items: [])'}

Coverage steers (weave in naturally; NEVER as guilt or a worksheet bolt-on):
${input.coverageSteers.map((s) => `- ${s}`).join('\n') || '- (coverage is healthy)'}

Verified pack resources — the ONLY URLs you may output. Use only the ones that genuinely fit THIS lesson's topic; skip the rest (anything else: needs_parent_link):
${input.packResources
  .map(
    (r) =>
      `- [${r.engagement_tier || 'verified'}] ${r.title} (${r.resource_type || 'resource'}) ${r.url ? `URL: ${r.url}` : r.needs_parent_link ? '(needs_parent_link)' : ''}`
  )
  .join('\n') || '- (none — all media must be needs_parent_link or vf_original)'}

Materials already on this week's forecast (safe to require):
${input.forecastMaterials.map((m) => `- ${m}`).join('\n') || '- (none — pantry-grade household items only)'}

Most recent lesson record:
${input.latestRecordSummary || 'None yet — this is the first lesson.'}

Recommended next action from last check-in:
${input.recommendedNextAction || 'Start the expedition with an engaging opening lesson.'}

Return JSON with this exact top-level shape:
{
  "identity": { "life_category": string, "expedition": string, "lesson_title": string, "lesson_number": number, "recommended_age_grade": string, "estimated_total_minutes": number, "essential_question": string },
  "parent_prep": { "prep_minutes": number, "materials": string[], "books": string[], "links": [{ "title": string, "url": string|null, "resource_type": string, "runtime": string|null, "why_selected": string, "question_it_answers": string, "needs_parent_link": boolean, "engagement_tier": "franchise"|"verified"|"vf_original" }], "beforehand": string[], "cleanup": string, "safety": string[] },
  "objectives": [{ "area": string, "objective": string }],
  "teacher_script": { "opening": string, "mystery_or_question": string, "transitions": string[], "core_concept": string, "closing": string },
  "wonder_wall": { "know_prompt": string, "wonder_prompts": string[], "learned_guidance": string, "likely_follow_ups": string[] },
  "core_resource": { "title": string, "url": string|null, "resource_type": string, "runtime": string|null, "why_selected": string, "question_it_answers": string, "needs_parent_link": boolean, "engagement_tier": "franchise"|"verified"|"vf_original" },
  "hands_on": { "title": string, "learning_goal": string, "materials": string[], "parent_setup": string, "steps": string[], "prediction_prompt": string|null, "observation_questions": string[], "expected_result": string|null, "why_it_works": string|null, "cleanup": string|null, "safety": string|null } | null,
  "foundational_skills": { "subject": string, "activity": string, "materials": string[], "notes": string },
  "child_output": { "type": string, "description": string },
  "reflection": string[],
  "parent_observation": string[],
  "core_activities": string[],
  "optional_extensions": string[],
  "good_stopping_point": string,
  "time_summary": { "prep_minutes": number, "lesson_minutes": number, "reading_minutes": number, "foundational_minutes": number, "has_experiment": boolean, "has_journal": boolean },
  "fun_contract": { "hook": string, "story_mission": string, "embodiment": string, "artifact": string, "choice_point": string, "celebration_close": string },
  "low_battery_mode": { "total_minutes": 15, "steps": string[], "log_title": string },
  "parent_answer_key": { "expected_answers": string[], "likely_questions": [{ "question": string, "kid_answer": string }], "unknown_script": string },
  "flashback": { "game": string, "items": [{ "prompt": string, "learned_statement": string, "wonder_item_id": string|null }] },
  "sibling_tag_along": [{ "activity": string, "adaptation": string }],
  "block_minutes": [{ "block": string, "minutes": number, "optional": boolean }],
  "resource_queue": [{ "title": string, "url": string|null, "resource_type": string, "engagement_tier": string }],
  "standards_tags": string[],
  "printable": { "title": string, "question": string, "prediction_prompt": string|null, "steps": string[], "chart": { "rows": string[], "columns": string[] }|null, "result_prompt": string|null, "draw_prompt": string|null } | null
}`
}

export function buildCheckInUserPrompt(input: {
  studentName: string
  lessonTitle: string
  enjoyedMost?: string
  createdSaidDemonstrated?: string
  easyOrDifficult?: string
  newQuestion?: string
  direction?: string
  parentNotes?: string
  lowBattery?: boolean
}): string {
  return `Structure this parent check-in for ${input.studentName} after lesson "${input.lessonTitle}".

Answers:
1. Enjoyed most: ${input.enjoyedMost || '(blank)'}
2. Created / said / demonstrated: ${input.createdSaidDemonstrated || '(blank)'}
3. Too easy or difficult: ${input.easyOrDifficult || '(blank)'}
4. New question: ${input.newQuestion || '(blank)'}
5. Direction: ${input.direction || 'continue'}
6. Used low-battery (15-min) version: ${input.lowBattery ? 'yes' : 'no'}
Parent notes: ${input.parentNotes || '(none)'}

Return JSON:
{
  "recommended_next_action": string,
  "learned_statements": string[],
  "wonder_questions": string[],
  "skills_observed": [{ "skill": string, "subject": string, "status": "emerging"|"developing"|"secure"|"needs_support", "notes": string }],
  "evidence": { "title": string, "type": "drawing"|"writing"|"experiment_record"|"journal"|"presentation"|"other"|"photo", "student_explanation": string, "academic_tags": string[] } | null
}`
}
