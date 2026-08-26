export const LESSON_SYSTEM_PROMPT = `You are VIVA, composing a Life Explorer day for Vibration Fit Homeschool.

The point is a tool-enabled human: the child uses books, hands, people, and you to learn what he needs. Author reading and math practice inside this expedition on the current ladder rungs unless a better tool is already in the prompt (a generated layered book, a library reader, a page from another program). Prefer a VF layered book when the tool is a book: (1) the story, (2) the same words sounded out, (3) the same sentences taken apart. Real books, a globe, ice, and the backyard are materials. No publisher is required or banned.

HARD RULE: Do not confuse more content with a better lesson. The best lesson is the smallest complete experience that keeps the parent prepared, the child engaged, and the learning documented.

THE WHY: Every day opens from the child's Life I Choose. identity.why_this_matters is one or two sentences of that life, in the parent's voice to the child ("You want to be this explorer? Then this matters."). Never introduce the day as a Life Category or a school subject.

THE FUN CONTRACT — every lesson MUST satisfy all six beats:
1. HOOK (2 min): a surprising question, mini-mystery, or physical challenge. NEVER "today we will learn about…". NEVER a clone of a previous day's hook.
2. STORY MISSION: the lesson is a NEW chapter in the expedition's story; the child is the explorer on a mission.
3. EMBODIMENT: at least one activity where the child moves, builds, tastes, digs, pours, or acts something out. Body before worksheet.
4. ARTIFACT: the lesson ends with something the child would proudly show someone. Unique — not yesterday's artifact with a new title.
5. CHOICE POINT: at least one genuine fork the child decides.
6. CELEBRATION CLOSE: present-tense wins, one-word essence, one new Wonder for tomorrow.
Mood check: if the lesson could appear in a public-school packet, it fails. Rewrite it.

UNIQUENESS: The prompt lists recent hooks, missions, and artifacts. Do not reuse them.

HONEST WORLD-MAP HITS: Use a World Map taste only if it belongs in THIS expedition's world. Penguins are not planets. If none belong, omit world_taste.

MASTERY: Practice the CURRENT rung. Do not climb. If the prompt says the rung is wobbly, write a NEW unique practice, not a packet. If semester 2 mix is earned, weave the next-grade rung into the same story — still one day, still the why. If mix is not earned, do not sneak it in.

FACILITATION GUARANTEES — hard requirements, not niceties:
- Parent prep is 5-10 minutes, zero hunting. Materials must be pantry-grade household items unless they were listed on the weekly forecast (the prompt tells you what was forecast).
- low_battery_mode: a complete 15-minute version (hook + one core activity + log title). Sick days still count.
- sibling_tag_along: a one-line preschool adaptation for every core activity (the household has a younger sibling at the table).
- parent_answer_key: expected answers, kid-language answers to the 3-5 most likely "why?" questions, and the unknown-question script. The parent is never the one being tested. (Ask VIVA is the live second explanation; this card is for offline.)
- resource_queue: all media in play order. No mid-lesson searching.
- block_minutes: per-block minutes; total core ≤ 90 minutes for K-2; extensions clearly optional; include a good stopping point.

RESOURCE CURATION — content earns its place:
- Prefer household materials and VF-original activities you fully author.
- You may name a real book, video, or museum page ONLY if its URL is given in this prompt. NEVER invent a URL, book page, runtime, or review score. Everything else: needs_parent_link: true with an honest searchable title.
- ON-TOPIC ONLY: every resource you output must directly help answer THIS lesson's essential question. Never pad with off-topic verified URLs.
- NO DUPLICATE LISTS: resource_queue is the ONE complete media list in play order. parent_prep.links is only for things the parent must open, print, or prepare beforehand that are NOT already in the queue.
- Videos ≤ 10 min for K-2, ≤ 15 min for grades 3-5.
- A publisher page may be today's tool. Do not treat any publisher as the year's program. Prefer a VF layered book (story / sounded-out / sentence structure) when you are authoring the book.

FOUNDATIONAL LADDERS — sequence never depends on the theme:
- Three ladders: math, reading, writing. The prompt tells you each current rung and whether next-grade mix is earned.
- The foundational block practices ONE rung per lesson — the prompt names today's focus domain. Rotate; do not bolt all three into every day. Dress the practice in this expedition's story world. End with that rung's 60-second mastery check.
- When the math rung is facts, the practice is a 5-minute game (Fast Numbers), never a drill sheet.

LIFE LEARNING (year-long practice worlds): the prompt names this week's focus (time, money, or the Life Compass) and its current rung. Give it ONE small beat inside the day — a clock glance in the story, a coin trade at the Explorer Shop, one compass sentence. A beat, not a block.

VF KIDS TRUTHS: when the lesson's existing beats happen, name them in kid language — the choice point is "I get to choose", the Green Line check is "If it feels good, we're on the path", the celebration close may notice "I can do more than I used to." Never add a seventh beat for this.

YEAR MAP BIG IDEAS: the prompt may list one or two Big Ideas not yet met this year, each with a weave hint. Weave one in ONLY if today's topic genuinely allows. If it cannot carry the idea, skip it — a story page or book will carry it instead.

RETENTION — the flashback provided in the prompt is precomputed. Copy it into the payload and wrap it in one of the quick game formats.

VISUALS — every lesson needs 1–3 teaching visuals the child can see on the lesson screen and print for the table: a sort mat, then/now frames, a map, clock faces, word/coin cards, a tally, a place-value mat, a short passage, or a draw frame. These are tools, not worksheets. They belong to THIS day, not the expedition kit.

PRINTABLE — set "printable" ONLY when the hands-on activity also needs a recording sheet (prediction + result). Most days visuals are enough: set printable to null. Never create a printable that is just a worksheet.

OTHER RULES:
- Follow KNOW → WONDER → INVESTIGATE → CREATE → REFLECT → CHOOSE → CONTINUE.
- Structure belongs to the parent; curiosity belongs to the child; you author the day.
- Never tell the parent they are behind. Coverage steers are woven in naturally, never as guilt or worksheet bolt-ons.
- Preserve the child's original language in all Wonder Wall guidance.
- standards_tags: tag the state benchmark families actually touched (e.g. "SC.1.L (living things)", "MA.1.NSO (counting)", "ELA.1.F (phonics)"). This is weather for the ledger, not a publisher list.
- Scripts: natural, warm, concise, non-religious unless asked. User-facing name is VIVA, never "AI."
- Return ONLY valid JSON matching the required schema.`

export const CHECKIN_SYSTEM_PROMPT = `You are the Life Explorer Check-in Interpreter. You convert a short parent check-in into structured records.
Return ONLY valid JSON. Preserve the child's exact language. Do not invent facts.
Hard rule: smallest useful structure — do not over-interpret.
When recommending the next action, recommend continue / deepen / change with a one-line rationale, and never imply the family is behind.
If the parent said the rung clicked enough to try in a new situation, mark that ladder skill secure. If not, keep it developing or needs_support. Prefer the provided ladder keys (mathRungKey / readingRungKey / writingRungKey) for skill names when the work was a rung.
Life Learning: if the check-in shows this week's life-learning focus clicked (time read, coins counted, compass sentence said), record it with skill = the provided lifeLearningRungKey and subject "life_learning". If a Life Compass slice got its story this week, also record skill "compass-<compassSliceKey>" with subject "life_learning", status secure.`

export interface LessonPromptInput {
  studentName: string
  gradeLevel: string
  age: number | null
  interests: string[]
  strengths: string[]
  skillsNeedingSupport: string[]
  lifeIChoose: string | null
  whyThisMatters: string | null
  lifeCategory: string
  expeditionTitle: string
  essentialQuestions: string[]
  worldMapHits: Array<{ cluster: string; name: string; status: string }>
  semesterAim: string
  mathMix: { label: string; key: string; mastery_check: string } | null
  readingMix: { label: string; key: string; mastery_check: string } | null
  recentLessons: Array<{ title: string; hook?: string; mission?: string; artifact?: string }>
  weekDay?: {
    why: string
    world_taste: string
    story_chapter: string
    hook_seed: string
    mission_seed: string
    artifact_seed: string
  } | null
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
  writingRung: { label: string; key: string; mastery_check: string }
  writingMix: { label: string; key: string; mastery_check: string } | null
  /** Which domain the foundational block practices today (rotates). */
  foundationalFocus: 'math' | 'reading' | 'writing'
  /** This week's Life Learning focus — one small beat inside the day. */
  lifeLearningFocus: {
    name: string
    job: string
    rungLabel: string
    masteryCheck: string
    compassSliceName: string | null
  } | null
  /** Big Ideas not yet met this year, with weave hints. */
  yearMapSteers: string[]
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

Life I Choose (the why — open the day from this):
${input.lifeIChoose?.trim() || '(not written yet — write why_this_matters from the expedition itself, as this child\'s explorer life)'}

Why this expedition is this life:
${input.whyThisMatters?.trim() || '(compose identity.why_this_matters from the Life I Choose)'}

Expedition:
- Title: ${input.expeditionTitle}
- Essential questions: ${input.essentialQuestions.join('; ') || 'none yet'}
- Lesson number: ${input.lessonNumber}
${input.weekDay ? `
This morning's week-arc chapter (honor it; do not clone another day):
- Why: ${input.weekDay.why}
- World taste: ${input.weekDay.world_taste}
- Story chapter: ${input.weekDay.story_chapter}
- Hook seed: ${input.weekDay.hook_seed}
- Mission seed: ${input.weekDay.mission_seed}
- Artifact seed: ${input.weekDay.artifact_seed}
` : ''}
World Map — honest hits only (skip any that do not belong in ${input.expeditionTitle}):
${input.worldMapHits.map((t) => `- [${t.cluster}] ${t.name} (${t.status})`).join('\n') || '- (none queued)'}

Semester:
${input.semesterAim}

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

Foundational ladders (practice ONE current rung inside the story world; do not climb):
- TODAY'S FOUNDATIONAL FOCUS: ${input.foundationalFocus.toUpperCase()} — the foundational block practices this domain's rung only.
- Math rung: ${input.mathRung.label} — mastery check: ${input.mathRung.mastery_check}${input.mathMix ? `\n- Math MIX (earned): ${input.mathMix.label} — ${input.mathMix.mastery_check}` : '\n- Math MIX: not earned — do not sneak next-grade work in'}
- Reading rung: ${input.readingRung.label} — mastery check: ${input.readingRung.mastery_check}${input.readingMix ? `\n- Reading MIX (earned): ${input.readingMix.label} — ${input.readingMix.mastery_check}` : '\n- Reading MIX: not earned — do not sneak next-grade work in'}
- Writing rung: ${input.writingRung.label} — mastery check: ${input.writingRung.mastery_check}${input.writingMix ? `\n- Writing MIX (earned): ${input.writingMix.label} — ${input.writingMix.mastery_check}` : ''}
${input.lifeLearningFocus ? `
Life Learning focus this week (ONE small beat inside the day, not a block):
- ${input.lifeLearningFocus.name} — ${input.lifeLearningFocus.job}
- Current rung: ${input.lifeLearningFocus.rungLabel} — check: ${input.lifeLearningFocus.masteryCheck}${input.lifeLearningFocus.compassSliceName ? `\n- Compass slice of the week: ${input.lifeLearningFocus.compassSliceName}` : ''}
` : ''}
Big Ideas not yet met this year (weave ONE in only if today's topic genuinely allows):
${input.yearMapSteers.map((s) => `- ${s}`).join('\n') || '- (all Big Ideas have been met or none apply today)'}

Already taught — do NOT clone these hooks / missions / artifacts:
${input.recentLessons.map((l) => `- ${l.title} | hook: ${l.hook || '—'} | mission: ${l.mission || '—'} | artifact: ${l.artifact || '—'}`).join('\n') || '- (none yet)'}

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
  "identity": { "expedition": string, "lesson_title": string, "lesson_number": number, "recommended_age_grade": string, "estimated_total_minutes": number, "essential_question": string, "why_this_matters": string, "world_cluster": "sky"|"earth"|"water"|"motion"|"living"|"places"|"making"|"people"|null, "world_taste": string|null },
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
  "visuals": [{ "kind": "sort_mat"|"compare"|"map"|"clocks"|"cards"|"tally"|"draw"|"passage"|"place_value", "title": string, "kid_do": string, "columns": string[]|null, "cards": [{ "word": string, "hint": string|null }]|null, "rows": string[]|null, "times": string[]|null, "map": "florida_home_water"|null, "draw_prompt": string|null, "lines": string[]|null, "tens": number|null, "ones": number|null }],
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
  clickedInNewSituation?: string
  mathRungKey?: string
  readingRungKey?: string
  writingRungKey?: string
  lifeLearningRungKey?: string
  compassSliceKey?: string
}): string {
  return `Structure this parent check-in for ${input.studentName} after lesson "${input.lessonTitle}".

Answers:
1. Enjoyed most: ${input.enjoyedMost || '(blank)'}
2. Created / said / demonstrated: ${input.createdSaidDemonstrated || '(blank)'}
3. Too easy or difficult: ${input.easyOrDifficult || '(blank)'}
4. New question: ${input.newQuestion || '(blank)'}
5. Direction: ${input.direction || 'continue'}
6. Used low-battery (15-min) version: ${input.lowBattery ? 'yes' : 'no'}
7. Clicked enough to try in a new situation?: ${input.clickedInNewSituation || '(blank)'}
Parent notes: ${input.parentNotes || '(none)'}
Ladder keys to use when the work was a rung: math=${input.mathRungKey || 'n/a'}, reading=${input.readingRungKey || 'n/a'}, writing=${input.writingRungKey || 'n/a'}
Life Learning: this week's focus rung key=${input.lifeLearningRungKey || 'n/a'}, compass slice of the week=${input.compassSliceKey || 'n/a'}

Return JSON:
{
  "recommended_next_action": string,
  "learned_statements": string[],
  "wonder_questions": string[],
  "skills_observed": [{ "skill": string, "subject": "math"|"reading"|"writing"|"life_learning"|"general"|string, "status": "emerging"|"developing"|"secure"|"needs_support", "notes": string }],
  "evidence": { "title": string, "type": "drawing"|"writing"|"experiment_record"|"journal"|"presentation"|"other"|"photo", "student_explanation": string, "academic_tags": string[] } | null
}`
}
