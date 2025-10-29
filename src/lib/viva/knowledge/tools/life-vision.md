# Life Vision System

**Last Updated:** January 31, 2025
**Version:** 2.0
**Status:** Production - Current

## Overview

The Life Vision System helps users create a comprehensive "Life I Choose™" document across 12 life categories. This is the core tool for Active Vision creation.

## Current Features (As of January 2025)

### Creation Flow (`/life-vision/new`)

1. **Landing Page** (`/life-vision/new`)
   - Overview of the 12 categories
   - Introduces VIVA-powered creation
   - Category cards with neon cyan icons

2. **Category Input** (`/life-vision/new/category/[key]`)
   - Text input area (textarea)
   - Audio/Video recording with transcription
   - Auto-save to IndexedDB during recording
   - Saves to S3 when complete
   
3. **AI-Powered Processing**
   - Personalized prompt suggestions based on profile + assessment
   - Three prompt types: Peak Experiences, What Feels Amazing, What Feels Bad/Missing
   - Real-time VIVA processing with progress updates
   - Category summary generation
   - Three action options after summary: Edit, Add to Transcript, Save and Continue

4. **Master Vision Assembly** (`/life-vision/new/assembly`)
   - Combines all 12 category summaries
   - Includes original user transcripts
   - References active vision if one exists
   - Creates versioned vision document

### Viewing & Management (`/life-vision`)

- List all vision versions
- View specific vision details (`/life-vision/[id]`)
- Version tracking
- Completion status

### Refinement (`/life-vision/[id]/refine`)

- Conversational VIVA assistance
- Full vision context awareness
- Cross-category connections
- Maintains 80%+ user voice
- Present-tense positive activation

## The 12 Life Categories

In order:
1. **Fun** - Hobbies, recreation, joyful activities
2. **Health** - Physical and mental well-being
3. **Travel** - Places to explore, adventures
4. **Love** - Romantic relationships
5. **Family** - Family relationships and parenting
6. **Social** - Friends and social connections
7. **Home** - Living space and environment
8. **Work** - Career and work aspirations
9. **Money** - Financial goals and abundance
10. **Stuff** - Material belongings and lifestyle
11. **Giving** - Contribution and legacy
12. **Spirituality** - Spiritual growth and expansion

**Note:** Forward and Conclusion sections are NOT part of the 12 main categories for creation flow.

## Database Schema

### `vision_versions` Table
- `id` (UUID)
- `user_id` (UUID)
- `version_number` (integer)
- `status` ('draft' | 'complete')
- `completion_percent` (integer)
- Individual category fields: `forward`, `fun`, `health`, `travel`, `love`, `family`, `social`, `home`, `work`, `money`, `stuff`, `giving`, `spirituality`, `conclusion`
- `created_at`, `updated_at`

### `refinements` Table
- Stores category-level summaries and transcripts
- `category` field matches category keys
- `transcript` - user's original input
- `ai_summary` - VIVA-generated summary

## Technical Details

### Storage
- Recordings: S3 (`lifeVisionAudioRecordings`, `lifeVisionVideoRecordings`)
- Auto-save: IndexedDB during recording
- Final save: Supabase `refinements` table

### AI Features
- Transcription: OpenAI Whisper
- Summaries: GPT-4o (configurable via `/admin/ai-models`)
- Master Assembly: GPT-4-turbo (configurable)
- Prompt Suggestions: GPT-4o (configurable)

### Caching
- Prompt suggestions cached in `prompt_suggestions_cache` table
- Cache key: `user_id` + `category_key` + `profile_id` + `assessment_id`
- Regenerates if profile/assessment changes

## User Paths

- Start: `/life-vision/new`
- Category pages: `/life-vision/new/category/[key]` (e.g., `/life-vision/new/category/fun`)
- Assembly: `/life-vision/new/assembly`
- View visions: `/life-vision`
- View specific: `/life-vision/[id]`
- Refine: `/life-vision/[id]/refine`

## Integration Points

- **Profile**: Uses profile stories for personalized prompts
- **Assessment**: Uses assessment scores/responses for context
- **Tokens**: Tracks usage for category summaries and master assembly
- **S3**: Stores audio/video recordings

## Common User Questions

**Q: How do I create a Life Vision?**  
A: Go to `/life-vision/new` and follow the guided flow through all 12 categories.

**Q: Can I skip categories?**  
A: No, you'll need input for all 12 categories before assembly, but you can add minimal input and expand later.

**Q: Can I edit after assembly?**  
A: Yes, use the Refine tool at `/life-vision/[id]/refine` to make changes.

**Q: What if I already have a vision?**  
A: Creating a new vision will reference your existing one for voice continuity, but creates a new version.

---

**Keep This Updated:** When features change, update this file immediately!
