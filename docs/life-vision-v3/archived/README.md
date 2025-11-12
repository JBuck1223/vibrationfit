# Archived Life Vision Docs

**These documents represent old implementations or migration records.**

---

## 📁 Contents

### REFINEMENT_SYSTEM_EXPERT_GUIDE_OLD.md
**Status:** ❌ Outdated  
**Replaced By:** `DRAFT_VISION_EXPERT_GUIDE.md`

**Why Archived:**
- Documents the old `refinements` table approach
- System now uses `vision_versions` with `is_draft` flag
- Draft visions are first-class entities, not separate refinements

**What Changed:**
- ❌ **OLD:** Refinements stored in separate `refinements` table with `output_text` column
- ✅ **NEW:** Drafts stored in `vision_versions` with `is_draft=true` and `refined_categories` tracking

**When to Reference:**
- Historical context only
- Understanding the migration
- Debugging legacy data

**Current Documentation:**
- `DRAFT_VISION_EXPERT_GUIDE.md` - Current system
- `REFINED_CATEGORIES_TRACKING_GUIDE.md` - Tracking system
- `DRAFT_VISION_IMPLEMENTATION_SUMMARY.md` - Implementation details

---

**Last Updated:** November 12, 2025  
**Reason:** Draft vision system migration completed

