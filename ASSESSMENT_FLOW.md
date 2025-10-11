# Assessment System Flow Diagram

## 🔄 User Journey Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        DASHBOARD                                 │
│  - Shows "Take Assessment" CTA (if not taken)                   │
│  - Profile completion check (50%+)                              │
│  - Links to /assessment                                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   START ASSESSMENT                               │
│  1. Create new assessment_result record                         │
│  2. Set status = 'in_progress'                                  │
│  3. Initialize with user_id                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ASSESSMENT PAGE                                 │
│  ┌───────────────────────────┬───────────────────────────────┐ │
│  │   MAIN CONTENT            │   SIDEBAR                     │ │
│  │   ═════════════            │   ════════                    │ │
│  │                            │                               │ │
│  │   Category Header          │   Overall Progress:           │ │
│  │   • Money / Wealth         │   [████████░░] 80%           │ │
│  │   • Icon + Description     │                               │ │
│  │                            │   Category Progress:          │ │
│  │   Question Card            │   ✓ Money (100%)             │ │
│  │   ┌──────────────────────┐ │   ✓ Health (100%)            │ │
│  │   │ Q1 of 84             │ │   → Business (3/7)           │ │
│  │   │                      │ │   ○ Romance (0/7)            │ │
│  │   │ "You open your       │ │   ...                        │ │
│  │   │  banking app..."     │ │                               │ │
│  │   │                      │ │   Tip:                       │ │
│  │   │ [🟢] Option 1 (10)  │ │   Answer honestly...         │ │
│  │   │ [🟢] Option 2 (8)   │ │                               │ │
│  │   │ [⚪] Option 3 (6)   │ │                               │ │
│  │   │ [🔴] Option 4 (4)   │ │                               │ │
│  │   │ [🔴] Option 5 (2)   │ │                               │ │
│  │   └──────────────────────┘ │                               │ │
│  │                            │                               │ │
│  │   [← Previous] [Next →]    │                               │ │
│  └───────────────────────────┴───────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ (User selects option)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SAVE RESPONSE                                   │
│  1. POST /api/assessment/responses                              │
│  2. Save to assessment_responses table                          │
│  3. Database trigger fires → recalculate scores                 │
│  4. Auto-advance to next question                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ (Repeat for all 84 questions)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                COMPLETE ASSESSMENT                               │
│  1. PATCH /api/assessment (status = 'completed')                │
│  2. Set completed_at timestamp                                  │
│  3. Final score calculation                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  RESULTS SUMMARY                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          🎯 Assessment Complete!                           │ │
│  │     Your Vibrational Snapshot Across 12 Categories        │ │
│  │                                                            │ │
│  │              Overall Score: 628 / 840                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────┬──────────────┬──────────────┐                │
│  │  📈 Above    │  ⚖️ Transition│  📉 Below    │                │
│  │     6        │      4        │     2        │                │
│  │  Categories  │  Categories   │  Categories  │                │
│  └──────────────┴──────────────┴──────────────┘                │
│                                                                  │
│  Your Strongest Areas:            Growth Opportunities:         │
│  ┌────────────────────────┐     ┌────────────────────────┐    │
│  │ 💰 Money (68/70)       │     │ ❤️ Romance (32/70)     │    │
│  │ 💪 Health (66/70)      │     │ 💼 Business (38/70)    │    │
│  │ 🎉 Fun (64/70)         │     │ 🏠 Home (42/70)        │    │
│  └────────────────────────┘     └────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │     ✨ Ready to Create Your Life Vision with VIVA?       │ │
│  │                                                            │ │
│  │        [Generate My Life Vision]  [View Details]         │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   [Generate Vision]      [Detailed Results]
   (Future: VIVA)         (Assessment page)
```

## 🗄️ Database Flow

```
┌──────────────────┐
│   User Action    │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  API Route: /api/assessment/responses   │
│  POST { question_id, response_value }   │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│   Insert/Update in:                     │
│   assessment_responses                  │
│   ┌───────────────────────────────────┐ │
│   │ assessment_id                     │ │
│   │ question_id: "money_1"            │ │
│   │ category: "money"                 │ │
│   │ response_value: 10                │ │
│   │ response_text: "I feel calm..."   │ │
│   │ green_line: "above"               │ │
│   └───────────────────────────────────┘ │
└────────┬────────────────────────────────┘
         │
         ▼ (Trigger fires automatically)
┌─────────────────────────────────────────┐
│   Database Trigger:                     │
│   update_assessment_scores()            │
│                                         │
│   FOR EACH category:                    │
│     1. Sum all response_values          │
│     2. Calculate percentage (score/70)  │
│     3. Determine Green Line status      │
│        • 80%+ → "above"                 │
│        • 60-79% → "transition"          │
│        • <60% → "below"                 │
│                                         │
│   Calculate total_score (all categories)│
│   Calculate overall_percentage          │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│   Update in:                            │
│   assessment_results                    │
│   ┌───────────────────────────────────┐ │
│   │ category_scores: {                │ │
│   │   "money": 68,                    │ │
│   │   "health": 56,                   │ │
│   │   ...                             │ │
│   │ }                                 │ │
│   │ green_line_status: {              │ │
│   │   "money": "above",               │ │
│   │   "health": "above",              │ │
│   │   ...                             │ │
│   │ }                                 │ │
│   │ total_score: 628                  │ │
│   │ overall_percentage: 75            │ │
│   └───────────────────────────────────┘ │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│   Client Fetches Updated Progress:      │
│   GET /api/assessment/progress          │
│   Returns updated scores & percentages  │
└─────────────────────────────────────────┘
```

## 🎨 Component Hierarchy

```
/assessment (page.tsx)
│
├── <Container>
│   └── <Grid>
│       ├── Main Content (2/3 width)
│       │   │
│       │   ├── Category Header
│       │   │   ├── Icon
│       │   │   ├── Title
│       │   │   └── Description
│       │   │
│       │   ├── <QuestionCard>
│       │   │   ├── Question Header
│       │   │   │   ├── "Question X of 84"
│       │   │   │   └── Category Badge
│       │   │   ├── Question Text
│       │   │   ├── Options (5 buttons)
│       │   │   │   └── Each option:
│       │   │   │       ├── Emoji
│       │   │   │       ├── Text
│       │   │   │       ├── Value badge
│       │   │   │       └── Selection indicator
│       │   │   └── Green Line Legend
│       │   │
│       │   └── Navigation
│       │       ├── [Previous] button
│       │       ├── Progress text
│       │       └── [Next] button
│       │
│       └── Sidebar (1/3 width)
│           └── <ProgressTracker>
│               ├── Overall Progress Card
│               │   ├── Percentage (%)
│               │   ├── Progress bar
│               │   └── "X of 84 answered"
│               ├── Category Progress Card
│               │   └── For each category:
│               │       ├── Icon
│               │       ├── Name
│               │       ├── X/7 questions
│               │       └── Percentage
│               └── Tip Card
│                   └── Motivational tip
│
│ (When complete)
│
└── <ResultsSummary>
    ├── Hero Card
    │   ├── Trophy icon
    │   ├── "Assessment Complete!"
    │   └── Overall score
    │
    ├── Stats Grid (3 cards)
    │   ├── Above Green Line (count)
    │   ├── In Transition (count)
    │   └── Below Green Line (count)
    │
    ├── Category Breakdown (2 cards)
    │   ├── Strongest Areas (top 3)
    │   └── Growth Opportunities (bottom 3)
    │
    └── Action Card
        ├── "Generate Life Vision" button
        └── "View Details" button
```

## 🔌 API Architecture

```
Client (Browser)
│
├── assessmentService.ts (Client Service Layer)
│   ├── createAssessment()
│   ├── fetchAssessments()
│   ├── saveResponse()
│   ├── fetchProgress()
│   └── completeAssessment()
│
│   (HTTP Requests)
│   
└── Next.js API Routes (Server)
    │
    ├── /api/assessment
    │   ├── GET    → Fetch assessments
    │   ├── POST   → Create new
    │   ├── PATCH  → Update status
    │   └── DELETE → Remove
    │
    ├── /api/assessment/responses
    │   ├── GET    → Fetch responses
    │   ├── POST   → Save/update response
    │   └── DELETE → Remove response
    │
    └── /api/assessment/progress
        └── GET    → Calculate real-time progress
        
        (Database Queries)
        
        ├── Supabase Client
        │   ├── RLS Policies (auth check)
        │   └── Database Functions
        │
        └── PostgreSQL Database
            ├── assessment_results
            ├── assessment_responses
            └── assessment_insights
```

## 🎯 Scoring Algorithm

```
For each question answered:

┌─────────────────────────┐
│  User selects option    │
│  Value: 2, 4, 6, 8, 10  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  Save to assessment_responses       │
│  with green_line classification:    │
│  • 10, 8 → "above"                  │
│  • 6 → "neutral"                    │
│  • 4, 2 → "below"                   │
└───────────┬─────────────────────────┘
            │
            ▼ (Trigger: update_assessment_scores)
┌─────────────────────────────────────┐
│  For EACH category:                 │
│                                     │
│  1. Calculate score:                │
│     score = SUM(response_values)    │
│     Max per category = 70           │
│                                     │
│  2. Calculate percentage:           │
│     % = (score / 70) * 100          │
│                                     │
│  3. Determine Green Line status:    │
│     IF % >= 80:                     │
│       status = "above"              │
│     ELSE IF % >= 60:                │
│       status = "transition"         │
│     ELSE:                           │
│       status = "below"              │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  Calculate Overall:                 │
│                                     │
│  total_score = SUM(all categories)  │
│  Max total = 840 (12 × 70)          │
│                                     │
│  overall_% = (total / 840) * 100    │
└─────────────────────────────────────┘
```

## 🌈 Color System

```
Green Line Status Colors:

┌──────────────┬──────────────┬─────────────┐
│    ABOVE     │  TRANSITION  │    BELOW    │
├──────────────┼──────────────┼─────────────┤
│  #199D67     │   #FFB701    │  #D03739    │
│  Primary     │   Energy     │  Contrast   │
│  Green       │   Yellow     │  Red        │
├──────────────┼──────────────┼─────────────┤
│  80%+ score  │  60-79%      │  <60%       │
│  56-70 pts   │  42-55 pts   │  14-41 pts  │
├──────────────┼──────────────┼─────────────┤
│  Aligned     │  Growing     │  Opportunity│
│  Thriving    │  Evolving    │  Aware      │
└──────────────┴──────────────┴─────────────┘

Used in:
• Question option buttons
• Progress indicators
• Category status badges
• Results summary cards
```

---

**This visual guide shows how all the pieces work together to create a seamless assessment experience!** 🎯✨

