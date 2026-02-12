# Retention Metrics System

**Last Updated:** February 12, 2026  
**Status:** Active

## Overview

VibrationFit's retention metrics system tracks user engagement across four distinct dimensions. Each metric answers a different question about a user's practice, and activities can intentionally increment multiple metrics.

## The 4 Metrics

### 1. Creations
**Question:** "What have I built?"

**Unit:** Objects (assets created)

**What Counts:**
- Life Visions (`vision_versions`)
- Audio Sets (`audio_sets`)
- Vision Board Items (`vision_board_items`)
- Journal Entries (`journal_entries`)
- Daily Paper Entries (`daily_papers`)
- Abundance Tracker Entries (`abundance_events`)

**Timeframes:**
- **Recent:** Last 30 days
- **Lifetime:** All-time total

**Display:**
- Headline: `X in last 30 days`
- Lifetime: `Y assets created`

---

### 2. Activations
**Question:** "How many times did I run my practice?"

**Unit:** Events (total count of qualifying activities)

**What Counts as an Activation (+1 each):**

- Play a Vision Audio (80%+ completion)
- Create a Journal entry
- Create a Daily Paper entry
- Create an Abundance Tracker entry
- Create OR Actualize a Vision Board item
- Attend an Alignment Gym session
- Post in Vibe Tribe

**Important:** Every qualifying activity counts individually. 3 audio plays + 2 journal entries = 5 activations.

**Timeframes:**
- **Recent:** Last 30 days
- **Lifetime:** All-time total events

**Display:**
- Headline: `X in last 30 days`
- Lifetime: `Y total activations`

**Implementation:**
- Counts queried real-time from existing tables (no extra table needed)

---

### 3. Connections
**Question:** "How much am I engaging with the community?"

**Unit:** Interactions (events)

**What Counts:**
- Vibe Tribe Posts (`vibe_posts`)
- Comments on posts (`vibe_comments`)
- Hearts given (`vibe_hearts`)

**Timeframes:**
- **Recent:** This week (last 7 days)
- **Lifetime:** All-time interactions

**Special Features:**
- **Nudge:** If zero interactions this week, shows: "Share one win or wobble with the Vibe Tribe today."
- **Last Post:** Displays snippet of most recent post

**Display:**
- Headline: `X this week`
- Lifetime: `Y interactions`

---

### 4. Sessions
**Question:** "How often am I showing up to live coaching?"

**Unit:** Events (sessions attended)

**What Counts:**
- Alignment Gym sessions attended (`video_session_participants.attended = true`)

**Timeframes:**
- **Recent:** Last 4 weeks
- **Target:** 4 sessions (1 per week goal)
- **Lifetime:** All-time sessions attended

**Special Features:**
- **Next Event:** Shows title and date of next scheduled session user is invited to

**Display:**
- Headline: `X / 4 weeks`
- Lifetime: `Y Alignment Gyms`

---

## Intentional Overlaps

Some activities increment multiple metrics **by design**. This is not duplication—each metric measures a different dimension.

### Example: Attending an Alignment Gym

```
User attends Alignment Gym →

Sessions: +1 (event counter)
Activations: +1 (practice event)
```

### Example: Creating a Daily Paper

```
User creates Daily Paper →

Creations: +1 (asset counter)
Activations: +1 (practice event)
```

### Example: Posting in Vibe Tribe

```
User posts in Vibe Tribe →

Connections: +1 (interaction counter)
Activations: +1 (practice event)
```

### Example: Big Practice Day

```
User plays 3 audios, creates journal, attends gym →

Creations: +1 (journal)
Activations: +5 (3 audio plays + 1 journal + 1 gym)
Sessions: +1 (gym)
```

---

## Technical Implementation

### Database Tables

All metrics are calculated real-time from existing tables. No extra tracking tables needed.

| Table | Feeds Into |
|-------|-----------|
| `vision_versions` | Creations |
| `audio_sets` | Creations |
| `audio_tracks` (play_count) | Activations |
| `vision_board_items` | Creations + Activations |
| `journal_entries` | Creations + Activations |
| `daily_papers` | Creations + Activations |
| `abundance_events` | Creations + Activations |
| `video_session_participants` | Sessions + Activations |
| `vibe_posts` | Connections + Activations |
| `vibe_comments` | Connections |
| `vibe_hearts` | Connections |

### API Endpoint

```
GET /api/retention-metrics?userId={optional}
```

Returns:
```typescript
{
  creations: {
    recent: number        // Last 30 days
    lifetime: number      // All-time
    lastCreation?: {
      type: 'vision' | 'audio' | 'board' | 'journal' | 'daily_paper' | 'abundance'
      title: string
      createdAt: string
    }
  },
  activations: {
    recent: number        // Last 30 days (total events)
    lifetime: number      // All-time total events
    totalAudioPlays: number
  },
  connections: {
    recent: number        // This week
    lifetime: number      // All-time
    lastPost?: {
      vibeTag: string
      snippet: string
      createdAt: string
    }
    needsNudge: boolean  // True if recent === 0
  },
  sessions: {
    recent: number        // Last 4 weeks
    target: 4            // Always 4
    lifetime: number      // All-time
    nextEvent?: {
      title: string
      scheduledAt: string
    }
  },
  calculatedAt: string
}
```

### Database Functions

**`get_user_total_audio_plays(user_id)`**
- Returns sum of `audio_tracks.play_count`
- Used as part of activation count and engagement indicator

---

## User Communication

When displaying metrics to users, include this explanation:

> **About These Metrics**
> 
> Some activities show up in multiple metrics -- that is by design! For example, attending an Alignment Gym session adds +1 Session AND +1 Activation. Creating a journal entry adds +1 Creation AND +1 Activation. Each metric answers a different question about your practice:
> 
> - **Creations** = What objects exist because of me?
> - **Activations** = How many times did I show up and do the work?
> - **Connections** = How many times did I interact with the community?
> - **Sessions** = How many times did I attend live coaching?

---

## Design System Integration

**Tiles Configuration** (`src/lib/retention/types.ts`):

```typescript
{
  creations: {
    title: 'Creations',
    icon: 'Sparkles',
    color: 'yellow',
  },
  activations: {
    title: 'Activations',
    icon: 'Play',
    color: 'green',
  },
  connections: {
    title: 'Connections',
    icon: 'Heart',
    color: 'purple',
    nudgeMessage: 'Share one win or wobble with the Vibe Tribe today.',
  },
  sessions: {
    title: 'Sessions',
    icon: 'Users',
    color: 'teal',
  },
}
```

---

## Future Enhancements

### Possible Additions to Activations
- Login events (general platform access)
- Vision refinements
- Token purchases/redemptions
- Intensive progress milestones

### Analytics Opportunities
- Most common activation activities per user
- Correlation between activation patterns and retention
- Weekly/monthly activation reports
- Admin monitoring dashboard with per-user breakdown

---

## Related Files

- `/src/app/api/retention-metrics/route.ts` - API endpoint
- `/src/lib/retention/types.ts` - TypeScript types
- `/src/components/retention/RetentionDashboard.tsx` - UI component
- `/src/components/retention/RetentionMetricTile.tsx` - Tile component
- `/src/app/api/admin/retention-metrics/[userId]/route.ts` - Admin detailed breakdown API
- `/src/components/admin/RetentionMetricsBreakdown.tsx` - Admin detailed view component

---

## Questions?

If you need to modify what counts as an activation:
1. Update `getActivationsMetrics()` in `/src/app/api/retention-metrics/route.ts`
2. Update `getDetailedActivations()` in `/src/app/api/admin/retention-metrics/[userId]/route.ts`
3. Update this documentation
4. Update user-facing copy
