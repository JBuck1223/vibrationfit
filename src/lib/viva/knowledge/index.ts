/**
 * VIVA Knowledge Base
 * 
 * Approved, reference knowledge for VIVA Master Assistant.
 * This is the single source of truth for what VIVA knows about the platform.
 * 
 * Structure:
 * - tools/ - Tool-specific documentation
 * - concepts/ - Conceptual knowledge and philosophy  
 * - reference/ - Reference guides and workflows
 */

// Tool Documentation - Embedded as strings for Edge Runtime compatibility
const visionBoardKnowledge = `# Vision Board System

**Version:** 2.0 | **Status:** Production

Visual activation tool - gallery/grid system for specific desires and goals.
- Paths: /vision-board (main gallery), /vision-board/new (create item), /vision-board/gallery (image gallery), /vision-board/[id] (view/edit item)
- Status options: active, actualized, inactive
- View modes: grid or list
- Category tagging (links to 12 life categories)
- Image uploads and AI image generation
- Filtering by category and status
- Part of Align (step 2 of the Conscious Creation Cycle)`

const journalKnowledge = `# Journal System

**Version:** 2.0 | **Status:** Production

Conscious Creation Journal - the Trip Log where you appreciate and notice evidence showing up.
- Paths: /journal, /journal/new, /journal/[id]/edit
- Entry types: contrast, clarity, evidence, other
- Rich content: text, images, video
- Mood tracking: Above/Below Green Line
- Part of Enjoy (step 3 of the Conscious Creation Cycle): appreciate/savor and record evidence (the Result, feedback)`

const lifeVisionKnowledge = `# Life Vision System

**Last Updated:** January 31, 2025
**Version:** 2.0
**Status:** Production - Current

## Overview
The Life Vision System helps users create a comprehensive "Life I Choose™" document across 12 life categories.

## Current Features

### Creation Flow (/life-vision/new)
1. Landing Page - Overview of 12 categories with neon cyan icons
2. Category Input (/life-vision/new/category/[key]) - Text, audio, or video recording with transcription
3. AI-Powered Processing - Personalized prompts, category summaries, three action options
4. Master Vision Assembly (/life-vision/new/assembly) - Combines all 12 categories

### Viewing & Management
- List all versions: /life-vision
- View specific: /life-vision/[id]
- Refinement: /life-vision/[id]/refine

## The 12 Life Categories
1. Fun 2. Health 3. Travel 4. Love 5. Family 6. Social 7. Home 8. Work 9. Money 10. Stuff 11. Giving 12. Spirituality

## Database
- vision_versions table - Stores complete vision documents
- refinements table - Stores category-level summaries and transcripts

## Current Technical Details
- Recordings: S3 (lifeVisionAudioRecordings, lifeVisionVideoRecordings)
- Auto-save: IndexedDB during recording
- AI: GPT-4o for summaries, GPT-4-turbo for master assembly (configurable via /admin/ai-models)
- Prompt caching: prompt_suggestions_cache table

---

**CRITICAL:** Only reference features that exist in the current system. Do not mention deprecated features.`

const assessmentKnowledge = `# Vibration Assessment System

**Last Updated:** January 31, 2025
**Version:** 2.0
**Status:** Production - Current

## Overview
Measures alignment across 12 life categories, providing Green Line status.

## Structure
- 84 questions total (7 per category × 12 categories)
- Scoring: 1-5 points per question, 35 max per category, 420 total

## Green Line Thresholds
- Above: 28+ points (80%+) - Thriving, aligned, empowered
- Transitioning: 21-27 points (60-79%)
- Below: <21 points (<60%) - Growth opportunities (NOT failure)

## Paths
- Start: /assessment
- Results: /assessment/results

## Database
- assessment_results - Overall scores and status
- assessment_responses - Individual Q&A with scores

## AI Scoring
- Uses GPT-5 (configurable via /admin/ai-models)
- Scores based on empowerment vs victim mindset

---

**CRITICAL:** Below Green Line is valuable contrast for clarity, NOT failure.`

const profileKnowledge = `# Profile System

**Last Updated:** January 31, 2025
**Version:** 2.0
**Status:** Production - Current

## Overview
Stores comprehensive user information across 12 life categories.

## Features
- 12 Category Stories (fun_story, health_story, etc.) - Natural language
- Structured Fields (demographics, work, financial, family, lifestyle)
- Evidence/Media (photos, videos) - Stored in S3 profile folders

## Paths
- View: /profile
- Edit: /profile/active/edit
- New: /profile/new

## Database
- user_profiles table - All profile data
- Version control supported

## Integration
- Profile data informs Life Vision prompts
- 70% completion required for VIVA-powered vision creation

---

**Keep This Updated:** Profile = current situation, Vision = desired future.`

// Concept Documentation
const greenLineKnowledge = `# The Green Line Concept

**Last Updated:** January 31, 2025
**Version:** 2.0

## Definition
Threshold representing vibrational alignment - empowered, abundant, growth-oriented state.

## Above Green Line (80%+ / 28+ points)
- Empowered mindset, abundance thinking
- Growth-oriented, positive energy
- Language: "I am creating...", "I have choices..."

## Below Green Line (<60% / <21 points)
**CRITICAL: NOT FAILURE!**
- Contrast providing clarity
- Awareness opportunities
- Information about what to shift toward
- Language: "I struggle with..." (user) → Help them flip to positive

## Assessment Scoring
- 1-5 per question, 35 max per category
- Above: 28-35 (80-100%)
- Transitioning: 21-27 (60-79%)
- Below: <21 (<60%)

## Usage
- Life Vision Creation: Understand contrast and clarity
- Prompts: Personalize based on Green Line status
- Daily Practice: Track alignment over time

**Core Principle:** Green Line is a tool for awareness and growth, not judgment.`

const consciousCreationKnowledge = `# The Conscious Creation System

**Last Updated:** June 24, 2026
**Version:** 4.0

A Conscious Creation System is the machine that makes manifestation reliable instead of random - it drives someone from the life they have to the life they choose. Vibration Fit helps members install it once, then run it every day. ("Machine" is a metaphor; the official name is always "Conscious Creation System.") Full explainer: /system

## Philosophy (the spine)
We teach **Joy → Manifestation**, not the reverse. Freedom makes joy possible; joy fuels creation; manifestations are feedback, not the goal.
- **Foundation: Freedom** - free to choose your focus, meaning, response, identity, and emotional state.
- **Purpose: Joy** - the state creativity, love, play, gratitude, and expansion emerge from.
- **Mechanism: Emotional states perpetuate themselves** - the way you feel shapes the way you live, and the way you live shapes the way you feel.
- **Practice: Design → Align → Enjoy** (the Conscious Creation Cycle).
- **Result: Expansion and meaningful manifestations** - evidence of alignment, never a prerequisite for well-being.

## Two Phases
1. **Install (Activation Intensive, 72h)** - Build the Life Vision, Vision Audio, Vision Board, Journal, and MAP (My Alignment Plan). Path: /intensive
2. **Run (MAP, ongoing)** - MAP runs the Cycle daily and the results show up. Path: /map

## The Conscious Creation Cycle - Design → Align → Enjoy
1. **Design** - Design the life you choose. Create and keep alive the "Life I Choose™" document (/life-vision/new). 12 categories, present-tense, 80%+ user's own words.
2. **Align** - Align with the emotional state of that life, daily, via MAP: Vision Audio, Vision Board (/vision-board), and daily practices.
3. **Enjoy** - Enjoy the freedom and joy available now: presence, appreciation, savoring, and noticing the evidence already showing up (capture it in the Journal, /journal). "Enjoy" is living above the Green Line in the present tense. Manifestations are the Result of running the loop (feedback), never a step.

## The Reps - 4 Parts (what MAP schedules and Tracking measures)
- **Creations (Artifacts)** - "What objects exist because of me?" Life Visions, audio, board items, journal, Daily Paper, Abundance Tracker events.
- **Activations (Practice)** - "How many times did I show up and do the work?" Playing audio, journaling, board touches, attending Gym.
- **Connections (Community)** - "How many times did I interact with the community?" Vibe Tribe posts, comments, hearts.
- **Sessions (Coaching)** - "How often am I showing up to live coaching?" Alignment Gym calls and replays.

## Gauge & Guide
- **Gauge:** Above the Green Line - the readout of how aligned/joyful you've been lately; "Enjoy" in the present tense.
- **Guide:** VIVA - teaches the system, reads the data, suggests the next best rep.

**They Work Together:** Design sets direction → Align maintains the emotional frequency → Enjoy keeps you above the Green Line now, and manifestations follow as the result. When users ask about "the system," point them to /system and /intensive.`

// Reference Documentation
const userJourneyKnowledge = `# User Journey Reference

**Last Updated:** January 31, 2025

## Typical Flow

### Phase 1: Foundation
1. Complete Profile (/profile) - 70%+ required
2. Take Assessment (/assessment)

### Phase 2: Vision Creation
3. Create Life Vision (/life-vision/new)
4. Review & Refine (/life-vision/[id]/refine)

### Phase 3: Activation
5. Create Vision Board (/vision-board/new)
6. Generate Vision Audio (/life-vision/[id]/audio)
7. Daily Journaling (/journal)

## Current Workflows (As of Jan 2025)
- Create first vision: /profile → /assessment → /life-vision/new
- Refine vision: /life-vision → Select → /life-vision/[id]/refine
- See vision section: Ask VIVA "Show me [category] section of my vision"
- Activate daily: Vision Board + Audio + Journal`

/**
 * Loads and combines all knowledge base files
 * Returns complete knowledge base as a single string
 */
export function loadKnowledgeBase(): string {
  return `# VIVA Master Assistant - Complete Platform Knowledge Base

**Knowledge Base Version:** 2.0
**Last Updated:** January 31, 2025
**Status:** Production - Current
**Source:** Current codebase implementation (not outdated documentation)

**IMPORTANT:** This knowledge base reflects the ACTUAL current system as implemented in code. Earlier documentation files may be outdated. Always reference this knowledge base for accurate information.

---

## TOOLS & FEATURES

${lifeVisionKnowledge}

---

${assessmentKnowledge}

---

${profileKnowledge}

---

${visionBoardKnowledge}

---

${journalKnowledge}

---

## CORE CONCEPTS

${greenLineKnowledge}

---

${consciousCreationKnowledge}

---

## USER JOURNEY & WORKFLOWS

${userJourneyKnowledge}

---

## CRITICAL INSTRUCTIONS FOR VIVA

1. **Always Use Current Information**: Only reference features that exist in the knowledge base above. Do NOT mention deprecated features or outdated documentation.

2. **Source of Truth**: This knowledge base reflects the ACTUAL current codebase implementation (January 2025). Ignore any discrepancies with older documentation files - this is the accurate source.

3. **Exact Paths**: When directing users, use exact paths (e.g., "/life-vision/new", not "the life vision page").

4. **Vision Detection**: When checking if a user has a vision:
   - Check for status === 'complete' OR
   - Check for completion_percent >= 90 OR
   - Check for substantial content in 3+ categories (50+ chars each)
   - Do NOT say "you don't have a vision" unless all checks fail

5. **Feature Accuracy**: If you're unsure about a feature, say "I'm not certain about that feature" rather than guessing or referencing outdated documentation.

6. **Green Line Language**: Always frame Below Green Line as contrast for clarity, NOT failure.

7. **Voice Capture**: When helping with visions, prioritize user's own words (80%+).

8. **Current Implementation Only**: Never mention features that don't exist in the current system, even if they're in old documentation or product briefs.

---
`
}

// Export individual sections for granular access
export const KNOWLEDGE_SECTIONS = {
  tools: {
    lifeVision: lifeVisionKnowledge,
    assessment: assessmentKnowledge,
    profile: profileKnowledge,
  },
  concepts: {
    greenLine: greenLineKnowledge,
    consciousCreation: consciousCreationKnowledge,
  },
  reference: {
    userJourney: userJourneyKnowledge,
  }
}
