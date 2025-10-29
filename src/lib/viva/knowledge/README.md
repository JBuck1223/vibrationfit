# VIVA Knowledge Base Architecture

**Single Source of Truth** for VIVA Master Assistant

This directory contains the approved, reference knowledge for VIVA Master Assistant. All files here are loaded and combined into VIVA's system prompt to ensure accurate, current information.

**⚠️ CRITICAL:** This knowledge base is built from the **current codebase implementation** (as of January 2025), not from outdated documentation. Earlier docs (PRODUCT_BRIEF.md, guides/) may contain outdated information. This knowledge base reflects what actually exists and works right now.

## 📁 Directory Structure

```
knowledge/
├── tools/              # Tool-specific documentation (markdown files for reference)
│   ├── life-vision.md
│   ├── assessment.md
│   ├── profile.md
│   ├── vision-board.md
│   ├── journal.md
│   └── ...
├── concepts/           # Conceptual knowledge and philosophy
│   ├── green-line.md
│   ├── conscious-creation.md
│   └── ...
├── reference/          # Reference guides and workflows
│   ├── user-journey.md
│   └── ...
├── index.ts           # Knowledge loader (embeds all knowledge as strings for Edge Runtime)
└── README.md          # This file
```

## ⚙️ How It Works

1. **Markdown Files** (`tools/`, `concepts/`, `reference/`) - Human-readable reference documentation
2. **index.ts** - Embeds knowledge as TypeScript strings (Edge Runtime compatible)
3. **API Integration** - `loadKnowledgeBase()` called in `/api/viva/chat` to build system prompt

**Note:** The markdown files serve as reference documentation. The actual knowledge VIVA uses is embedded in `index.ts` as strings for Edge Runtime compatibility.

## ✏️ Adding/Updating Knowledge

### Current Process (Recommended)

1. **Edit `index.ts`** - Update the embedded knowledge strings
2. **Update corresponding markdown file** - Keep markdown docs in sync
3. **Update version/date** - Mark changes clearly
4. **Test** - Verify VIVA uses the new information correctly

### To Add a New Tool:
1. Add knowledge string to `index.ts` (in `loadKnowledgeBase()` function)
2. Create corresponding markdown file in `tools/`
3. Add to `KNOWLEDGE_SECTIONS` export if needed for granular access

### To Add a Concept:
1. Add concept string to `index.ts`
2. Create markdown file in `concepts/`
3. Reference it in related tool documentation

### To Update Existing Knowledge:
1. **Update the string in `index.ts`** (this is what VIVA actually uses)
2. Update the corresponding markdown file for documentation
3. Change version number and date
4. Test that VIVA responses are accurate

## 🎯 Key Principles

1. **Current Features Only** - Document what exists NOW, not what's planned
2. **Exact Paths** - Always include exact routes (e.g., `/life-vision/new`)
3. **No Deprecated Features** - Remove outdated information immediately
4. **Version Tracking** - Update dates/versions when making changes
5. **Edge Runtime Compatible** - All knowledge must be embedded as strings (no file reading at runtime)

## 📝 Knowledge File Template

When creating new knowledge files (markdown for docs), use this structure:

```markdown
# Tool/Concept Name

**Last Updated:** [Date]
**Version:** [Version Number]
**Status:** Production | Deprecated | In Development

## Overview
[Brief description]

## Current Features (As of [Date])
[What exists NOW - be very specific]

## User Paths
[Exact routes: /exact/path/here]

## Database Schema
[If relevant: table names and key fields]

## Integration Points
[How it connects to other tools]

## Common Questions
[FAQ section]

---
**CRITICAL:** Keep this file synchronized with the embedded version in index.ts!
```

## 🔍 Vision Detection Fix

**Updated Logic (January 2025):**
- VIVA now checks multiple criteria for vision existence:
  1. `status === 'complete'`
  2. `completion_percent >= 90`
  3. Substantial content in 3+ categories (50+ chars each)
- Uses `maybeSingle()` to handle no-vision cases gracefully
- Does NOT say "you don't have a vision" unless all checks fail

## 🚀 Usage in Code

```typescript
import { loadKnowledgeBase } from '@/lib/viva/knowledge'

// Load complete knowledge base
const knowledge = loadKnowledgeBase()

// Use in system prompt
const systemPrompt = `...${knowledge}...`
```

---

**Maintained By:** Platform Team  
**Review Schedule:** After each major feature release or monthly  
**Last Major Update:** January 31, 2025

**CRITICAL:** When features change, update BOTH:
1. The embedded strings in `index.ts` (what VIVA uses)
2. The markdown files (documentation)
