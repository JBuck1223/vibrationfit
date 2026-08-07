# Life Explorer — Documentation Model

Wonder Wall data captures the child’s thinking.  
Learning evidence captures what the child made or demonstrated.  
Skill progress tracks academic development.  
Parent observations influence the next lesson.  
Expedition status preserves the overall learning journey.

## Canonical JSON shapes

```json
{
  "student": {
    "id": "oliver",
    "name": "Oliver",
    "grade_level": "1",
    "current_age": 7,
    "interests": [],
    "strengths": [],
    "skills_needing_support": []
  },
  "expedition": {
    "id": "travel-antarctica",
    "life_category": "travel",
    "title": "Antarctica",
    "status": "active",
    "start_date": "2026-08-10",
    "essential_questions": [],
    "core_resources": [],
    "completed_lessons": []
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
  "lesson_record": {
    "lesson_id": "antarctica-03",
    "date": "2026-08-12",
    "title": "How Penguins Stay Warm",
    "status": "completed",
    "activities_completed": [],
    "activities_skipped": [],
    "student_engagement": 5,
    "parent_notes": "",
    "new_questions": [],
    "skills_observed": [],
    "recommended_next_action": ""
  },
  "learning_evidence": [
    {
      "id": "artifact-104",
      "type": "experiment_record",
      "title": "Penguin Blubber Investigation",
      "file_url": "",
      "photo_url": "",
      "student_explanation": "",
      "parent_observation": "",
      "academic_tags": [
        "science-observation",
        "science-prediction",
        "oral-language"
      ]
    }
  ],
  "skill_progress": [
    {
      "skill": "writes a complete sentence",
      "subject": "writing",
      "status": "developing",
      "last_observed": "2026-08-12",
      "evidence_ids": ["artifact-104"],
      "notes": ""
    }
  ]
}
```

## Supabase table mapping

| Concept | Table |
|---------|-------|
| Student | `le_students` |
| Expedition | `le_expeditions` |
| Wonder Wall items | `le_wonder_items` (`kind`: know \| wonder \| learned) |
| Generated lesson | `le_lessons` (full JSON payload + identity columns) |
| Lesson completion | `le_lesson_records` |
| Artifacts | `le_learning_evidence` |
| Skills | `le_skill_progress` |

### Access model

- `created_by` = authenticated parent who created the row
- `household_id` = optional household scope (household members can read/write when set)
- RLS: owner OR active household member on the student’s household

### Generated lesson payload (`le_lessons.payload`)

Must satisfy [LESSON_CONTRACT.md](./LESSON_CONTRACT.md). Stored as JSONB with at least:

- `identity`, `parent_prep`, `objectives`, `teacher_script`, `wonder_wall`, `core_resource`, `hands_on`, `foundational_skills`, `child_output`, `reflection`, `parent_observation`
- `core_activities`, `optional_extensions`, `good_stopping_point`
- `time_summary`: prep_minutes, lesson_minutes, reading_minutes, foundational_minutes, has_experiment, has_journal
