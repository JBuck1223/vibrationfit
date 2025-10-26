# VIVA Unified Architecture
## The Emotionally Intelligent Conversational Brain

This document outlines the complete unified architecture for VIVA - an emotionally intelligent, cross-category AI assistant that understands the full vibrational context of a user's life.

---

## 🌊 Core Vision

VIVA doesn't treat life categories in isolation. Instead, it understands that **everything vibrationally relates**. When a user talks about money, VIVA naturally weaves in health, family, and creativity because it sees the emotional threads connecting them.

---

## 🧠 The Rolling Context Object (RCO)

Every conversation starts with a complete context snapshot:

```typescript
{
  member_id: "uuid",
  focus_category: "money",
  related_categories: ["business", "health", "family"],
  current_emotion: "frustrated",
  vibrational_links: ["security", "freedom", "balance"],
  session_summary: "feeling stuck between responsibility and creativity",
  desired_state: "ease + momentum",
  recent_wins: ["client paid early", "good workout"],
  cross_category_insights: [
    {
      category_a: "money",
      category_b: "health",
      connection: "security, discipline",
      strength: 0.75
    }
  ]
}
```

**API Endpoint**: `GET /api/viva/context`

This context is cached (Redis/supabase) and refreshed on:
- New journal entry
- Vision update
- Assessment change
- New vibrational link detected

---

## 🔗 Vibrational Links Table

**New Table**: `vibrational_links`

This table tracks emotional, thematic, and behavioral connections between life categories:

```sql
CREATE TABLE vibrational_links (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  category_a TEXT,        -- e.g., 'money'
  category_b TEXT,        -- e.g., 'health'
  strength NUMERIC,       -- 0-1 correlation
  shared_themes TEXT[],   -- ['security','discipline','balance']
  connection_type TEXT,   -- 'emotional', 'thematic', 'behavioral'
  notes TEXT,             -- AI-generated context
  evidence_count INTEGER, -- Reinforcement counter
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### How Links Are Created

Links are passively generated when:
1. **Journal entries** mention multiple categories with shared emotions
2. **Vision goals** align across categories
3. **Assessment scores** show parallel patterns
4. **User conversation** reveals connections

**Example**: If a user writes about feeling "stressed about money AND time for health," VIVA creates a link between money and health with theme "pressure, balance, time allocation."

---

## 💬 Conversational Flow Architecture

### Three-Tier Reasoning Loop

Every user message flows through three nested loops:

| Loop | Purpose | Model | Speed |
|------|---------|-------|-------|
| 🫶 Connection | Recognize emotion, mirror with warmth | GPT-5-mini | <200ms |
| 🔍 Insight | Detect cross-category patterns | GPT-5 | <500ms |
| 🎯 Action | Offer micro-step, question, or exercise | GPT-5 | <500ms |

**Total Response Time**: <1.2 seconds with streaming

### Streaming Output Strategy

1. **Instant reflection** (optimistic response) - begins immediately
2. **Quick insight injection** - adds context mid-stream
3. **Believable next step** - completes the response

---

## 🎭 Personality Layer

VIVA's friend-coach persona is defined with clear traits:

| Trait | Expression |
|-------|------------|
| Empathetic | "I can feel what you mean." |
| Curious | "What do you think that's really about?" |
| Encouraging | "That awareness right there is huge." |
| Playful | "Okay, mini-experiment time…" |
| Wise | "Every bit of contrast is a breadcrumb." |

This persona is injected as a system prefix in every GPT call.

---

## 🔄 Cross-Category Awareness

When a user talks about any category, VIVA:

1. **Checks vibrational links** for related categories
2. **Weaves connections naturally** into conversation
3. **Uses pivot phrases** like "That reminds me…" or "The same energy shows up when…"

**Example Dialogue**:

```
User: "I'm stressed about money again."

VIVA: "Yeah, I feel that. You've been craving stability lately, and 
it's no wonder — your family and health goals both pull on that same 
energy of safety. Wanna try something fun? Let's design a 2-minute 
'calm cash check-in' — not to fix anything, just to bring your nervous 
system back to ease."

(Notice: VIVA weaves in family + health context naturally)
```

---

## 📊 Data Sources

The RCO pulls from:

1. ✅ `user_profiles` - personal data, values, lifestyle
2. ✅ `assessment_results` - emotional quality by category
3. ✅ `vision_versions` - 12-category goals and desires
4. ✅ `journal_entries` - evidence, patterns, tone
5. ✅ `refinements` - AI interaction history
6. ✅ `vibrational_links` - cross-category connections (NEW)

---

## ⚡ Performance Optimization

### Current Implementation
- ✅ Edge runtime for minimal cold start
- ✅ Context caching (Supabase queries)
- ⏳ Redis snapshot cache (future enhancement)
- ⏳ Streaming output (future enhancement)

### Planned Enhancements
1. **Redis snapshot cache** - full member profile + last 5 turns
2. **Streaming responses** - never block UI
3. **Tone rewriter** - 50-100ms local pass for light tier
4. **Prompt router** - 3 tiers of reasoning (light → deep)

---

## 🚀 Implementation Status

### ✅ Completed
- [x] Vibrational links table schema
- [x] Rolling Context Object API (`/api/viva/context`)
- [x] Cross-category insight extraction
- [x] Theme detection from journals
- [x] Emotional trend calculation
- [x] Recent wins extraction

### ⏳ Next Steps
1. Integrate RCO into conversation flow
2. Add vibrational link detection logic
3. Implement Redis caching
4. Add streaming response support
5. Build tone rewriter module

---

## 📖 Example Context Output

```json
{
  "member_id": "user-123",
  "focus_category": "money",
  "related_categories": ["business", "health", "family"],
  "current_emotion": "stressed",
  "vibrational_links": ["security", "freedom", "balance"],
  "session_summary": "Overall vibration: building | 8 recent journal entries | Lifestyle: successful entrepreneur",
  "desired_state": "freedom + vitality",
  "recent_wins": [
    "Refined money vision",
    "Great workout this morning..."
  ],
  "top_themes": ["security", "creativity", "balance", "growth"],
  "emotional_trends": [
    { "category": "money", "trend": "declining", "score": 45 },
    { "category": "business", "trend": "rising", "score": 82 }
  ],
  "cross_category_insights": [
    {
      "category_a": "money",
      "category_b": "health",
      "connection": "security, discipline",
      "strength": 0.75
    }
  ],
  "profile_snapshot": {
    "lifestyle": "successful entrepreneur",
    "values": ["independence", "creativity", "family"],
    "priorities": ["business", "money", "health"]
  }
}
```

---

## 🎯 The Vision Realized

This architecture makes VIVA feel like:
- **A best friend** who remembers everything
- **A wise coach** who sees patterns
- **A natural conversationalist** who flows between topics
- **Lightning fast** responses under 2 seconds

All while staying **emotionally intelligent** and **vibrationally aware**.

---

*This is the holy grail: an AI that truly understands the interconnected nature of human experience.*
