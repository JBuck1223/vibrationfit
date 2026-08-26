import type {
  FunContract,
  HandsOnActivity,
  LessonBlockTime,
  LessonPayload,
  LowBatteryMode,
  ParentAnswerKey,
  SiblingTagAlong,
} from './types'

/**
 * Packs and VIVA drafts have drifted on field names. One reader so the
 * lesson page always gets a teachable script, not an empty checklist.
 */
export function normalizeLessonPayload(raw: unknown): LessonPayload {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const identityIn = asRecord(p.identity) || {}
  const prepIn = asRecord(p.parent_prep) || asRecord(p.parent_prep)
  const scriptIn = asRecord(p.teacher_script) || asRecord(p.teacher_script)
  const funIn = asRecord(p.fun_contract) || asRecord(p.fun_contract)
  const wonderIn = asRecord(p.wonder_wall) || asRecord(p.wonder_wall)
  const skillsIn = asRecord(p.foundational_skills) || asRecord(p.foundational_skills)
  const outputIn = asRecord(p.child_output) || asRecord(p.child_output)
  const lowIn = asRecord(p.low_battery_mode) || asRecord(p.low_battery_mode)
  const keyIn = asRecord(p.parent_answer_key) || asRecord(p.parent_answer_key)
  const timeIn = asRecord(p.time_summary)
  const hands = (p.hands_on ?? p.hands_on) as HandsOnActivity | string | null

  const parent_prep: LessonPayload['parent_prep'] = {
    prep_minutes: num(prepIn?.prep_minutes ?? prepIn?.prep_minutes),
    materials: strs(prepIn?.materials),
    books: strs(prepIn?.books),
    links: (prepIn?.links as LessonPayload['parent_prep']['links']) || [],
    beforehand: strs(prepIn?.beforehand),
    cleanup: str(prepIn?.cleanup) || undefined,
    safety: strs(prepIn?.safety),
  }

  const teacher_script: LessonPayload['teacher_script'] = {
    opening: str(scriptIn?.opening) || str(scriptIn?.opening),
    mystery_or_question: str(scriptIn?.mystery_or_question) || str(scriptIn?.mystery_or_question),
    transitions: strs(scriptIn?.transitions),
    core_concept: str(scriptIn?.core_concept) || str(scriptIn?.core_concept),
    closing: str(scriptIn?.closing),
  }

  const wonder_wall: LessonPayload['wonder_wall'] = {
    know_prompt: str(wonderIn?.know_prompt) || str(wonderIn?.know_prompt),
    wonder_prompts: strs(wonderIn?.wonder_prompts) || strs(wonderIn?.wonder_prompts),
    learned_guidance: str(wonderIn?.learned_guidance) || str(wonderIn?.learned_guidance),
    likely_follow_ups: strs(wonderIn?.likely_follow_ups) || strs(wonderIn?.likely_follow_ups),
  }

  const fun_contract = funFrom(funIn)

  const parent_answer_key = keyIn ? answerKeyFrom(keyIn) : (p.parent_answer_key as ParentAnswerKey | undefined)

  const low_battery_mode = lowIn
    ? ({
        total_minutes: num(lowIn.total_minutes ?? lowIn.total_minutes),
        steps: strs(lowIn.steps),
        log_title: str(lowIn.log_title) || str(lowIn.log_title),
      } satisfies LowBatteryMode)
    : (p.low_battery_mode as LowBatteryMode | undefined)

  const sibling_tag_along = (Array.isArray(p.sibling_tag_along)
    ? p.sibling_tag_along
    : Array.isArray(p.sibling_tag_along)
      ? p.sibling_tag_along
      : []) as SiblingTagAlong[]

  const block_minutes = (Array.isArray(p.block_minutes)
    ? p.block_minutes
    : Array.isArray(p.block_minutes)
      ? p.block_minutes
      : []) as LessonBlockTime[]

  return {
    ...(p as unknown as LessonPayload),
    identity: {
      life_category: str(identityIn.life_category) || str(identityIn.life_category) || undefined,
      expedition: str(identityIn.expedition),
      lesson_title: str(identityIn.lesson_title) || str(identityIn.lesson_title),
      lesson_number: num(identityIn.lesson_number),
      recommended_age_grade:
        str(identityIn.recommended_age_grade) || str(identityIn.recommended_age_grade),
      estimated_total_minutes: num(
        identityIn.estimated_total_minutes ?? identityIn.estimated_total_minutes
      ),
      essential_question: str(identityIn.essential_question) || str(identityIn.essential_question),
      why_this_matters: str(identityIn.why_this_matters) || str(identityIn.why_this_matters) || undefined,
      world_cluster: identityIn.world_cluster as LessonPayload['identity']['world_cluster'],
      world_taste: str(identityIn.world_taste) || str(identityIn.world_taste) || undefined,
    },
    parent_prep,
    teacher_script,
    wonder_wall,
    core_resource: (p.core_resource || p.core_resource) as LessonPayload['core_resource'],
    resource_queue: (p.resource_queue || p.resource_queue || []) as LessonPayload['resource_queue'],
    hands_on: hands ?? null,
    foundational_skills: {
      subject: str(skillsIn?.subject),
      activity: str(skillsIn?.activity),
      materials: strs(skillsIn?.materials),
      notes: str(skillsIn?.notes) || undefined,
    },
    child_output: {
      type: str(outputIn?.type) || str(outputIn?.kind),
      description: str(outputIn?.description),
    },
    core_activities: strs(p.core_activities),
    optional_extensions: strs(p.optional_extensions),
    good_stopping_point: str(p.good_stopping_point),
    reflection: strs(p.reflection),
    parent_observation: strs(p.parent_observation),
    time_summary: {
      prep_minutes: num(timeIn?.prep_minutes ?? parent_prep.prep_minutes),
      lesson_minutes: num(timeIn?.lesson_minutes ?? identityIn.estimated_total_minutes),
      reading_minutes: num(timeIn?.reading_minutes),
      foundational_minutes: num(timeIn?.foundational_minutes),
      has_experiment: Boolean(timeIn?.has_experiment ?? hands),
      has_journal: Boolean(timeIn?.has_journal),
    },
    fun_contract,
    low_battery_mode,
    parent_answer_key,
    sibling_tag_along,
    block_minutes,
    flashback: p.flashback as LessonPayload['flashback'],
    printable: p.printable as LessonPayload['printable'],
    visuals: Array.isArray(p.visuals) ? (p.visuals as LessonPayload['visuals']) : [],
  }
}

function funFrom(funIn: Record<string, unknown> | null): FunContract | undefined {
  if (!funIn) return undefined
  const hook = str(funIn.hook)
  const story_mission = str(funIn.story_mission) || str(funIn.story_mission)
  if (!hook && !story_mission) return undefined
  return {
    hook,
    story_mission,
    embodiment: str(funIn.embodiment),
    artifact: str(funIn.artifact) || str(funIn.artifact),
    choice_point: str(funIn.choice_point) || str(funIn.choice_point),
    celebration_close: str(funIn.celebration_close) || str(funIn.celebration_close),
  }
}

function answerKeyFrom(keyIn: Record<string, unknown>): ParentAnswerKey {
  const rawQs = Array.isArray(keyIn.likely_questions)
    ? keyIn.likely_questions
    : Array.isArray(keyIn.likely_questions)
      ? keyIn.likely_questions
      : []
  return {
    expected_answers: strs(keyIn.expected_answers || keyIn.expected_answers),
    likely_questions: rawQs.map((q) => {
      const row = asRecord(q) || {}
      return {
        question: str(row.question),
        kid_answer: str(row.kid_answer) || str(row.kid_answer),
      }
    }),
    unknown_script: str(keyIn.unknown_script) || str(keyIn.unknown_script),
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function strs(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : []
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}
