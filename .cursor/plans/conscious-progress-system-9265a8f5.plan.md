---
name: Conscious Progress System - Implementation Plan
overview: ""
todos:
  - id: 026ef338-d4c0-4619-8c77-02800cf8e66a
    content: Create database migration with all 7 tables (events, streaks, milestones, mastery, snapshots, rituals, ripples)
    status: pending
  - id: d5e12e7d-1885-48cd-9528-493ab53ad9b4
    content: Build core tracking services (tracker.ts, milestones.ts, streaks.ts, mastery.ts, celebrations.ts)
    status: pending
  - id: f89b6429-78b1-4222-b98f-c331a0e56932
    content: Implement all API routes for progress system endpoints
    status: pending
  - id: 3a17465e-9f08-45f3-a1d8-5d921347a017
    content: Create ProgressDashboard widget and integrate into main dashboard
    status: pending
  - id: ec5a55e6-3cbe-4ad7-b9a6-fa5096c16d7d
    content: Build StreakIndicator component and add to navigation
    status: pending
  - id: 58867d5a-4cdf-4525-8acd-e72d6844151c
    content: Create CategoryMasteryCard components and grid layout
    status: pending
  - id: ce2861fd-8013-484f-9ec4-a1c969bef32f
    content: Build MilestoneCelebration modal with neon animations
    status: pending
  - id: f8150f31-dcad-49bc-a8c5-43c2f1f22752
    content: Add new animations (bounceNeon, scaleGlow, confettiNeon) to globals.css
    status: pending
  - id: 92be2a2c-9b99-4e13-9f07-fcd82975d450
    content: Implement auto-trigger system for milestone celebrations
    status: pending
  - id: d2182305-b76f-4925-a53b-8694e5443dd4
    content: Create TransformationTimeline component with chart visualization
    status: pending
  - id: ba00cf4b-f749-4fc6-8878-d853b2aacb7d
    content: Build RitualTracker UI and integrate with vision/journal features
    status: pending
  - id: 3b9cd262-f23a-499c-a4ff-50498801dde1
    content: Create category mastery detail pages and progress dashboard page
    status: pending
  - id: e8135c37-ce42-4802-ad85-7ecdb516413e
    content: Build CommunityRipples feed component (optional feature)
    status: pending
  - id: 6765973e-67c4-4af5-ad31-5e36a732e439
    content: Implement anonymous sharing system with moderation
    status: pending
  - id: c7602b7a-672c-4f31-906b-7d1fd87b245a
    content: Integrate progress tracking into all existing features (vision, journal, assessment, VIVA, intensive)
    status: pending
  - id: 3d155f7b-2806-4dcd-bd07-7e19f5fdffc5
    content: Mobile responsiveness audit and fixes for all progress components
    status: pending
  - id: 4b89c47e-0d78-43d1-8d49-3a847f206f29
    content: Write comprehensive documentation in docs/conscious-progress/
    status: pending
---

# Conscious Progress System - Implementation Plan

## Philosophy

Replace traditional gamification (points, badges, leaderboards) with a spiritually-aligned system that celebrates:

- Evidence of transformation
- Consistent vibrational alignment
- Meaningful milestones on the conscious creation journey

Core principle: Progress tracking that feels like personal growth, not game mechanics.

## System Architecture

### Three Integrated Tracking Systems

**1. Evidence of Actualization**

Track proof of transformation through user actions that demonstrate growth and alignment.

**2. Vibrational Momentum**

Measure consistency of daily practices and rituals that maintain alignment "Above the Green Line."

**3. Conscious Creation Milestones**

Celebrate key stages in the user's journey from awareness to actualization.

## Database Schema

### New Tables

**`conscious_progress_events`** - Core tracking table

```sql
CREATE TABLE conscious_progress_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_type TEXT NOT NULL, -- 'evidence', 'momentum', 'milestone', 'ritual', 'mastery', 'transformation'
  category TEXT, -- Life category or 'all'
  metadata JSONB DEFAULT '{}',
  vibration_score INTEGER, -- 1-10 scale
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`vibrational_streaks`** - Daily/weekly consistency tracking

```sql
CREATE TABLE vibrational_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  streak_type TEXT NOT NULL, -- 'daily_alignment', 'journal', 'vision_audio', 'viva_chat'
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_data JSONB DEFAULT '{}', -- Detailed tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`conscious_milestones`** - Journey stage celebrations

```sql
CREATE TABLE conscious_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  milestone_key TEXT NOT NULL, -- 'first_vision', 'vision_refined', '30_day_alignment'
  milestone_category TEXT, -- 'creation', 'alignment', 'transformation', 'mastery'
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  celebration_viewed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'
);
```

**`category_mastery`** - Depth tracking per life area

```sql
CREATE TABLE category_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  category TEXT NOT NULL, -- 12 life categories
  mastery_level INTEGER DEFAULT 0, -- 0-100 scale
  evidence_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  milestones_achieved TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);
```

**`transformation_snapshots`** - Before/after tracking

```sql
CREATE TABLE transformation_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  snapshot_type TEXT NOT NULL, -- 'assessment', 'category_state', 'overall'
  category TEXT,
  before_score INTEGER,
  after_score INTEGER,
  before_data JSONB,
  after_data JSONB,
  transformation_percentage INTEGER,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`ritual_completions`** - Daily practice tracking

```sql
CREATE TABLE ritual_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  ritual_type TEXT NOT NULL, -- 'morning_vision', 'evening_reflection', 'daily_journal'
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  completion_data JSONB DEFAULT '{}'
);
```

**`community_ripples`** - Anonymous inspiration sharing (optional)

```sql
CREATE TABLE community_ripples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  ripple_type TEXT NOT NULL, -- 'win', 'insight', 'transformation'
  category TEXT,
  anonymous_content TEXT NOT NULL,
  visibility TEXT DEFAULT 'private', -- 'private', 'community'
  inspiration_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Milestone Definitions

### Creation Milestones

- `profile_complete` - Profile 70%+ complete
- `first_assessment` - Completed first Vibration Assessment
- `first_vision` - First life vision created
- `vision_refined` - Used refinement tools
- `audio_generated` - Generated vision audio
- `vision_board_started` - Created first vision board item
- `all_categories_complete` - All 12 categories filled

### Alignment Milestones

- `first_journal_entry` - First journal entry
- `7_day_streak` - 7 consecutive days of activity
- `30_day_alignment` - 30 days of consistent practice
- `100_journal_entries` - Century club
- `vision_audio_50_plays` - Deep immersion

### Transformation Milestones

- `assessment_improved` - Score increased by 20%+
- `above_green_line` - All categories above 70%
- `category_mastery_achieved` - Mastered one life area
- `intensive_complete` - Finished 72-hour intensive
- `one_year_journey` - Anniversary milestone

## UI Components

### 1. Progress Dashboard Widget

Located in main dashboard, shows:

- Current longest streak (neon green badge)
- Recent milestones (3 most recent)
- Category mastery progress (circular chart)
- "Your Transformation" score

Design: Card with gradient border, neon accents, mobile-responsive

### 2. Milestone Celebration Modal

Triggered on achievement:

- Full-screen overlay with neon glow animation
- Milestone icon (custom per type)
- Celebration message in brand voice
- "Continue Your Journey" CTA
- Optional: Share anonymously toggle

Design: Black background, neon gradient text, fadeIn + scale animation

### 3. Streak Indicator

Small, persistent UI element:

- Flame/energy icon with number
- Pulsing neon glow on active streak
- Danger state (red) when streak at risk
- Tap to see streak details

Location: Top navigation or dashboard header

### 4. Category Mastery Cards

Per life category visualization:

- Circular progress ring (0-100%)
- Evidence count
- Recent activity timestamp
- "Deepen Mastery" CTA

Design: Grid layout, hover lift effect, neon borders

### 5. Transformation Timeline

Visual journey map:

- Vertical timeline (mobile) / horizontal (desktop)
- Assessment scores plotted over time
- Key milestones marked
- Growth trajectory visualization

Design: Line chart with neon gradients, responsive

### 6. Community Ripples Feed (Optional)

Anonymous inspiration wall:

- Card-based feed of wins/insights
- "Send ripple" floating action button
- Filter by category
- "Inspired me" heart counter

Design: Masonry grid, soft neon accents

## API Routes

### Core Endpoints

**`/api/progress/events`**

- POST - Record new progress event
- GET - Fetch user progress history

**`/api/progress/streaks`**

- GET - Fetch all streaks for user
- POST - Update streak (auto-triggered)

**`/api/progress/milestones`**

- GET - Fetch achieved milestones
- POST - Award milestone
- PATCH - Mark celebration viewed

**`/api/progress/mastery`**

- GET - Fetch category mastery data
- POST - Update mastery level

**`/api/progress/transformation`**

- GET - Fetch transformation snapshots
- POST - Create comparison snapshot

**`/api/progress/rituals`**

- POST - Mark ritual complete
- GET - Fetch ritual completion history

**`/api/progress/ripples`** (optional)

- GET - Fetch community ripples feed
- POST - Create new ripple
- PATCH - Increment inspiration count

## Integration Points

### Existing Features That Trigger Progress Events

**Vision System:**

- Vision created → `first_vision` milestone
- Category completed → Evidence event, category mastery +10
- Vision refined → `vision_refined` milestone
- Audio generated → `audio_generated` milestone

**Journal System:**

- Entry created → Evidence event, update streak
- 7/30/100 entries → Milestone achievements

**Assessment System:**

- First completion → `first_assessment` milestone
- Score improvement → Transformation snapshot, milestone if 20%+ gain

**VIVA Chat:**

- Daily interaction → Momentum event, streak update
- Deep conversation (20+ messages) → Evidence event

**Vision Boards:**

- First item → `vision_board_started` milestone
- All categories filled → Category mastery boost

**Intensive Program:**

- Checklist completion → Multiple milestones, transformation snapshot

**Audio Playback:**

- Daily listening → Ritual completion
- 50 plays → `vision_audio_50_plays` milestone

## Celebration Animations

### Animation Library (Using existing patterns)

**fadeIn** - Already exists, use for milestone cards

**pulseSubtle** - Already exists, use for active streaks

**bounceNeon** - New: Bounce with neon glow effect

**scaleGlow** - New: Scale up with expanding neon ring

**confettiNeon** - New: Neon particles falling (major milestones)

### Celebration Timing

- Immediate modal for major milestones
- Toast notification for minor progress
- Dashboard widget update (no interruption) for daily events

## Color Semantics (From Design Tokens)

- **Electric Green (#39FF14)** - Evidence of actualization, "Above Green Line"
- **Neon Cyan (#00FFFF)** - Clarity moments, information, consistency
- **Neon Purple (#BF00FF)** - Transformation, mastery, premium achievements
- **Neon Yellow (#FFFF00)** - Celebrations, wins, streak milestones
- **Electric Red (#FF0040)** - Streak at risk, contrast moments

## Implementation Phases

### Phase 1: Foundation (Database + Core Logic)

- Create all database tables with migrations
- Build tracking service (`src/lib/progress/tracker.ts`)
- Create milestone definitions (`src/lib/progress/milestones.ts`)
- Implement API routes

### Phase 2: Dashboard Integration

- Progress Dashboard Widget component
- Streak Indicator component
- Category Mastery Cards component
- Integrate into existing dashboard

### Phase 3: Celebrations

- Milestone Celebration Modal component
- Animation library additions
- Toast notifications for progress
- Auto-trigger system from events

### Phase 4: Deep Features

- Transformation Timeline component
- Category mastery detail pages
- Ritual tracking UI
- Progress analytics

### Phase 5: Community (Optional)

- Community Ripples feed
- Anonymous sharing system
- Inspiration counter
- Moderation tools

### Phase 6: Polish & Optimization

- Mobile responsiveness audit
- Performance optimization
- A/B testing celebration timing
- Analytics dashboard for admin

## Design System Compliance

### Component Usage

- All components from `@/lib/design-system/components`
- Use `Container size="xl"` (no PageLayout)
- Mobile-first responsive patterns
- Neon color palette from tokens

### Button Variants

- Primary: Main CTAs in progress UI
- Accent: Celebration actions, milestone CTAs
- Ghost: Secondary actions in cards

### Card Design

- `rounded-2xl` corners
- 2px neon borders on active/hover
- Lift effect on hover (`-translate-y-1`)
- Black background with gradient overlays

### Typography

- Responsive text sizing (text-sm md:text-xl)
- Bold for milestone titles
- Semibold for category names
- Regular for descriptions

### Animations

- 300ms duration for transitions
- Use existing fadeIn, pulseSubtle
- Add bounce and glow variants
- Respect reduced motion preferences

## Files to Create

### Database

- `supabase/migrations/[timestamp]_create_conscious_progress_system.sql`

### Core Services

- `src/lib/progress/tracker.ts` - Event tracking logic
- `src/lib/progress/milestones.ts` - Milestone definitions
- `src/lib/progress/streaks.ts` - Streak calculation
- `src/lib/progress/mastery.ts` - Category mastery logic
- `src/lib/progress/celebrations.ts` - Celebration triggers

### API Routes

- `src/app/api/progress/events/route.ts`
- `src/app/api/progress/streaks/route.ts`
- `src/app/api/progress/milestones/route.ts`
- `src/app/api/progress/mastery/route.ts`
- `src/app/api/progress/transformation/route.ts`
- `src/app/api/progress/rituals/route.ts`
- `src/app/api/progress/ripples/route.ts` (optional)

### Components

- `src/components/progress/ProgressDashboard.tsx`
- `src/components/progress/StreakIndicator.tsx`
- `src/components/progress/MilestoneCelebration.tsx`
- `src/components/progress/CategoryMasteryCard.tsx`
- `src/components/progress/TransformationTimeline.tsx`
- `src/components/progress/CommunityRipples.tsx` (optional)
- `src/components/progress/RitualTracker.tsx`

### Hooks

- `src/hooks/useProgress.ts` - Fetch progress data
- `src/hooks/useStreaks.ts` - Streak management
- `src/hooks/useMilestones.ts` - Milestone checks

### Pages

- `src/app/progress/page.tsx` - Full progress dashboard
- `src/app/progress/category/[key]/page.tsx` - Category mastery detail

### Styles

- Add animations to `src/app/globals.css`:
  - `@keyframes bounceNeon`
  - `@keyframes scaleGlow`
  - `@keyframes confettiNeon`

### Documentation

- `docs/conscious-progress/SYSTEM_OVERVIEW.md`
- `docs/conscious-progress/MILESTONE_DEFINITIONS.md`
- `docs/conscious-progress/INTEGRATION_GUIDE.md`
- `docs/conscious-progress/API_REFERENCE.md`

## Success Metrics

### Engagement Metrics

- Daily active users increase
- Session duration increase
- Feature adoption rates

### Retention Metrics

- 7-day retention improvement
- 30-day retention improvement
- Churn rate reduction

### Product Metrics

- Milestones achieved per user
- Average streak length
- Category mastery completion rate
- Token usage correlation

### Qualitative Metrics

- User feedback on celebration timing
- Perceived value of progress tracking
- Spiritual alignment with brand voice

## Testing Strategy

### Unit Tests

- Streak calculation logic
- Milestone eligibility checks
- Mastery level calculations

### Integration Tests

- API route responses
- Database triggers
- Event recording accuracy

### UI Tests

- Component rendering
- Animation performance
- Mobile responsiveness

### User Testing

- Celebration modal timing
- Progress dashboard clarity
- Milestone meaningfulness

## Brand Voice Guidelines

### Language to Use

- "Evidence of actualization" (not "achievement unlocked")
- "Vibrational momentum" (not "streak")
- "Conscious milestone" (not "badge earned")
- "Above the Green Line" (not "high score")
- "Deepen your practice" (not "level up")

### Celebration Messaging

- Focus on personal growth, not competition
- Reference specific transformation
- Connect to life vision alignment
- Encourage continued practice
- Subtle, not overwhelming

### Avoidance List

- No "points" language
- No leaderboard comparisons
- No "beating" or "winning"
- No gamey terms (XP, level, rank)
- No shallow praise ("Good job!")

## Future Enhancements

### Smart Recommendations

- VIVA suggests next milestone to pursue
- Personalized ritual recommendations
- Category focus suggestions

### Social Features

- Accountability partners (opt-in)
- Private groups for households
- Celebration sharing to social media

### Advanced Analytics

- Correlation between streaks and assessment scores
- Optimal ritual timing per user
- Predictive churn modeling

### Integrations

- Calendar sync for ritual reminders
- Wearable device data (meditation, sleep)
- Email digest of weekly progress