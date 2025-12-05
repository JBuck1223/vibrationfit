---
name: Dynamic Community + Conscious Progress System
overview: ""
todos: []
---

# Dynamic Community + Conscious Progress System

## Core Philosophy

**Merge Two Systems:**

1. **Community Features** - Share actualization evidence, build connections, feel belonging
2. **Gamification (Conscious Progress)** - Track vibrational momentum, celebrate milestones, deepen mastery

**Design Principles:**

- **Privacy First**: Everything opt-in with granular preferences
- **Spiritual Language**: "Vibrational momentum" not "streaks", "evidence of actualization" not "points"
- **Belonging Over Competition**: Community as support, not leaderboards
- **Clean Data Flows**: Minimal tables, clear relationships, no duplication
- **Individual Sovereignty**: Each user controls their presence (independent of household billing)

---

## Option 1: BASIC - Evidence Feed + Momentum Tracking

**Goal:** Simple community sharing + personal progress tracking to feel connected and motivated.

### Database Schema (7 New Tables)

#### Community Tables (3)

**`community_ripples`** - Anonymous inspiration sharing

```sql
CREATE TABLE community_ripples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  ripple_type TEXT CHECK (ripple_type IN ('win', 'insight', 'transformation', 'evidence')) NOT NULL,
  source_type TEXT CHECK (source_type IN ('journal', 'manual', 'vision_board', 'milestone')),
  source_id UUID, -- References journal_entries.id, vision_board_items.id, etc.
  content TEXT NOT NULL,
  category TEXT, -- Life category
  
  -- Visibility (default anonymous)
  display_name TEXT, -- "Conscious Creator #1234" or custom
  is_anonymous BOOLEAN DEFAULT TRUE,
  visibility TEXT CHECK (visibility IN ('private', 'community')) DEFAULT 'community',
  
  -- Engagement
  inspiration_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ripples_created_at ON community_ripples(created_at DESC);
CREATE INDEX idx_ripples_category ON community_ripples(category);
CREATE INDEX idx_ripples_visibility ON community_ripples(visibility) WHERE visibility = 'community';
```

**`community_preferences`** - User community settings

```sql
CREATE TABLE community_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Visibility
  enabled BOOLEAN DEFAULT FALSE, -- Opt-in required
  display_name TEXT,
  show_avatar BOOLEAN DEFAULT FALSE,
  
  -- Auto-share
  auto_share_wins BOOLEAN DEFAULT FALSE,
  auto_share_actualizations BOOLEAN DEFAULT FALSE,
  auto_share_milestones BOOLEAN DEFAULT FALSE,
  
  -- Engagement
  allow_inspiration BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`community_inspiration`** - "Inspired me" reactions

```sql
CREATE TABLE community_inspiration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ripple_id UUID REFERENCES community_ripples(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ripple_id, user_id)
);

CREATE INDEX idx_inspiration_ripple ON community_inspiration(ripple_id);
```

#### Progress Tracking Tables (4)

**`vibrational_streaks`** - Consistency tracking

```sql
CREATE TABLE vibrational_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  streak_type TEXT CHECK (streak_type IN ('daily_alignment', 'journal', 'vision_audio', 'viva_chat', 'community_engagement')) NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  -- Optional community visibility
  show_in_community BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

CREATE INDEX idx_streaks_user ON vibrational_streaks(user_id);
```

**`conscious_milestones`** - Journey celebrations

```sql
CREATE TABLE conscious_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  milestone_key TEXT NOT NULL, -- 'first_vision', '30_day_alignment', etc.
  milestone_category TEXT CHECK (milestone_category IN ('creation', 'alignment', 'transformation', 'mastery')),
  
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  celebration_viewed BOOLEAN DEFAULT FALSE,
  shared_to_community BOOLEAN DEFAULT FALSE,
  
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, milestone_key)
);

CREATE INDEX idx_milestones_user ON conscious_milestones(user_id, achieved_at DESC);
```

**`category_mastery`** - Depth per life area

```sql
CREATE TABLE category_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 12 life categories
  
  mastery_level INTEGER DEFAULT 0, -- 0-100 scale
  evidence_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  milestones_achieved TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);

CREATE INDEX idx_mastery_user_category ON category_mastery(user_id, category);
```

**`conscious_progress_events`** - Core tracking

```sql
CREATE TABLE conscious_progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  event_type TEXT CHECK (event_type IN ('evidence', 'momentum', 'milestone', 'ritual', 'mastery', 'transformation')) NOT NULL,
  category TEXT, -- Life category or 'all'
  vibration_score INTEGER, -- 1-10 scale
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_progress_events_user ON conscious_progress_events(user_id, created_at DESC);
```

### Milestone Definitions (Built-In)

**Creation Milestones:**

- `profile_complete` - Profile 70%+ complete
- `first_assessment` - Completed first assessment
- `first_vision` - First life vision created
- `vision_refined` - Used refinement tools
- `audio_generated` - Generated vision audio
- `all_categories_complete` - All 12 categories filled

**Alignment Milestones:**

- `first_journal_entry` - First journal entry
- `7_day_streak` - 7 consecutive days of activity
- `30_day_alignment` - 30 days consistent practice
- `100_journal_entries` - Century club
- `vision_audio_50_plays` - Deep immersion

**Transformation Milestones:**

- `assessment_improved` - Score increased 20%+
- `above_green_line` - All categories above 70%
- `category_mastery_achieved` - Mastered one area
- `one_year_journey` - Anniversary

### Data Flow

**Sharing a Win to Community:**

```
1. User creates journal entry tagged as "win"
2. IF community_preferences.auto_share_wins = TRUE
   → Create community_ripples (ripple_type='win', source='journal')
3. ELSE: Show "Send Ripple to Community" button
   → Click → Create community_ripples with anonymous option
```

**Triggering Milestone:**

```
1. User completes action (e.g., 7th consecutive journal entry)
2. Backend checks milestone eligibility
3. Create conscious_milestones record
4. Trigger celebration modal (neon animation)
5. IF user enabled auto_share_milestones
   → Create community_ripples (ripple_type='transformation', source='milestone')
```

**Updating Streak:**

```
1. User completes daily ritual (journal, vision audio, VIVA chat)
2. Check vibrational_streaks for user + streak_type
3. IF last_activity_date = yesterday → increment current_streak
4. ELSE IF last_activity_date < yesterday → reset to 1
5. Update longest_streak if current > longest
```

### API Endpoints (7 Total)

**Community:**

- `POST /api/community/ripples` - Share a ripple
- `GET /api/community/feed` - Get community feed (paginated, filtered)
- `POST /api/community/inspire/:rippleId` - Mark "inspired me"
- `GET /api/community/preferences` - Get user's settings
- `PATCH /api/community/preferences` - Update settings

**Progress:**

- `GET /api/progress/summary` - Get user's overall progress (streaks, milestones, mastery)
- `GET /api/progress/milestones` - Get achieved milestones

### UI Components

**Community Feed Page** (`/community`)

- Cards showing ripples (wins, insights, transformations)
- Filter by category
- "Send Ripple" floating button
- "Inspired me ✨" counter + button
- Anonymous by default

**Progress Dashboard Widget** (in `/dashboard`)

- Current longest streak (neon green badge with flame icon)
- Recent 3 milestones
- Category mastery mini-chart
- "Your Vibrational Momentum" score

**Milestone Celebration Modal**

- Full-screen overlay with neon glow animation
- Milestone icon + name ("7-Day Alignment Achieved!")
- Celebratory message in brand voice
- Toggle: "Share this milestone to community?"
- "Continue Your Journey" CTA

**Community Preferences** (`/community/settings`)

- Toggle: "Participate in Community"
- Display name (or "Stay Anonymous")
- Toggle: "Auto-share journal wins"
- Toggle: "Auto-share vision board actualizations"
- Toggle: "Auto-share milestone achievements"

**Streak Indicator** (navigation bar)

- Small flame icon with number
- Pulsing neon glow when active
- Red state when streak at risk (24 hours until reset)

### Integration Points

**Journal System:**

- Create entry → Update journal streak
- Tag as "win" → Eligible for community ripple
- 7/30/100 entries → Trigger milestones

**Vision System:**

- Create vision → `first_vision` milestone
- Complete category → category_mastery +10
- Generate audio → `audio_generated` milestone

**VIVA Chat:**

- Daily interaction → Update VIVA chat streak

**Vision Board:**

- Move item to "actualized" → Eligible for community ripple + evidence count

### Brand Voice (Language Guide)

**Use:**

- "Evidence of actualization" (not "achievement")
- "Vibrational momentum" (not "streak")
- "Conscious milestone" (not "badge")
- "Above the Green Line" (not "high score")
- "Send a ripple" (not "post")
- "Inspired me" (not "like")

**Avoid:**

- Points, XP, levels, ranks
- Gamey terms
- Competitive language
- Shallow praise

### Token Economics

**Option A: Free** - All features free (builds platform value)

**Option B: Freemium** - Basic free, premium features:

- Advanced feed filters (by date range, multiple categories): **100 tokens/month**
- "Boost" ripple visibility (featured for 24hr): **300 tokens**

### Estimated Effort

- **Database**: 7 migrations (~4 hours)
- **API**: 7 endpoints (~6 hours)
- **UI**: 4 components (~10 hours)
- **Total**: ~20 hours (~2.5 days)

---

## Option 2: INTERMEDIATE - Profiles + Accountability + Deeper Tracking

**Goal:** Add social graph, accountability partnerships, and transformation tracking.

### Additional Database Schema (5 New Tables + Basic 7)

**`community_profiles`** - Separate identity

```sql
CREATE TABLE community_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  
  -- Computed stats
  total_ripples INTEGER DEFAULT 0,
  total_inspiration_received INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`community_follows`** - Following

```sql
CREATE TABLE community_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_user_id, following_user_id),
  CHECK (follower_user_id != following_user_id)
);

CREATE INDEX idx_follows_follower ON community_follows(follower_user_id);
CREATE INDEX idx_follows_following ON community_follows(following_user_id);
```

**`community_accountability_pairs`** - Accountability buddies

```sql
CREATE TABLE community_accountability_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  status TEXT CHECK (status IN ('pending', 'active', 'paused', 'ended')) DEFAULT 'pending',
  check_in_frequency TEXT DEFAULT 'weekly',
  last_check_in_at TIMESTAMPTZ,
  next_check_in_due TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_1_id, user_2_id)
);
```

**`transformation_snapshots`** - Before/after tracking

```sql
CREATE TABLE transformation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  snapshot_type TEXT CHECK (snapshot_type IN ('assessment', 'category_state', 'overall')) NOT NULL,
  category TEXT,
  before_score INTEGER,
  after_score INTEGER,
  before_data JSONB,
  after_data JSONB,
  transformation_percentage INTEGER,
  
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_user ON transformation_snapshots(user_id, captured_at DESC);
```

**`community_tags`** - Discovery tags

```sql
CREATE TABLE community_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tag_name)
);

CREATE INDEX idx_tags_name ON community_tags(tag_name);
```

### Enhanced Features

**Community Profiles:**

- Opt-in public profile with stats
- Show ripples, streaks, milestones
- Follow/unfollow users

**Discovery:**

- Browse members by category interest
- Search by tags ("entrepreneur", "health journey")
- "For You" feed (followed members)

**Accountability Partners:**

- Request accountability buddy
- Weekly check-in reminders (via email/dashboard)
- See partner's activity (if both allow)

**Transformation Timeline:**

- Visual chart of assessment scores over time
- Milestones plotted on timeline
- Growth trajectory

**Enhanced Progress Dashboard:**

- Full `/progress` page with detailed stats
- Category mastery detail views
- Transformation snapshots

### Additional API Endpoints (8 Total)

- `POST /api/community/profile` - Create/update profile
- `GET /api/community/profile/:userId` - View profile
- `POST /api/community/follow/:userId` - Follow user
- `DELETE /api/community/follow/:userId` - Unfollow
- `GET /api/community/discover` - Discover members (filtered)
- `POST /api/community/accountability/request` - Request partner
- `POST /api/progress/transformation/snapshot` - Create snapshot
- `GET /api/progress/transformation/history` - Get transformation history

### Additional UI Components

**Community Profile Page** (`/community/profile/:userId`)

- Display name, bio, avatar
- Recent ripples
- Stats (ripples sent, inspiration received, longest streak)
- Follow button

**Discovery Page** (`/community/discover`)

- Member cards with tags
- Filter by category focus
- "Request Accountability Partner" button

**Transformation Timeline** (`/progress`)

- Line chart showing assessment scores
- Milestones marked on timeline
- Before/after comparisons

**Category Mastery Cards** (`/progress`)

- Grid of 12 life categories
- Circular progress rings (0-100%)
- Evidence count per category
- "Deepen Mastery" CTA

### Token Economics

**Option A: Free** - All free

**Option B: Freemium**

- Basic free
- AI-powered accountability matching: **500 tokens**
- Transformation insights report: **200 tokens**

### Estimated Effort

- **Database**: +5 migrations (~3 hours)
- **API**: +8 endpoints (~7 hours)
- **UI**: +5 components (~15 hours)
- **Total**: +25 hours (~3 days) | **Cumulative: ~5.5 days**

---

## Option 3: ADVANCED - Circles + Collective Goals + AI + Token Economy

**Goal:** Full ecosystem with private groups, AI insights, collective manifestation, and token rewards.

### Additional Database Schema (7 New Tables + Intermediate 12)

**`community_circles`** - Private/public groups

```sql
CREATE TABLE community_circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  creator_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  is_public BOOLEAN DEFAULT FALSE,
  max_members INTEGER DEFAULT 50,
  focus_categories TEXT[] DEFAULT '{}',
  
  member_count INTEGER DEFAULT 1,
  post_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`community_circle_members`** - Circle membership

```sql
CREATE TABLE community_circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES community_circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  status TEXT CHECK (status IN ('active', 'left')) DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);
```

**`community_circle_posts`** - Circle-specific posts

```sql
CREATE TABLE community_circle_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES community_circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT CHECK (post_type IN ('update', 'question', 'celebration', 'support')) DEFAULT 'update',
  inspiration_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`community_comments`** - Comments on ripples/posts

```sql
CREATE TABLE community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID, -- References community_ripples.id OR community_circle_posts.id
  post_type TEXT CHECK (post_type IN ('ripple', 'circle')) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`community_collective_goals`** - Group challenges

```sql
CREATE TABLE community_collective_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES community_circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  participant_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`community_collective_goal_participants`** - Goal participation

```sql
CREATE TABLE community_collective_goal_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES community_collective_goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
  check_ins INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, user_id)
);
```

**`community_ai_insights`** - AI-generated insights

```sql
CREATE TABLE community_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT CHECK (insight_type IN ('personal', 'circle', 'platform')) NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_circle_id UUID REFERENCES community_circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  data JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);
```

### Advanced Features

**Community Circles:**

- Create private/public groups around topics
- Circle-specific feeds and discussions
- Admin moderation tools
- Circle-focused collective goals

**AI-Powered Features (Token-Gated):**

- **Smart Matching**: VIVA analyzes vision + journal to suggest ideal accountability partners (**500 tokens**)
- **Trend Spotting**: Weekly summary of "what's actualizing in the community" (**100 tokens**)
- **Personal Insights**: Compare your journey to similar-stage creators (**200 tokens**)
- **Circle Summaries**: Auto-digest for circle admins (**200 tokens**)

**Collective Manifestation:**

- Join group challenges (e.g., "30-Day Health Transformation")
- Track collective progress
- Shared celebrations when milestones hit

**Token Rewards System:**

**Earn Tokens:**

- Highly inspired ripple (10+ inspirations): **+10 tokens**
- Active accountability partnership (weekly check-in): **+25 tokens/week**
- Successful referral (friend upgrades): **+50 tokens**
- Complete collective goal: **+100 tokens**
- Consistent daily alignment (30-day streak): **+200 tokens**

**Spend Tokens:**

- AI matchmaking: **500 tokens**
- Community trends report: **100 tokens**
- Personal insights: **200 tokens**
- Boost ripple visibility (24hr): **300 tokens**
- Circle summary: **200 tokens**

**Advanced Analytics:**

- Personal: Engagement trends, category alignment
- Circle: Health score, active members, topic trends
- Platform: "Community Momentum Score" (collective vibrational rise)

### Additional API Endpoints (15 Total)

**Circles:**

- `POST /api/community/circles`
- `GET /api/community/circles`
- `POST /api/community/circles/:id/join`
- `POST /api/community/circles/:id/posts`
- `GET /api/community/circles/:id/feed`

**AI Features:**

- `POST /api/community/ai/match` - Find partners (costs tokens)
- `GET /api/community/ai/trends` - Community trends (costs tokens)
- `GET /api/community/ai/insights/personal` - Personal insights (costs tokens)

**Collective Goals:**

- `POST /api/community/collective-goals`
- `POST /api/community/collective-goals/:id/join`
- `POST /api/community/collective-goals/:id/check-in`

**Comments & Engagement:**

- `POST /api/community/ripples/:id/comment`
- `GET /api/community/ripples/:id/comments`

**Token Rewards:**

- `POST /api/community/rewards/claim` - Claim earned tokens
- `GET /api/community/rewards/history` - Reward history

### Additional UI Components

**Circles Hub** (`/community/circles`)

- Browse public circles
- Your circles
- Create circle modal

**Circle Detail** (`/community/circles/:id`)

- Circle feed
- Member list
- Collective goals
- Admin controls (if admin)

**Collective Goals** (`/community/goals`)

- Active challenges
- Create challenge
- Progress tracking

**AI Insights Dashboard** (`/community/insights`)

- Personal trend cards
- Recommended connections
- Community momentum meter
- Purchase insights with tokens

**Enhanced Feed:**

- Comments on ripples
- Rich media (images, videos)
- Multiple post types

### Estimated Effort

- **Database**: +7 migrations (~5 hours)
- **API**: +15 endpoints (~12 hours)
- **AI Integration**: VIVA prompts + logic (~8 hours)
- **UI**: +8 components (~24 hours)
- **Total**: +49 hours (~6 days) | **Cumulative: ~11.5 days**

---

## Gamification Milestone Auto-Triggers

### Integration with Existing Features

**Vision System:**

- Vision created → `first_vision` milestone → Optional community ripple
- Category completed → category_mastery +10, progress event
- Vision refined → `vision_refined` milestone
- Audio generated → `audio_generated` milestone

**Journal System:**

- Entry created → Update journal streak, progress event
- 7/30/100 entries → Milestone achievements → Celebration modal
- Entry tagged "win" → Eligible for auto-share ripple

**Assessment System:**

- First completion → `first_assessment` milestone
- Score improvement 20%+ → `assessment_improved` milestone + transformation snapshot

**VIVA Chat:**

- Daily interaction → Update VIVA chat streak
- 20+ message conversation → Evidence event

**Vision Board:**

- First item → `vision_board_started` milestone
- Item actualized → Eligible for auto-share ripple + evidence count

**Audio Playback:**

- Daily listening → Update vision_audio streak
- 50 plays → `vision_audio_50_plays` milestone

### Celebration Animations

**Use existing animations + add:**

- `bounceNeon` - Bounce with neon glow (milestone badges)
- `scaleGlow` - Scale up with expanding neon ring (major milestones)
- `confettiNeon` - Neon particles (anniversary milestones)

**Celebration Timing:**

- Major milestones → Full-screen modal with animation
- Minor progress → Toast notification (top-right)
- Daily events → Silent dashboard update

---

## Data Architecture Summary

**Core Principle:** User data stays in source tables. Community + progress tables reference, never duplicate.

```
USER CORE DATA (Source of Truth)
├─ journal_entries
├─ vision_versions
├─ vision_board_items
├─ user_profiles
└─ assessment_results

   ↓ (References only)

COMMUNITY LAYER
├─ community_ripples (points to journal_entries, vision_board_items, milestones)
├─ community_profiles
├─ community_preferences
└─ community_* (follows, inspiration, etc.)

PROGRESS LAYER
├─ vibrational_streaks (updated by system on user actions)
├─ conscious_milestones (triggered by eligibility checks)
├─ category_mastery (computed from user actions)
└─ conscious_progress_events (event log for analytics)
```

**Privacy Enforcement:**

- RLS policies on all tables
- Community feed only shows visibility='community' ripples
- Deleting source (journal entry) cascades to ripple
- Progress data always private unless user shares milestone

---

## Summary Comparison

| Feature | Basic | Intermediate | Advanced |

|---------|-------|--------------|----------|

| **Community Ripples (Feed)** | ✅ | ✅ | ✅ |

| **Vibrational Streaks** | ✅ | ✅ | ✅ |

| **Milestone Celebrations** | ✅ | ✅ | ✅ |

| **Category Mastery Tracking** | ✅ | ✅ | ✅ |

| **Anonymous Sharing** | ✅ (default) | Optional | Optional |

| **Inspiration Reactions** | ✅ | ✅ | ✅ |

| **Community Profiles** | ❌ | ✅ | ✅ |

| **Following** | ❌ | ✅ | ✅ |

| **Accountability Partners** | ❌ | ✅ | ✅ |

| **Transformation Timeline** | ❌ | ✅ | ✅ |

| **Discovery/Search** | ❌ | ✅ | ✅ |

| **Private Circles** | ❌ | ❌ | ✅ |

| **Collective Goals** | ❌ | ❌ | ✅ |

| **Comments** | ❌ | ❌ | ✅ |

| **AI Matching** | ❌ | ❌ | ✅ |

| **Token Rewards** | ❌ | ❌ | ✅ |

| **AI Insights** | ❌ | ❌ | ✅ |

| | | | |

| **New Tables** | 7 | 12 | 19 |

| **API Endpoints** | 7 | 15 | 30 |

| **Implementation Time** | 2.5 days | 5.5 days | 11.5 days |

| **Token Economics** | Free or basic freemium | Free or AI features | Full earn/spend economy |

---

## Rollout Strategy

### Recommended Path: Phased Launch

**Phase 1: BASIC (Week 1-2)**

- Launch progress tracking (streaks, milestones) for ALL users (personal)
- Launch community ripples as OPT-IN beta
- Measure: Opt-in rate, ripple frequency, streak engagement

**Phase 2: INTERMEDIATE (Week 3-6)**

- Add profiles + following for beta community users
- Test accountability pairing with 20-50 pairs
- Add transformation timeline to progress dashboard
- Measure: Follow density, accountability retention, transformation sharing

**Phase 3: ADVANCED (Week 7-12)**

- Launch circles for active community members
- Introduce AI features with token costs
- Enable token reward system
- Test collective goals with 2-3 pilot circles
- Measure: Token earn/spend balance, circle activity, AI feature usage

### Migration for Existing Users

1. All users default to `community_preferences.enabled = FALSE`
2. Dashboard banner: "✨ New: Community + Progress Tracking [Learn More]"
3. One-time onboarding flow explaining opt-in community
4. Settings always has "Leave Community" option

---

## Privacy & Safety (All Tiers)

**Required:**

1. Report ripple/post functionality
2. Admin moderation queue
3. Block/mute users
4. Auto-hide content with 3+ reports
5. 30-day recovery for deleted profiles

**Under 18:**

- Cannot enable community without household admin approval
- Household admin can disable member's community access

---

## Next Steps

1. **Choose Tier** - Recommend starting with Basic
2. **Review Schema** - Ensure alignment with data philosophy
3. **Create Migrations** - Generate SQL for chosen tier
4. **Build API Layer** - Implement endpoints + RLS policies
5. **Design UI** - Build components following design system
6. **Beta Test** - 10-20 users for feedback
7. **Iterate** - Refine based on engagement data

**Recommended:** Basic → gather 2 weeks data → decide if Intermediate adds value → Advanced only if community thriving and requesting features.