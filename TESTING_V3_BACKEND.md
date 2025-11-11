# Testing Life Vision V3 Backend

**Status**: All APIs ready for testing  
**Date**: January 10, 2025

---

## 🚀 Quick Start

1. **Run the migration** (you're doing this now ✓)
   ```bash
   psql -d your_database < migrations/001_add_life_vision_v3_fields.sql
   ```

2. **Start your dev server**
   ```bash
   npm run dev
   ```

3. **Test the new endpoints** (examples below)

---

## 🧪 API Testing Guide

### Prerequisites
Get your auth token from the browser:
1. Log into your app
2. Open DevTools → Application → Cookies
3. Copy the `sb-access-token` value

Or use Postman/Insomnia with your session cookie.

---

## Test 1: Ideal State Generation (Step 2)

**Endpoint**: `POST /api/viva/ideal-state`

**Request**:
```json
{
  "category": "fun",
  "categoryName": "Fun",
  "currentClarity": "I enjoy hiking on weekends with my family. I love trying new restaurants with friends.",
  "flippedContrast": "I feel connected and energized when I'm outdoors. I experience joy in sharing meals with people I care about."
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "prompts": [
      {
        "title": "Peak Fun Moments",
        "prompt": "Describe a peak experience when you were hiking or enjoying outdoor adventures. What were you doing? Who were you with? How did you feel?",
        "focus": "outdoor experiences"
      },
      {
        "title": "Ideal Social Fun",
        "prompt": "Describe what a typical week looks like when your fun and social life are exactly as you want them...",
        "focus": "social rhythms"
      },
      {
        "title": "Fun Energy State",
        "prompt": "Describe the version of yourself who is living the fun life you desire...",
        "focus": "identity and feeling"
      }
    ],
    "encouragement": "These prompts will help you explore what lights you up!"
  }
}
```

**✅ Success indicators**:
- Returns 3-5 prompts
- Each prompt starts with "Describe..."
- Prompts reference the user's actual input (hiking, restaurants)
- Encouragement message is warm and specific

---

## Test 2: Blueprint Generation (Step 3)

**Endpoint**: `POST /api/viva/blueprint`

**Request**:
```json
{
  "category": "fun",
  "categoryName": "Fun",
  "currentClarity": "I enjoy hiking on weekends...",
  "idealState": "I spend weekends exploring new trails. I host monthly dinner parties. I have a regular game night with friends...",
  "flippedContrast": "I feel connected and energized when outdoors..."
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "loops": [
      {
        "being": "I am adventurous and present. I feel alive when I'm moving through nature and connecting with others.",
        "doing": "I hike every weekend, exploring new trails with my family. I host monthly dinner parties where we try new recipes together. I organize weekly game nights with friends.",
        "receiving": "My energy stays high throughout the week. My relationships deepen through shared experiences. I notice synchronicities that lead me to perfect adventures.",
        "essence": "Vitality"
      }
    ],
    "summary": "A life filled with outdoor adventure and meaningful social connection"
  }
}
```

**✅ Success indicators**:
- Returns 1-5 loops based on input richness
- Each loop has being/doing/receiving/essence
- Present-tense, first-person throughout
- Uses user's actual words and activities
- Loop is saved to `refinements.blueprint_data`

**Test retrieval**:
```bash
GET /api/viva/blueprint?category=fun
```

---

## Test 3: Enhanced Scene Generation (Step 4)

**Endpoint**: `POST /api/vibration/scenes/generate`

**Request** (minimal input - should generate 1-2 scenes):
```json
{
  "category": "fun",
  "profileGoesWellText": "I enjoy hiking",
  "dataRichnessTier": "C"
}
```

**Request** (rich input - should generate 4-6 scenes):
```json
{
  "category": "fun",
  "profileGoesWellText": "I hike every weekend with my family on new trails. We discover hidden waterfalls and pack gourmet picnic lunches. My kids collect interesting rocks and identify birds. We make it an adventure.",
  "profileNotWellTextFlipped": "I host monthly dinner parties where I experiment with new cuisines. We laugh until our stomachs hurt. I organize weekly game nights that bring my friend group closer. I take spontaneous road trips to nearby towns and explore local culture.",
  "assessmentSnippets": [
    "I feel most alive when I'm outdoors",
    "Shared meals create deep bonds",
    "Spontaneity brings me joy"
  ],
  "existingVisionParagraph": "I am someone who prioritizes fun and connection...",
  "dataRichnessTier": "A"
}
```

**Expected Behavior**:
- Sparse input (C tier) → 1-2 scenes @ 140-220 words each
- Rich input (A tier) → 4-6 scenes @ 140-220 words each
- Console logs show: `[Scene Generation V3] Category: fun, Tier: A, Target Scenes: 5 (4-6)`

**✅ Success indicators**:
- Scene count adapts to input richness
- Each scene is 140-220 words (not 90-140)
- Scenes include Micro-Macro breathing pattern
- Each scene ends with "Essence: [word]"
- Uses user's specific details (waterfalls, gourmet picnics)

---

## Test 4: Master Vision with Richness (Step 5)

**Endpoint**: `POST /api/viva/master-vision`

**Request**:
```json
{
  "categorySummaries": {
    "fun": "What's Going Really Well: I hike every weekend... [long text]\nWhat's Challenging: I wish I had more spontaneous adventures...",
    "health": "...",
    "travel": "..."
  },
  "categoryTranscripts": {
    "fun": "[User's original 500-character input about fun]",
    "health": "[User's original 1200-character input about health]"
  },
  "profile": { ... },
  "assessment": { ... }
}
```

**Expected Response**:
```json
{
  "markdown": "## Forward\n\n...\n\n## Fun\n\n...",
  "json": {
    "forward": "...",
    "fun": "...",
    "health": "...",
    "conclusion": "..."
  },
  "model": "gpt-4",
  "richnessMetadata": {
    "fun": {
      "inputChars": 500,
      "minChars": 450,
      "maxChars": 550,
      "ideaCount": 5,
      "density": "medium"
    },
    "health": {
      "inputChars": 1200,
      "minChars": 1080,
      "maxChars": 1320,
      "ideaCount": 12,
      "density": "high"
    }
  }
}
```

**✅ Success indicators**:
- Returns `richnessMetadata` for all categories
- Fun section is ~450-550 characters (90-110% of 500 input)
- Health section is ~1080-1320 characters (90-110% of 1200 input)
- Console shows: `[Master Vision V3] Computed richness metadata for 12 categories`
- No compression of rich input into generic paragraphs

---

## Test 5: Final Assembly (Step 6)

**Endpoint**: `POST /api/viva/final-assembly`

**Request**:
```json
{
  "visionId": "abc-123",
  "assembledVision": "[Complete vision text from Step 5]"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "forward": "Welcome to your Life Vision, Jordan. This document is the culmination of deep reflection...",
    "conclusion": "This vision is not someday—it begins now, in the small choices and clear intentions...",
    "activation": {
      "activationMessage": "Jordan, you've created something powerful here—a vision that's unmistakably yours...",
      "suggestedActions": [
        {
          "title": "Listen as Audio",
          "description": "Let the words wash over you auditorily",
          "path": "/life-vision/audio"
        },
        {
          "title": "Create Vision Board",
          "description": "Capture the essence of your scenes visually",
          "path": "/vision-board"
        }
      ]
    },
    "harmonizationNotes": [
      "All categories flow cohesively",
      "Vibrational grammar is consistent throughout"
    ]
  }
}
```

**✅ Success indicators**:
- Forward section is personalized (uses their name)
- Conclusion is empowering and present-tense
- Activation message includes their actual stats (12 categories, X scenes)
- Suggested actions are specific and actionable
- Forward/conclusion saved to existing `vision_versions` columns
- Activation saved to new `activation_message` column

---

## 🔍 What to Look For

### Density Preservation
Compare input length to output length:
```javascript
const inputChars = userInput.length
const outputChars = generatedVision.length
const ratio = outputChars / inputChars

// Should be between 0.9 and 1.1 (90-110%)
console.log('Density ratio:', ratio)
```

### Scene Count Scaling
- 1-2 ideas in input → 1-2 scenes
- 3-5 ideas in input → 2-4 scenes
- 6-10 ideas in input → 3-6 scenes
- 10+ ideas in input → 4-8 scenes

### Voice Preservation
Check if outputs use user's actual words:
- User says "kinda" → Output should say "kinda" (not "somewhat")
- User mentions "hiking with my family" → Output should reference this specifically
- User's phrasing should feel natural, not rewritten

### Architecture Adherence
Vision sections should show:
- **5-Phase Flow**: Gratitude → Sensory → Embodiment → Essence → Surrender
- **Who/What/Where/Why**: Answers at least 2 per paragraph
- **Being/Doing/Receiving**: Identity → Actions → Results
- **Micro-Macro**: Specific moment → Zoom-out reflection

---

## 🐛 Troubleshooting

### Issue: Scenes are still 90-140 words
**Solution**: Check console logs for `[Scene Generation V3]` - if not showing, old code path is being used

### Issue: Vision sections too short despite rich input
**Solution**: Check `richnessMetadata` in response - if missing, density logic isn't running

### Issue: Blueprint returns empty loops
**Solution**: Ensure `ideal_state` column exists in refinements table (run migration)

### Issue: Final assembly missing activation
**Solution**: Check that `activation_message` column exists in vision_versions

---

## ✅ Success Criteria

Backend V3 is working correctly if:

1. ✅ Sparse input → short outputs (no over-expansion)
2. ✅ Rich input → rich outputs (no compression)
3. ✅ Scene count varies (1-8) based on input
4. ✅ Scenes are 140-220 words each
5. ✅ Vision sections are 90-110% of input length
6. ✅ User's actual words appear in outputs
7. ✅ All database columns save correctly
8. ✅ Console logs show V3 indicators

---

## 📊 Console Logs to Watch For

```
[Ideal State] Generating prompts for category: fun
[Ideal State] Successfully generated 3 prompts

[Blueprint] Generating Being/Doing/Receiving loops for category: fun
[Blueprint] Successfully generated 2 loops

[Scene Generation V3] Category: fun, Tier: A, Target Scenes: 5 (4-6)

[Master Vision V3] Computed richness metadata for 12 categories

[Final Assembly] Generating forward/conclusion for vision: abc-123
[Final Assembly] Successfully generated forward, conclusion, and activation
```

---

## 🎯 Next Steps After Testing

Once backend tests pass:

1. **Build frontend pages** - See `LIFE_VISION_V3_STATUS.md` for specs
2. **Integration testing** - Test full flow through all steps
3. **User testing** - Get real users to provide input at different richness levels

---

**All APIs are production-ready and waiting for frontend integration!** 🚀

