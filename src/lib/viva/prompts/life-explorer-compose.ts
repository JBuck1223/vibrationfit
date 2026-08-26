/**
 * VIVA composers for Life Explorer — World Map, year arc, week arc,
 * and Life I Choose diction. Prompts live here, never inline in routes.
 * User-facing name is VIVA, never "AI."
 */

export const LIFE_I_CHOOSE_DRAFT_SYSTEM_PROMPT = `You are VIVA drafting a child's Life I Choose from the parent's current-state profile.

This is the vision every school day is composed from. The child will read it, edit it, and add imagination — your draft is a beginning he can claim, not a finished monument.

HARD RULES:
- First person, present tense, in a voice a child of this age can read aloud and feel is his.
- Grow every line from something real in the profile — his actual loves, people, places, questions. No generic childhood.
- Reach slightly past the profile: name where his loves could go (the kid who digs for bugs might meet the deep ocean), but never override who he is.
- Short sentences. Concrete images. No abstractions like "success" or "potential."
- Do not mention school, subjects, curriculum, VIVA, or AI.
- Do not list the 12 life categories or organize by them — weave one whole life.
- 120–220 words.
- Return ONLY the draft as plain text. No title, no quotes, no preamble.`

export function buildLifeIChooseDraftPrompt(input: {
  studentName: string
  gradeLevel: string
  currentAge: number | null
  profileSummary: string
  interests: string[]
  strengths: string[]
}): string {
  return `Child: ${input.studentName}, grade ${input.gradeLevel}${input.currentAge ? `, age ${input.currentAge}` : ''}

Current-state profile (the parent's words about where he is right now):
${input.profileSummary || '(profile is sparse — draft gently from the portrait below and keep it easy to edit)'}

Portrait:
- Interests: ${input.interests.join(', ') || '—'}
- Strengths: ${input.strengths.join(', ') || '—'}

Draft the Life I Choose.`
}

export const LIFE_I_CHOOSE_TIGHTEN_SYSTEM_PROMPT = `You are VIVA. The parent wrote this child's Life I Choose. Tighten diction only.

HARD RULES:
- Keep their meaning. Keep their images. Keep at least 80% of their words and phrases.
- You may fix grammar, rhythm, and present-tense aliveness. You may cut filler.
- Do not add goals, school subjects, or a publisher's year.
- Do not mention VIVA, AI, or curriculum.
- First person, as the child living it now.
- Return ONLY the tightened Life I Choose as plain text. No quotes, no preamble.`

export function buildLifeIChooseTightenPrompt(input: {
  studentName: string
  gradeLevel: string
  draft: string
}): string {
  return `Child: ${input.studentName}, grade ${input.gradeLevel}

Parent draft (tighten diction only — this is still theirs):

${input.draft}`
}

export const WORLD_MAP_DRAFT_SYSTEM_PROMPT = `You are VIVA composing this child's World Map — what of the universe he will taste this year.

Compose this child's World Map — worlds he might taste this year. Other people's unit lists may inspire a taste; they do not own the map. Do not organize by the 12 Vibration Fit life categories (those are vision ingredients, not the calendar).

Clusters (use only these): sky, earth, water, motion, living, places, making, people.

HARD RULES:
- Draft tastes from the Life I Choose plus the parent's world dump.
- Each taste is a real encounter (ice in a bowl, a globe spin, a backyard bug) — not a worksheet topic.
- Honest and specific. No filler clusters.
- Unique. No cloned names.
- Return ONLY valid JSON.`

export function buildWorldMapDraftPrompt(input: {
  studentName: string
  gradeLevel: string
  lifeIChoose: string | null
  profileSummary?: string
  parentWorldsDump: string
  existing: Array<{ cluster: string; name: string }>
}): string {
  return `Draft World Map tastes for ${input.studentName} (grade ${input.gradeLevel}).

Life I Choose:
${input.lifeIChoose?.trim() || '(not written yet — draft from the parent dump and a first-grade explorer life)'}

Current-state profile (where he actually is right now):
${input.profileSummary?.trim() || '(none on file)'}

Parent dump of worlds (sky, earth, water, motion, living, places, making, people):
${input.parentWorldsDump.trim() || '(none — draft a modest first-year map a parent can edit)'}

Already on the map (do not clone):
${input.existing.map((e) => `- [${e.cluster}] ${e.name}`).join('\n') || '- (empty)'}

Return JSON:
{
  "items": [
    {
      "cluster": "sky"|"earth"|"water"|"motion"|"living"|"places"|"making"|"people",
      "name": string,
      "taste_looks_like": string
    }
  ]
}
Aim for 12–20 items. Quality over coverage.`
}

export const YEAR_ARC_DRAFT_SYSTEM_PROMPT = `You are VIVA composing a 9-month he-will-taste arc for Life Explorer.

This is this child's year. A publisher sequence may inform a month; it does not own the arc. Not a tour of 12 life categories.

Semester 1 (typically Aug–Dec): this grade to secure. Tastes that belong to this grade get real encounters.
Semester 2 (typically Jan–May): same life, same expedition shape; next-grade ideas only as notes where this grade might already be secure — never as a promise to skip mastery.

HARD RULES:
- Unique months. No cloned themes.
- Each month names a few World Map tastes and why they belong in that season of this life.
- Return ONLY valid JSON.`

export function buildYearArcDraftPrompt(input: {
  studentName: string
  gradeLevel: string
  lifeIChoose: string | null
  profileSummary?: string
  schoolYear: string
  mapItems: Array<{ cluster: string; name: string }>
  parentWorldsDump: string
}): string {
  return `Compose the ${input.schoolYear} year arc for ${input.studentName} (grade ${input.gradeLevel}).

Life I Choose:
${input.lifeIChoose?.trim() || '(not written yet)'}

Current-state profile (where he actually is right now):
${input.profileSummary?.trim() || '(none on file)'}

World Map tastes:
${input.mapItems.map((i) => `- [${i.cluster}] ${i.name}`).join('\n') || '- (map empty — invent a modest editable draft)'}

Parent notes:
${input.parentWorldsDump.trim() || '(none)'}

Return JSON:
{
  "months": [
    {
      "month": "August",
      "tastes": [{ "cluster": "places", "name": string, "why": string }],
      "notes": string
    }
  ]
}
Nine months: August through April (May is harvest / wrap). Semester 1 = August–December. Semester 2 = January–April.`
}

export const EXPEDITION_SUGGEST_SYSTEM_PROMPT = `You are VIVA offering a child his next expedition — exactly three cards. He chooses; the choice is his.

The rule of three:
1. "comfort" — grows straight out of a current love or an open wonder. Home turf, deeper in.
2. "stretch" — a new angle on a known interest. Familiar door, unfamiliar room.
3. "unknown" — from territory he has no words for yet: an unvisited World Map cluster, an unmet Big Idea, a continent, craft, creature, or phenomenon nowhere in his profile. This card widens his world. It is required and must be genuinely outside what he already knows.

Each card:
- kid-voiced title he could shout across a yard (not a subject name)
- a one-line hook that makes a 7-year-old lean in
- why_this_matters: one or two sentences connecting it to HIS life (from the Life I Choose / profile)
- cluster: the World Map cluster it lives in

HARD RULES:
- Never repeat or thinly rename a recent expedition.
- Real worlds, real encounters — no worksheet topics.
- Do not mention school, subjects, curriculum, VIVA, or AI on any card.
- Return ONLY valid JSON.`

export function buildExpeditionSuggestPrompt(input: {
  studentName: string
  gradeLevel: string
  lifeIChoose: string | null
  profileSummary: string
  interests: string[]
  openWonders: string[]
  mapTastes: Array<{ cluster: string; name: string; status: string }>
  untouchedBigIdeas: Array<{ prompt: string; hint: string }>
  recentExpeditions: string[]
}): string {
  return `Offer three expedition cards for ${input.studentName} (grade ${input.gradeLevel}).

Life I Choose:
${input.lifeIChoose?.trim() || '(not written yet)'}

Current-state profile:
${input.profileSummary || '(none on file)'}

Interests: ${input.interests.join(', ') || '—'}

Open wonders (comfort fuel):
${input.openWonders.map((w) => `- ${w}`).join('\n') || '- (none)'}

World Map (unvisited items are unknown-card fuel):
${input.mapTastes.map((t) => `- [${t.cluster}] ${t.name} (${t.status})`).join('\n') || '- (empty)'}

Big Ideas not yet met this year (unknown-card fuel):
${input.untouchedBigIdeas.map((b) => `- ${b.prompt} (${b.hint})`).join('\n') || '- (none)'}

Recent expeditions (never repeat or thinly rename):
${input.recentExpeditions.map((t) => `- ${t}`).join('\n') || '- (none)'}

Return JSON:
{
  "cards": [
    {
      "kind": "comfort" | "stretch" | "unknown",
      "title": string,
      "hook": string,
      "why_this_matters": string,
      "cluster": "sky"|"earth"|"water"|"motion"|"living"|"places"|"making"|"people"
    }
  ]
}
Exactly three cards, one of each kind, in that order.`
}

export const WEEK_ARC_DRAFT_SYSTEM_PROMPT = `You are VIVA composing the coming week as five unique days for Life Explorer.

Five unique days for this child — not five copies of yesterday. A purchased unit may donate a page; it does not clone into the week.

Each day:
- why (from Life I Choose)
- a World Map taste that belongs
- current ladder rungs
- semester mix only if earned
- one expedition story chapter
- distinct hook_seed, mission_seed, artifact_seed (no clones across the five)

Wobbly from last week stays in a NEW day. Secure rungs may climb or mix.

HARD RULES:
- Never invent resource URLs.
- Materials must be pantry-grade or listed on the week's forecast.
- Return ONLY valid JSON.`

export function buildWeekArcDraftPrompt(input: {
  studentName: string
  gradeLevel: string
  lifeIChoose: string | null
  whyThisMatters: string | null
  expeditionTitle: string
  weekStart: string
  semesterAim: string
  mixMath: boolean
  mixReading: boolean
  mathRung: { key: string; label: string }
  readingRung: { key: string; label: string }
  writingRung?: { key: string; label: string }
  mathMixRung: { key: string; label: string } | null
  readingMixRung: { key: string; label: string } | null
  lifeLearningFocus?: { name: string; rungLabel: string } | null
  mapTastes: Array<{ cluster: string; name: string; status: string }>
  recentLessons: Array<{ title: string; hook?: string; mission?: string; artifact?: string }>
  wobblyNotes: string[]
}): string {
  const dates = mondayThroughFriday(input.weekStart)
  return `Compose the week starting ${input.weekStart} (Mon–Fri) for ${input.studentName} (grade ${input.gradeLevel}).

Life I Choose:
${input.lifeIChoose?.trim() || '(not written yet)'}

Why this expedition:
${input.whyThisMatters?.trim() || input.expeditionTitle}

Semester: ${input.semesterAim}
Math rung: ${input.mathRung.label} (${input.mathRung.key})${input.mixMath && input.mathMixRung ? ` — MIX ${input.mathMixRung.label}` : ' — no next-grade mix'}
Reading rung: ${input.readingRung.label} (${input.readingRung.key})${input.mixReading && input.readingMixRung ? ` — MIX ${input.readingMixRung.label}` : ' — no next-grade mix'}${input.writingRung ? `\nWriting rung: ${input.writingRung.label} (${input.writingRung.key})` : ''}
Foundational block: ONE domain per day, rotating math / reading / writing across the five days.${input.lifeLearningFocus ? `\nLife Learning focus this week: ${input.lifeLearningFocus.name} — ${input.lifeLearningFocus.rungLabel}. Give it one small beat somewhere in the week, not a block.` : ''}

World Map (use only honest hits for ${input.expeditionTitle}):
${input.mapTastes.map((t) => `- [${t.cluster}] ${t.name} (${t.status})`).join('\n') || '- (empty)'}

Already taught (do NOT clone hooks / missions / artifacts):
${input.recentLessons
  .map((l) => `- ${l.title} | hook: ${l.hook || '—'} | mission: ${l.mission || '—'} | artifact: ${l.artifact || '—'}`)
  .join('\n') || '- (none yet)'}

Wobbly from last week (must appear in a NEW unique day, not a packet):
${input.wobblyNotes.map((n) => `- ${n}`).join('\n') || '- (none named)'}

Return JSON:
{
  "days": [
    {
      "weekday": "mon",
      "date": "${dates[0]}",
      "why": string,
      "world_cluster": "sky"|"earth"|"water"|"motion"|"living"|"places"|"making"|"people"|null,
      "world_taste": string,
      "math_rung_key": string,
      "reading_rung_key": string,
      "mix_next_grade": boolean,
      "story_chapter": string,
      "hook_seed": string,
      "mission_seed": string,
      "artifact_seed": string
    }
  ],
  "materials": {
    "plan_ahead": string[],
    "pantry": string[],
    "tonight": string[]
  }
}
Exactly five days, dates ${dates.join(', ')}. Each hook_seed / mission_seed / artifact_seed must be unique across the week.`
}

function mondayThroughFriday(weekStart: string): string[] {
  const start = new Date(`${weekStart}T00:00:00`)
  return [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(start)
    d.setDate(start.getDate() + offset)
    return d.toISOString().slice(0, 10)
  })
}
