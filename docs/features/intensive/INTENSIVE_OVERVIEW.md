# 72-Hour Activation Intensive

**Last Updated:** February 9, 2026  
**Status:** Active / In Development

---

## Overview

The **72-Hour Activation Intensive** is VibrationFit's flagship onboarding program. It's a guided, time-boxed experience that takes users through 14 sequential steps to establish their complete conscious creation system: Life Vision, Audio Suite, Vision Board, Journal practice, and daily activation protocol.

### Key Characteristics

- **Duration:** 72 hours (timer starts when user begins Step 0)
- **Steps:** 14 sequential steps across 6 phases
- **Gate-Locked:** Each step unlocks only after the previous step is completed
- **Outcome:** Upon completion, users unlock full platform access including Advanced Audio Suite, Alignment Gym, and Vibe Tribe

---

## The 14-Step Flow

### Phase 1: Setup (Steps 1-2)

| Step | Name | Description | Checklist Field | Completion Criteria |
|------|------|-------------|-----------------|---------------------|
| 0 | Start Intensive | User clicks "Start" button | `started_at` | Timer begins |
| 1 | Account Settings | Name, email, phone, profile picture | `user_accounts` table | First name, last name, phone filled |
| 2 | Baseline Intake | Pre-intensive questionnaire | `intake_completed` | 11 rating + 2 text questions answered |

### Phase 2: Foundation (Steps 3-4)

| Step | Name | Description | Checklist Field | Completion Criteria |
|------|------|-------------|-----------------|---------------------|
| 3 | Create Profile | Comprehensive life profile | `profile_completed` | Profile saved with demographics, lifestyle, clarity/contrast statements |
| 4 | Vibration Assessment | 12-category assessment | `assessment_completed` | All 84 questions answered (7 per category) |

### Phase 3: Vision Creation (Steps 5-6)

| Step | Name | Description | Checklist Field | Completion Criteria |
|------|------|-------------|-----------------|---------------------|
| 5 | Build Vision | Create Life Vision across 12 categories | `vision_built` | Forward + 12 categories + Conclusion written |
| 6 | Refine Vision | Enhance with VIVA | `vision_refined` | Vision refined with AI assistance |

### Phase 4: Audio (Steps 7-9)

| Step | Name | Description | Checklist Field | Completion Criteria |
|------|------|-------------|-----------------|---------------------|
| 7 | Generate Audio | AI-generated voice narration | `audio_generated` | Audio tracks generated for all sections |
| 8 | Record Voice | User voice recording (Optional) | `audio_generated` (shared) | User records own voice OR skips |
| 9 | Audio Mix | Add music and frequencies | `audios_generated` | Mixed audio tracks created |

### Phase 5: Activation (Steps 10-12)

| Step | Name | Description | Checklist Field | Completion Criteria |
|------|------|-------------|-----------------|---------------------|
| 10 | Vision Board | Visual board with images | `vision_board_completed` | At least one image per life category (12 total) |
| 11 | Journal Entry | First conscious creation journal | `first_journal_entry` | One journal entry created |
| 12 | Book Call | Schedule calibration session | `call_scheduled` | Calendar booking completed |

### Phase 6: Completion (Steps 13-14)

| Step | Name | Description | Checklist Field | Completion Criteria |
|------|------|-------------|-----------------|---------------------|
| 13 | My Activation Plan (MAP) | 28-day daily activation protocol | `activation_protocol_completed` | User reviews and commits to protocol |
| 14 | Platform Unlock | Post-intensive survey + unlock | `unlock_completed` | Survey completed, platform unlocked |

---

## Database Schema

### Core Tables

#### `order_items` (Intensive Purchase)
- Tracks purchase/enrollment
- `payment_plan`: 'full', '2pay', '3pay'
- `activation_deadline`: 72 hours from start
- `started_at`: When user began
- `completion_status`: 'pending' | 'in_progress' | 'completed'

#### `intensive_checklist`
- **Primary tracking table** for step completion
- One row per user per intensive
- Boolean flags + timestamps for each step
- Fields: `started_at`, `intake_completed`, `profile_completed`, `assessment_completed`, `vision_built`, `vision_refined`, `audio_generated`, `audios_generated`, `vision_board_completed`, `first_journal_entry`, `call_scheduled`, `activation_protocol_completed`, `unlock_completed`
- Status: 'pending' | 'in_progress' | 'completed'

#### `intensive_responses`
Unified table for intake/survey data across three phases:

1. **`pre_intensive`** - Initial baseline intake (Step 2)
2. **`post_intensive`** - Unlock survey (Step 14)
3. **`calibration_session`** - Call recording data

**Key Fields:**
- Rating questions (0-10): vision_clarity, vibrational_harmony, vibrational_constraints_clarity, vision_iteration_ease, audio_iteration_ease, vision_board_management, journey_capturing, roadmap_clarity, transformation_tracking
- Multiple choice: has_audio_tracks, has_vision_board, sharing_preference
- Text: previous_attempts, biggest_shift
- Video testimonial data
- Calibration call recordings, transcripts, segments, soundbites
- Metrics comparison (before/after)

### Related Tables

- `user_accounts` - Step 1 completion check
- `user_profiles` - Step 3 data
- `assessment_results` + `assessment_responses` - Step 4 data
- `vision_versions` - Steps 5-6 data
- `audio_sets` + `audio_tracks` - Steps 7-9 data
- `vision_board_items` - Step 10 data
- `journal_entries` - Step 11 data

---

## Intake Questions

**Source of Truth:** `src/lib/constants/intensive-intake-questions.ts`

### Rating Questions (0-10 scale, both pre and post)

1. **Vision Clarity** - How clear is your vision for your life?
2. **Vibrational Harmony** - How often do you feel "in vibrational harmony"?
3. **Vibrational Constraints Clarity** - How clear are you on your vibrational constraints?
4. **Vision Iteration Ease** - How easy is it to create new iterations of your life vision?
5. **Audio Tracks Status** - Do you have audio tracks? (yes/no)
6. **Audio Iteration Ease** - How easy is it to create new audio iterations?
7. **Vision Board Status** - Do you have a vision board? (no/physical/digital/both)
8. **Vision Board Management** - How easy is it to view and manage your vision board?
9. **Journey Capturing** - How well are you capturing your conscious creation journey?
10. **Roadmap Clarity** - How clear is your roadmap for activating your vision?
11. **Transformation Tracking** - How well set up to track major life transformations?

### Text Questions

- **Pre-only (Q12):** What have you already tried to consciously create your dream life?
- **Post-only (Q12):** What feels most different after completing the intensive?
- **Post-only (Q13):** Sharing preference (named/anonymous/none)

---

## User Routes

### User-Facing Pages

| Route | Purpose |
|-------|---------|
| `/intensive/start` | Start button and timer initiation |
| `/intensive/dashboard` | Main checklist view with progress |
| `/intensive/intake` | Pre-intensive survey (Step 2) |
| `/intensive/intake/unlock` | Post-intensive survey (Step 14) |
| `/intensive/schedule-call` | Calendly booking (Step 12) |
| `/intensive/call-prep` | Call preparation after booking |
| `/intensive/calibration` | Calibration call interface |
| `/intensive/welcome` | Welcome/intro screen |
| `/intensive/builder` | Vision building interface |
| `/intensive/refine-vision` | Vision refinement with VIVA |
| `/activation-protocol` | 28-day MAP page (Step 13) |

### Admin Pages

| Route | Purpose |
|-------|---------|
| `/admin/intensive/tester` | Test user management, advance steps with sample data |
| `/admin/intensive/schedule-call` | Admin call scheduling interface |

---

## API Routes

### Admin APIs (`/api/admin/intensive/`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/create-test-user` | GET | List intensive users |
| `/create-test-user` | POST | Create new test user and enroll in intensive |
| `/enroll` | POST | Enroll existing user in intensive |
| `/find-user` | GET | Find user by email |
| `/reset-user` | POST | Reset user's intensive data |
| `/advance-step` | GET | Get user's current progress |
| `/advance-step` | POST | Advance user through a step with sample data |
| `/appointments` | Various | Manage calibration call appointments |

---

## My Activation Plan (MAP) - 28-Day Protocol

After completing the intensive, users follow the **My Activation Plan (MAP)** - a 28-day daily ritual:

### Daily Ritual (10-20 minutes)

**Step 1: Morning Vision + Daily Paper**
- Read/listen to Life Vision Focus
- Review Vision Board
- Complete Daily Paper
- Optional: Journal one intention

**Step 2: Real-Time Category Activation**
- Before key moments (work, health, family, etc.)
- Listen to relevant Category Audio (1-3 min)
- Make one micro-decision from that aligned place

**Step 3: Night Sleep Immersion + Evidence Journal**
- Read/listen to Life Vision Focus
- Journal: What matched? What synchronicities?
- Update Vision Board (mark complete, add stories)
- Play Sleep Immersion track while falling asleep

### Weekly Ritual
- Attend Alignment Gym (live or replay)
- Share to Vibe Tribe (optional)

### 28-Day Milestones
- Day 3: "You've started"
- Day 7: "Consistency is now part of your story"
- Day 14: "Building a new normal"
- Day 21: "Old patterns losing grip"
- Day 28: "Proof: you are a conscious creator in action"

---

## Admin Testing Tools

### Intensive Tester (`/admin/intensive/tester`)

**Features:**
- View all enrolled intensive users
- Create new test users (sends magic link)
- Find and enroll existing users
- View step-by-step progress
- Advance steps with sample data
- Reset user data completely
- Re-enroll orphaned users

**Step Advancement:**
Each step creates appropriate sample data:
- Step 2: Creates intake responses
- Step 3: Creates full profile with demographics
- Step 4: Creates assessment with 84 sample responses
- Step 5: Creates vision with all 14 sections
- Step 6: Marks vision as refined
- Step 7: Creates audio set + tracks
- Step 9: Marks audio as mixed
- Step 10: Creates 12 vision board items
- Step 11: Creates 3 journal entries (text, voice, video)
- Step 12: Marks call scheduled
- Step 13: Marks activation protocol complete
- Step 14: Marks unlock complete, sets status to 'completed'

---

## Completion Flow

1. User completes Step 14 (Unlock survey)
2. `intensive_checklist.status` set to 'completed'
3. `intensive_checklist.completed_at` timestamp recorded
4. `order_items.completion_status` set to 'completed'
5. Completion screen displayed with celebration
6. User redirected to main dashboard with full platform access

### Post-Completion Access

Users who complete the intensive unlock:
- Advanced Audio Suite
- Alignment Gym (weekly calls)
- Vibe Tribe (community)
- Full Dashboard
- Vision management tools
- All platform features

---

## Technical Notes

### Timer Logic
- Timer based on `intensive_checklist.started_at`
- 72 hours = 259,200,000 milliseconds
- Displayed as `XXh XXm XXs`
- Timer expiration doesn't block progress (soft deadline)

### Step Locking
- Steps unlock sequentially
- Each step checks previous step's completion boolean
- Step 8 (Record Voice) is optional but shares completion with Step 7

### RLS Policies
- Users can only access their own intensive data
- Admins can view/update all intensive data
- Service role key used for admin operations

---

## Current Development Status

### Completed
- 14-step flow implementation
- Dashboard with progress tracking
- All step pages functional
- Admin tester tool
- Intake/unlock surveys
- Timer system

### In Progress
- Calibration call recording integration
- Video testimonial capture
- Soundbite extraction for marketing

### Future Considerations
- Analytics dashboard for completion rates
- Email reminders for stalled users
- A/B testing different step orders
