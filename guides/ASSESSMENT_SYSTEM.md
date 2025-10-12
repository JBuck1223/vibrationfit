# VibrationFit Assessment System 🎯

## Overview

The VibrationFit Vibrational Assessment is a comprehensive 84-question tool that measures users' "Green Line status" across 12 life categories. It provides deep insights into where users are thriving and where they have growth opportunities, helping VIVA generate personalized life visions.

## Quick Start

### For Users

1. Navigate to `/assessment` or click "Take Assessment" on the dashboard
2. Answer 7 questions for each of the 12 life categories (84 total)
3. Get your Green Line status: Above, Transition, or Below
4. Use results to generate your personalized Life Vision with VIVA

### For Developers

**Start Docker:**
```bash
# Make sure Docker Desktop is running
npx supabase start
```

**Apply Migration:**
```bash
npx supabase db reset
# or
npx supabase db push
```

**Test the System:**
```bash
npm run dev
# Navigate to http://localhost:3000/assessment
```

## Architecture

### Database Schema

#### Tables
1. **`assessment_results`** - Main assessment records
   - Stores overall scores and Green Line statuses
   - Links to user and optional profile version
   - Auto-calculates from responses via triggers

2. **`assessment_responses`** - Individual question answers
   - Each response: 2, 4, 6, 8, or 10 points
   - Classified as: above, neutral, or below Green Line
   - Unique constraint per assessment + question

3. **`assessment_insights`** - VIVA-generated insights
   - AI-powered pattern detection
   - Confidence scoring
   - Category-specific recommendations

#### Enums
- `assessment_status`: `not_started`, `in_progress`, `completed`
- `green_line_status`: `above`, `transition`, `below`
- `assessment_category`: 12 life categories matching vision system

### API Routes

#### `/api/assessment`
- `GET` - Fetch user's assessments (all or specific by ID)
- `POST` - Create new assessment
- `PATCH` - Update assessment status/notes
- `DELETE` - Delete assessment and all data

#### `/api/assessment/responses`
- `GET` - Fetch responses for an assessment
- `POST` - Save/update a response (triggers auto-scoring)
- `DELETE` - Delete a response

#### `/api/assessment/progress`
- `GET` - Calculate real-time progress with conditional logic

### Components

#### QuestionCard (`/src/app/assessment/components/QuestionCard.tsx`)
Displays individual questions with:
- 5 multiple-choice options
- Color-coded Green Line indicators
- Smooth selection animations
- Point values and emoji support

#### ProgressTracker (`/src/app/assessment/components/ProgressTracker.tsx`)
Shows:
- Overall completion percentage
- Per-category progress
- Visual indicators for current category
- Motivational tip

#### ResultsSummary (`/src/app/assessment/components/ResultsSummary.tsx`)
Results page with:
- Overall score and stats
- Strongest areas (top 3)
- Growth opportunities (bottom 3)
- CTA to generate Life Vision with VIVA

### Service Layer (`/src/lib/services/assessmentService.ts`)

Client-side service for all assessment operations:
- CRUD operations
- Response management
- Progress tracking
- Helper functions (completion %, Green Line colors, etc.)

## Scoring System

### Per Question
- 5 options per question
- Values: **2, 4, 6, 8, 10**
- Mapped to Green Line: `below`, `neutral`, `above`

### Per Category
- 7 questions × 10 max points = **70 max per category**
- Green Line thresholds:
  - **Above:** 80%+ (56-70 points)
  - **Transition:** 60-79% (42-55 points)
  - **Below:** <60% (14-41 points)

### Overall Assessment
- 12 categories × 70 max = **840 total points**
- Percentage = `(total_score / 840) × 100`

## The 12 Life Categories

Matching the Life Vision system:

1. 💰 **Money / Wealth** - Financial goals and wealth
2. 💪 **Health / Vitality** - Physical and mental well-being
3. 👨‍👩‍👧‍👦 **Family / Parenting** - Family relationships and life
4. ❤️ **Love / Romance** - Romantic relationships
5. 👥 **Social / Friends** - Social connections and friendships
6. 💼 **Business / Career** - Work and career aspirations
7. 🎉 **Fun / Recreation** - Hobbies and joyful activities
8. ✈️ **Travel / Adventure** - Places to explore and adventures
9. 🏠 **Home / Environment** - Living space and environment
10. 📦 **Possessions / Stuff** - Material belongings and things
11. 🎁 **Giving / Legacy** - Contribution and legacy
12. ✨ **Spirituality** - Spiritual growth and expansion

## Question Design Philosophy

Questions are designed to reveal **unconscious beliefs** through:
- **Gut reactions** - "What's your first thought?"
- **Body sensations** - "What happens in your body?"
- **Honest feelings** - Not where they want to be, but where they are NOW

Example Question (Money):
> *"You open your banking app. What happens in your body?"*
> - 🟢 I feel calm, curious to see the balance (10 pts - Above)
> - 🟢 Neutral, just checking numbers (8 pts - Above)
> - ⚪ I hesitate for a second before opening it (6 pts - Neutral)
> - 🔴 My stomach tightens (4 pts - Below)
> - 🔴 I avoid it entirely unless I absolutely have to (2 pts - Below)

## Conditional Logic

Some questions only show if certain profile conditions are met:

```typescript
{
  id: 'family_7',
  text: 'You imagine introducing a new partner to your family...',
  conditionalLogic: {
    field: 'relationship_status',
    condition: (value) => value === 'single' || !value
  }
}
```

## Auto-Scoring System

### Database Triggers
When a response is saved/updated/deleted:

1. **Trigger fires:** `update_scores_on_response_change`
2. **Recalculates:**
   - All category scores
   - Green Line status per category
   - Total score
   - Overall percentage
3. **Updates:** `assessment_results` table automatically

No manual score calculation needed! 🎉

## Integration Points

### With Profile System
- Optional `profile_version_id` links assessment to profile
- Conditional questions based on profile data
- Profile completion gates assessment access (50%+ recommended)

### With VIVA (Future)
- Assessment data → Vision generation input
- Green Line status → Personalized recommendations
- Pattern detection → Targeted insights
- Growth areas → Focus suggestions

### With Dashboard
- Shows "Take Assessment" CTA if not taken
- Displays latest assessment status
- Links to Life Vision creation flow

## UI/UX Features

### Design System Integration
- Uses VibrationFit design tokens
- Green Line colors: `#199D67` (above), `#FFB701` (neutral), `#D03739` (below)
- Smooth animations and transitions
- Mobile-responsive layout

### User Flow
1. **Start** - Create assessment, show first category
2. **Answer** - Show one question at a time
3. **Navigate** - Previous/Next buttons, auto-advance on selection
4. **Progress** - Sidebar tracks completion per category
5. **Complete** - Show results summary with insights
6. **Action** - Generate Life Vision or view detailed results

### Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- High contrast color schemes
- Focus states on all interactive elements

## Testing

### Manual Testing
1. Navigate to `/assessment`
2. Complete at least one category (7 questions)
3. Check progress updates in sidebar
4. Complete all 84 questions
5. Verify results summary shows correct stats
6. Test "Generate Life Vision" flow

### API Testing
```bash
# Create assessment
curl -X POST http://localhost:3000/api/assessment \
  -H "Content-Type: application/json" \
  -d '{"assessment_version": 1}'

# Save response
curl -X POST http://localhost:3000/api/assessment/responses \
  -H "Content-Type: application/json" \
  -d '{
    "assessment_id": "xxx",
    "question_id": "money_1",
    "question_text": "You open your banking app...",
    "category": "money",
    "response_value": 10,
    "response_text": "I feel calm, curious to see the balance",
    "green_line": "above"
  }'

# Get progress
curl http://localhost:3000/api/assessment/progress?assessmentId=xxx
```

## Future Enhancements

### Phase 1 (Current)
- ✅ Database schema
- ✅ API routes
- ✅ UI components
- ✅ Auto-scoring
- ✅ Dashboard integration

### Phase 2 (Next)
- [ ] VIVA insight generation
- [ ] Category-specific recommendations
- [ ] Historical tracking (retake assessments)
- [ ] Comparison reports (track progress over time)
- [ ] Email summary of results

### Phase 3 (Future)
- [ ] Advanced analytics dashboard
- [ ] Export to PDF
- [ ] Share results (private link)
- [ ] Assessment reminders (quarterly)
- [ ] Gamification (badges, streaks)

## File Structure

```
├── supabase/migrations/
│   └── 20250111000000_create_assessment_tables.sql  # Database schema
│
├── src/
│   ├── types/
│   │   └── assessment.ts  # TypeScript interfaces
│   │
│   ├── lib/
│   │   ├── assessment/
│   │   │   └── questions.ts  # 84 questions + helpers
│   │   └── services/
│   │       └── assessmentService.ts  # Client service
│   │
│   └── app/
│       ├── api/assessment/
│       │   ├── route.ts  # Main CRUD
│       │   ├── responses/route.ts  # Response management
│       │   └── progress/route.ts  # Progress tracking
│       │
│       └── assessment/
│           ├── page.tsx  # Main assessment flow
│           └── components/
│               ├── QuestionCard.tsx
│               ├── ProgressTracker.tsx
│               └── ResultsSummary.tsx
```

## Brand Alignment

### Terminology
- ✅ "Above the Green Line" (not "high score")
- ✅ "Vibrational Assessment" (not "quiz" or "test")
- ✅ "VIVA" (not "AI" or "assistant")
- ✅ "Life Vision" (not "goals" or "plan")

### Colors
- **Primary Green** `#199D67` - Above, alignment, growth
- **Energy Yellow** `#FFB701` - Transition, neutral, awareness
- **Contrast Red** `#D03739` - Below, growth opportunity (not failure!)

### Voice
- Curious, not judgmental
- Growth-focused, not deficit-focused
- Empowering, not prescriptive
- "Where are you NOW?" not "Where should you be?"

## Support

**Issues?**
- Check database migration applied: `npx supabase db push`
- Verify Docker is running
- Check browser console for errors
- Review API responses in Network tab

**Questions?**
- See: `/supabase/migrations/README_ASSESSMENT.md`
- See: `/src/lib/assessment/questions.ts` (helper functions)
- See: Type definitions in `/src/types/assessment.ts`

---

**Built with 💚 for VibrationFit - Where conscious creation meets aligned action.**

