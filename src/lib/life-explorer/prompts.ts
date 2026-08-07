export const LESSON_SYSTEM_PROMPT = `You are Life Explorer, a curiosity-driven homeschool lesson designer for Vibration Fit Homeschool.

HARD RULE: Do not confuse more content with a better lesson. The best lesson is the smallest complete experience that keeps the parent prepared, the child engaged, and the learning documented.

Rules:
- Organize learning through a Life Category + Expedition topic, not isolated school subjects.
- Follow KNOW → WONDER → INVESTIGATE → CREATE → REFLECT → CHOOSE → CONTINUE.
- Structure belongs to the parent; curiosity belongs to the child.
- Never invent a book title, URL, page number, runtime, or review score. If unknown, omit or set needs_parent_link: true.
- Do not force every academic subject into every lesson.
- Never tell the parent they are behind.
- Scripts: natural, warm, concise, non-religious unless asked.
- Distinguish core_activities, optional_extensions, and good_stopping_point.
- Return ONLY valid JSON matching the required schema.`

export const CHECKIN_SYSTEM_PROMPT = `You convert a short parent check-in into structured Life Explorer records.
Return ONLY valid JSON. Preserve the child's language. Do not invent facts.
Hard rule: smallest useful structure — do not over-interpret.`

export function buildLessonUserPrompt(input: {
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
  latestRecordSummary: string | null
  recommendedNextAction: string | null
  lessonNumber: number
}): string {
  return `Generate one complete daily lesson for ${input.studentName}.

Student:
- Grade: ${input.gradeLevel}
- Age: ${input.age ?? 'unknown'}
- Interests: ${input.interests.join('; ') || 'none listed'}
- Strengths: ${input.strengths.join('; ') || 'none listed'}
- Skills needing support: ${input.skillsNeedingSupport.join('; ') || 'none listed'}

Expedition:
- Life Category: ${input.lifeCategory}
- Title: ${input.expeditionTitle}
- Essential questions: ${input.essentialQuestions.join('; ') || 'none yet'}
- Lesson number: ${input.lessonNumber}

Wonder Wall — Know:
${input.know.map((s) => `- ${s}`).join('\n') || '- (empty)'}

Wonder Wall — Wonder (prioritize high interest / unexplored):
${input.wonder.map((w) => `- [${w.status}] (interest ${w.interest_level ?? '?'}) ${w.statement}`).join('\n') || '- (empty)'}

Wonder Wall — Learned:
${input.learned.map((s) => `- ${s}`).join('\n') || '- (empty)'}

Most recent lesson record:
${input.latestRecordSummary || 'None yet — this is the first lesson.'}

Recommended next action from last check-in:
${input.recommendedNextAction || 'Start the expedition with an engaging opening lesson.'}

If this is Antarctica / Travel, prefer known pack resources when relevant:
- Books: Sophie Scott Goes South; Where Is Antarctica?
- PDFs under /homeschool/life-explorer/antarctica/ (Parent Guide, Week 1 Teacher Guide, Blubber Experiment, Student Journals, Printables)
- Verified links only: https://www.pbs.org/video/penguins-meet-the-family-bzdmpa/ and the PBS LearningMedia animal insulation PDF from the experiment guide
- For any other video/podcast, set needs_parent_link: true — never invent a URL

Return JSON with this exact top-level shape:
{
  "identity": {
    "life_category": string,
    "expedition": string,
    "lesson_title": string,
    "lesson_number": number,
    "recommended_age_grade": string,
    "estimated_total_minutes": number,
    "essential_question": string
  },
  "parent_prep": {
    "prep_minutes": number,
    "materials": string[],
    "books": string[],
    "links": [{ "title": string, "url": string|null, "resource_type": string, "runtime": string|null, "why_selected": string, "question_it_answers": string, "needs_parent_link": boolean }],
    "beforehand": string[],
    "cleanup": string,
    "safety": string[]
  },
  "objectives": [{ "area": string, "objective": string }],
  "teacher_script": {
    "opening": string,
    "mystery_or_question": string,
    "transitions": string[],
    "core_concept": string,
    "closing": string
  },
  "wonder_wall": {
    "know_prompt": string,
    "wonder_prompts": string[],
    "learned_guidance": string,
    "likely_follow_ups": string[]
  },
  "core_resource": {
    "title": string,
    "url": string|null,
    "resource_type": string,
    "runtime": string|null,
    "why_selected": string,
    "question_it_answers": string,
    "needs_parent_link": boolean
  },
  "hands_on": object|null,
  "foundational_skills": {
    "subject": string,
    "activity": string,
    "materials": string[],
    "notes": string
  },
  "child_output": { "type": string, "description": string },
  "reflection": string[],
  "parent_observation": string[],
  "core_activities": string[],
  "optional_extensions": string[],
  "good_stopping_point": string,
  "time_summary": {
    "prep_minutes": number,
    "lesson_minutes": number,
    "reading_minutes": number,
    "foundational_minutes": number,
    "has_experiment": boolean,
    "has_journal": boolean
  }
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
}): string {
  return `Structure this parent check-in for ${input.studentName} after lesson "${input.lessonTitle}".

Answers:
1. Enjoyed most: ${input.enjoyedMost || '(blank)'}
2. Created / said / demonstrated: ${input.createdSaidDemonstrated || '(blank)'}
3. Too easy or difficult: ${input.easyOrDifficult || '(blank)'}
4. New question: ${input.newQuestion || '(blank)'}
5. Direction: ${input.direction || 'continue'}
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
