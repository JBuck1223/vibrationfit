# Documentation Guidelines for AI Agents

**Last Updated:** January 18, 2025  
**Status:** Active

## Core Principle

**Only create docs when they provide lasting value. Avoid doc debt!**

## ⚡ AUTO-GENERATED DOCS

**We now generate docs FROM code, not manually:**

| Doc Type | How to Update | DO NOT |
|----------|---------------|---------|
| **Database Schema** | Run `npm run docs:schema` | ❌ Edit `docs/generated/SCHEMA.md` manually |
| **API Endpoints** | Run `npm run docs:api` | ❌ Edit `docs/generated/API_ENDPOINTS.md` manually |
| **Constants** | Run `npm run docs:constants` | ❌ Edit `docs/generated/CONSTANTS.md` manually |

**To regenerate all:** `npm run docs:generate`

**When to regenerate:**
- After running database migrations → `npm run docs:schema`
- After adding/modifying API routes → `npm run docs:api`
- After changing vision categories → `npm run docs:constants`

**Files in `docs/generated/` are gitignored** - they're built from source, not committed.

## ❌ NEVER Create These Docs

- **Status docs** ("COMPLETE", "SUCCESS", "STATUS", "FIXED") - use git commits instead
- **Duplicate docs** - update existing doc instead of creating new one
- **Temporary notes** - use comments in code or delete after task
- **Docs in project root** - always use appropriate `/docs/` subfolder
- **Dated docs** (e.g., "VIDEO_FIXES_2024-11-10.md") - use descriptive names instead

## ✅ When to Create Docs

- **Architecture decisions** that affect multiple features
- **Feature implementation guides** for complex systems
- **API documentation** for new endpoints
- **Expert guides** for agents to understand major systems
- **Technical decisions** that need explanation (like audits)

## 📂 Where to Put Docs

| Doc Type | Location | Examples |
|----------|----------|----------|
| **Architecture** | `docs/architecture/` | System design, data flow |
| **Features** | `docs/features/[feature-name]/` | Implementation guides |
| **Database** | `docs/database/` or `supabase/` | Schema, migrations |
| **VIVA/AI** | `docs/viva/` | Prompts, AI systems |
| **Design System** | `docs/design-system/` | UI components, patterns |
| **Technical Decisions** | `docs/technical/` | Audits, analyses |
| **Video/Storage** | `docs/video-system/`, `docs/storage/` | AWS, S3, processing |
| **Historical** | `docs/archived/YYYY-MM/` | Old docs with historical value |

## 📝 Doc Naming Conventions

✅ **Good Names:**
- `TOKEN_SYSTEM_ARCHITECTURE.md` - Describes what it is
- `LIFE_VISION_EXPERT_GUIDE.md` - Clear purpose
- `CATEGORY_KEY_HARDCODING_AUDIT.md` - Specific topic

❌ **Bad Names:**
- `TOKEN_COMPLETE.md` - Status doc
- `VIDEO_FIXES_2024-11-10.md` - Has date
- `VIVA_RESTRUCTURE_COMPLETE.md` - Status doc
- `IMPLEMENTATION_SUCCESS.md` - Status doc

## 🔄 Update vs Create

**Before creating a new doc, check if one exists:**

```bash
# Search for existing docs on topic
find docs -name "*token*" -o -name "*viva*"
```

**Update existing doc** if:
- Topic already has documentation
- You're improving/correcting information
- You're adding to existing feature

**Create new doc** only if:
- No existing doc covers this topic
- Starting completely new system/feature
- Topic deserves its own dedicated guide

## 🗄️ When to Archive

Move to `docs/archived/YYYY-MM/` when:
- Feature completely replaced
- Doc is outdated but has historical value
- System has moved on, but doc shows evolution

## 🗑️ When to Delete

Delete immediately if:
- Temporary build notes
- Status updates ("X is complete")
- Duplicate/redundant information
- Incorrect/misleading information

## 📋 Doc Headers

Every doc should have:

```markdown
# Document Title

**Last Updated:** Month Day, Year  
**Status:** Active | Archived | Deprecated  
**Replaces:** [Previous doc name if applicable]

[Brief description of what this doc covers]
```

## 🔍 Before Committing Docs

Ask yourself:
1. Will this doc still be useful in 3 months?
2. Is there already a doc on this topic I should update?
3. Is this in the right folder?
4. Does the filename describe WHAT it is, not its STATUS?
5. Am I creating this because it's truly needed, or just habit?

## 🎯 Goal

Keep docs lean, organized, and current. Every doc should earn its place.

