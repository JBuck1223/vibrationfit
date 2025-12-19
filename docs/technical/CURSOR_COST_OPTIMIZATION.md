# Cursor Cost Optimization Guide

**Last Updated:** January 18, 2025  
**Status:** Active

## 🎯 Understanding Cursor Token Usage

### Yes, Agents Use Tokens for ALL Outputs
- ✅ Every agent response counts toward your token usage
- ✅ Both input (context) and output (responses) consume tokens
- ✅ The `.cursorrules` file is included in EVERY agent conversation
- ✅ Large files in your workspace can be auto-indexed and included in context

## 💰 Your Current Situation

**Plan:** $200 Ultra Plan  
**Overage:** $400  
**Total:** $600/month

**This suggests:**
- ~$200 in included tokens (Ultra plan)
- ~$400 in overage (likely 2-3x your plan limit)
- High token usage from context + outputs

## 🔍 Major Cost Drivers

### 1. `.cursorrules` File (596 lines)
**Impact:** HIGH - Included in every agent conversation

**Current size:** ~596 lines = ~15,000-20,000 tokens per conversation

**Optimization:**
- Move detailed examples to separate reference files
- Keep only essential rules in `.cursorrules`
- Reference external docs instead of embedding full content

### 2. Project Root Markdown Files (28 files)
**Impact:** MEDIUM - May be auto-indexed

**Files that should move:**
- Status docs (COMPLETE, SUCCESS, FIXED) → Delete or archive
- Implementation guides → `docs/features/`
- Technical docs → `docs/technical/`

### 3. Large Generated Docs
**Impact:** MEDIUM - Auto-indexed if in workspace

**Files to exclude:**
- `docs/generated/SCHEMA.md` (58KB) - Already gitignored, but may be indexed
- Large changelogs in `node_modules/` (should be ignored)

## ✅ Optimization Strategies

### Strategy 1: Optimize `.cursorrules` (HIGHEST IMPACT)

**Current:** 596 lines with full examples and details  
**Target:** ~200-300 lines with references

**Action Plan:**
1. Extract detailed examples to `docs/agent-guides/`
2. Keep only essential rules in `.cursorrules`
3. Use references: "See `docs/agent-guides/DESIGN_SYSTEM.md` for component patterns"

**Expected Savings:** 50-70% reduction in context size per conversation

### Strategy 2: Clean Up Project Root

**Move to appropriate folders:**
```bash
# Status docs → Delete (use git commits instead)
rm *_COMPLETE.md *_FIX.md *_STATUS.md

# Implementation guides → docs/features/
mv *_IMPLEMENTATION.md docs/features/
mv *_GUIDE.md docs/guides/

# Technical docs → docs/technical/
mv *_AUDIT.md docs/technical/
```

**Expected Savings:** 20-30% reduction in auto-indexed context

### Strategy 3: Use `.cursorignore` File

Create `.cursorignore` to exclude:
```
# Large generated docs
docs/generated/

# Archive folders
docs/archived/
supabase/archive/

# Temporary files
temp/
*.dump
backup_*.sql

# Large node_modules docs (already in .gitignore, but ensure Cursor ignores)
node_modules/**/*.md
```

### Strategy 4: Optimize Agent Usage Patterns

**Do:**
- ✅ Use focused questions instead of broad "explain everything" requests
- ✅ Reference specific files: "Look at `src/lib/viva/chat.ts` line 45"
- ✅ Break large tasks into smaller, focused requests
- ✅ Use codebase search before asking agents to read entire files

**Don't:**
- ❌ Ask agents to "read the entire codebase"
- ❌ Request full file dumps in responses
- ❌ Have agents generate large documentation files
- ❌ Use agents for simple lookups (use grep/search instead)

### Strategy 5: Use Cursor Settings

**In Cursor Settings:**
1. **Context Window:** Set to "Smart" or "Focused" (not "Full")
2. **Auto-indexing:** Disable for large folders (`node_modules`, `docs/generated/`)
3. **Codebase Indexing:** Limit to `src/` and `supabase/migrations/` only

## 📊 Expected Impact

| Optimization | Current | Optimized | Savings |
|--------------|---------|-----------|---------|
| `.cursorrules` | 596 lines | 200-300 lines | 50-70% |
| Root markdown files | 28 files | 5-10 files | 20-30% |
| Context per conversation | ~50K tokens | ~15-20K tokens | 60-70% |
| **Monthly cost** | **$600** | **$200-300** | **50-70%** |

## 🚀 Quick Wins (Do These First)

1. **Extract `.cursorrules` examples** → Move to `docs/agent-guides/`
2. **Delete status docs** → `*_COMPLETE.md`, `*_FIX.md` files
3. **Move implementation guides** → `docs/features/`
4. **Create `.cursorignore`** → Exclude large generated files
5. **Use focused questions** → Reference specific files/line numbers

## 📝 Monitoring

**Track your usage:**
- Check Cursor billing dashboard weekly
- Monitor token usage per conversation
- Identify which types of requests consume most tokens

**Signs you're optimizing well:**
- ✅ Conversations complete faster
- ✅ More focused, relevant responses
- ✅ Lower monthly overage
- ✅ Better agent performance (less context = better focus)

## 🔄 Maintenance

**Monthly:**
- Review and clean up temporary docs
- Archive old implementation guides
- Update `.cursorignore` if new large files appear
- Check if `.cursorrules` has grown again

**Quarterly:**
- Audit project root for new markdown files
- Review agent-guides for consolidation opportunities
- Update optimization strategies based on usage patterns

---

## Questions?

- **"Should I delete old docs?"** → Yes, if they're status updates. Archive if they have historical value.
- **"Will this affect agent quality?"** → No, focused context often improves quality.
- **"How do I know if it's working?"** → Check your next Cursor bill - should see 50-70% reduction.

