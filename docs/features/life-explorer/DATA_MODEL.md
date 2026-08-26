# Life Explorer — Documentation Model

Wonder Wall data captures the child’s thinking.  
Learning evidence captures what the child made or demonstrated.  
Skill progress tracks academic development (`emerging | developing | secure | needs_support`). Skill `subject` values: `reading | math | writing | life_learning` (plus free-form observation subjects).  
Parent observations influence the next lesson.  
Expedition status preserves the overall learning journey.  
Life I Choose is the why — drafted by VIVA from the parent-filled current-state profile, then child-edited. World Map and year/week arcs are what VIVA composes next.

Life Learning resources, the Year Map Big Ideas, the VF Kids compass, and the master skill list are **catalogs in code** (`life-learning.ts`, `year-map.ts`, `vf-kids.ts`, `skill-catalog.ts`) with Florida benchmark codes as metadata. Status lives on `le_skill_progress`. Progress is the checklist — work marks `developing`, the parent can override to `secure` or `needs_support`. Year Map status and evaluation readiness are **derived** from lessons, evidence, activity logs, and those skill rows. There is no second benchmark-progress table.

## Canonical JSON shapes

```json
{
  "student": {
    "id": "oliver",
    "name": "Oliver",
    "grade_level": "1",
    "current_age": 7,
    "life_i_choose": "I am Oliver. I explore…",
    "life_i_choose_audio_url": null,
    "life_i_choose_source": "child_edited",
    "notice_of_intent_date": "2026-08-01",
    "interests": [],
    "strengths": [],
    "skills_needing_support": []
  },
  "expedition": {
    "id": "antarctica",
    "title": "Antarctica",
    "why_this_matters": "You want to be an explorer who asks why the world is the way it is.",
    "status": "active",
    "start_date": "2026-08-10",
    "essential_questions": [],
    "core_resources": [],
    "completed_lessons": []
  },
  "world_map_item": {
    "cluster": "living",
    "name": "Penguins at the ice",
    "taste_looks_like": "Hold ice, watch how feathers and fat keep a body warm.",
    "status": "tasted"
  },
  "year_arc": {
    "school_year": "2026-2027",
    "semester_1_start": "2026-08-01",
    "semester_2_start": "2027-01-01",
    "months": []
  },
  "week_arc": {
    "week_start": "2026-08-17",
    "status": "ready",
    "days": []
  },
  "wonder_wall": {
    "know": [
      {
        "statement": "Penguins live there.",
        "recorded_at": "2026-08-10",
        "original_language": true
      }
    ],
    "wonder": [
      {
        "question": "Why don't penguins freeze?",
        "interest_level": 5,
        "status": "unexplored",
        "source": "student"
      }
    ],
    "learned": [
      {
        "statement": "Penguins have feathers and body fat that help keep them warm.",
        "evidence_id": "artifact-104",
        "recorded_at": "2026-08-12"
      }
    ]
  },
  "skill_progress": [
    {
      "skill": "read-cvc-blending",
      "subject": "reading",
      "status": "developing",
      "last_observed": "2026-08-12",
      "notes": "Clicked in this story; try in a new situation before marking secure."
    }
  ]
}
```

## Supabase table mapping

| Concept | Table |
|---------|-------|
| Student (incl. Life I Choose) | `le_students` (`life_i_choose`, `life_i_choose_audio_url`, `life_i_choose_source`, `notice_of_intent_date`, `grade_level`) |
| Current-state profile (12 categories, parent-filled) | `le_student_profiles` (one `state_<key>` text column per category + `parent_hopes`, unique per student) |
| Expedition | `le_expeditions` (`why_this_matters`; `life_category` kept for legacy, not the calendar) |
| World Map tastes | `le_world_map_items` |
| 9-month arc | `le_year_arcs` |
| Coming week | `le_week_arcs` |
| Wonder Wall items | `le_wonder_items` (`kind`: know \| wonder \| learned) |
| Generated lesson | `le_lessons` (full JSON payload + identity columns) |
| Lesson completion | `le_lesson_records` |
| Artifacts | `le_learning_evidence` |
| Skills | `le_skill_progress` |
| Ladder rungs (math, reading, writing) | Code in `src/lib/life-explorer/ladders.ts` (`grade` + `benchmarks` on each rung) |
| Life Learning resources | Code in `src/lib/life-explorer/life-learning.ts`; progress on `le_skill_progress` (`subject: life_learning`) |
| Year Map Big Ideas | Code in `src/lib/life-explorer/year-map.ts`; status derived (`computeYearMap`) |
| VF Kids compass (12 slices + 3 truths) | Code in `src/lib/life-explorer/vf-kids.ts` |
| Evaluation readiness | Derived in `src/lib/life-explorer/readiness.ts` — no table |

### Access model

- `created_by` = authenticated parent who created the row
- `household_id` = optional household scope (household members can read/write when set)
- RLS: owner OR active household member on the student’s household

### Generated lesson payload (`le_lessons.payload`)

Must satisfy [LESSON_CONTRACT.md](./LESSON_CONTRACT.md). Stored as JSONB with at least:

- `identity` (including `why_this_matters`), `parent_prep`, `objectives`, `teacher_script`, `wonder_wall`, `core_resource`, `hands_on`, `foundational_skills`, `child_output`, `reflection`, `parent_observation`
- `core_activities`, `optional_extensions`, `good_stopping_point`
- `time_summary`: prep_minutes, lesson_minutes, reading_minutes, foundational_minutes, has_experiment, has_journal
