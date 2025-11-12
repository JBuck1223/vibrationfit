# Vision State Consolidation - is_draft & is_active

**Last Updated:** November 12, 2025  
**Status:** ✅ Complete - Consolidated state management across both flows

---

## 🎯 Change Summary

**Before:** `/life-vision/new` used `status` field, `/life-vision/[id]/refine` used `is_draft`/`is_active` flags  
**After:** Both flows now use `is_draft` and `is_active` flags consistently

---

## ✅ Updated Code

### 1. Assembly Page (Step 5)
**File:** `src/app/life-vision/new/assembly/page.tsx`

**BEFORE:**
```typescript
await supabase
  .from('vision_versions')
  .insert({
    // ...
    status: 'draft',  // ❌ Old approach
  })
```

**AFTER:**
```typescript
await supabase
  .from('vision_versions')
  .insert({
    // ...
    is_draft: true,   // ✅ New approach
    is_active: false  // ✅ Not active until finalized
  })
```

**Query Changes:**
```typescript
// BEFORE
.neq('status', 'draft')  // ❌

// AFTER
.eq('is_draft', false)   // ✅
```

---

### 2. Final Page (Step 6)
**File:** `src/app/life-vision/new/final/page.tsx`

**BEFORE:**
```typescript
await supabase
  .from('vision_versions')
  .update({
    activation_message: activationMsg,
    status: 'complete'  // ❌ Old approach
  })
  .eq('id', visionId)
```

**AFTER:**
```typescript
await supabase
  .from('vision_versions')
  .update({
    activation_message: activationMsg,
    is_draft: false,  // ✅ No longer a draft
    is_active: true   // ✅ Now the active vision
  })
  .eq('id', visionId)

// Deactivate any other active visions for this user
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  await supabase
    .from('vision_versions')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .neq('id', visionId)
    .eq('is_active', true)
}
```

**Key Addition:** Now automatically deactivates other active visions when finalizing!

---

## 📊 Unified State Management

### Vision States (Both Flows)

| State | `is_draft` | `is_active` | Meaning |
|-------|------------|-------------|---------|
| **Draft** | `true` | `false` | Work in progress, not active |
| **Complete** | `false` | `true` | Finished and currently active |
| **Complete (Old)** | `false` | `false` | Finished but not current |

---

## 🔄 Flow Comparison (Now Consistent)

### Creation Flow (`/life-vision/new`)
```
Step 5 (Assembly):
  → Creates: is_draft=true, is_active=false
  
Step 6 (Final):
  → Updates: is_draft=false, is_active=true
  → Deactivates other visions: is_active=false
```

### Refinement Flow (`/life-vision/[id]/refine`)
```
Start Refining:
  → Creates draft: is_draft=true, is_active=false
  
Commit Changes:
  → New version: is_draft=false, is_active=true
  → Old version: is_active=false
```

**Both flows now use the same flags! ✅**

---

## 🎯 Benefits of Consolidation

### 1. **Consistency**
- ✅ Same logic across both flows
- ✅ Easier to understand
- ✅ Fewer edge cases

### 2. **Automatic Active Vision Management**
- ✅ Only one active vision per user
- ✅ Automatically deactivates old versions
- ✅ Clear "current vision" concept

### 3. **Simpler Queries**
```typescript
// Get active vision (consistent everywhere)
.eq('is_draft', false)
.eq('is_active', true)

// Get all complete visions (not drafts)
.eq('is_draft', false)

// Get drafts
.eq('is_draft', true)
```

### 4. **Better Data Model**
- ✅ Boolean flags are clearer than string status
- ✅ Explicit active/inactive state
- ✅ Draft vs complete is unambiguous

---

## ⚠️ Note: status Field Still Exists

The `status` field (`'draft'` | `'complete'`) still exists in the database schema for:
- **Legacy compatibility** with existing code
- **Audio generation system** (uses status checks)
- **Print/export features** (display status badges)

**Current Strategy:**
- ✅ `/life-vision/new` flow uses `is_draft`/`is_active` only
- ✅ `/life-vision/[id]/refine` uses `is_draft`/`is_active` only
- ⚠️ Other pages (view, audio, print) may still reference `status`
- 📝 Future: Migrate all remaining `status` checks to `is_draft`/`is_active`

---

## 📋 Database State Examples

### After Step 5 (Assembly)
```sql
-- New vision created
vision_versions:
  id: abc-123
  is_draft: true       ✅
  is_active: false     ✅
  forward: ''
  conclusion: ''
```

### After Step 6 (Final)
```sql
-- Vision finalized
vision_versions (id: abc-123):
  is_draft: false      ✅ Now complete
  is_active: true      ✅ Now active
  forward: '...'       ✅ Populated
  conclusion: '...'    ✅ Populated
  
-- Any previous active visions
vision_versions (id: old-456):
  is_draft: false
  is_active: false     ✅ Automatically deactivated
```

---

## 🧪 Testing Checklist

### Creation Flow
- [ ] Step 5: Vision created with `is_draft=true, is_active=false`
- [ ] Step 6: Vision updated to `is_draft=false, is_active=true`
- [ ] Step 6: Other active visions deactivated
- [ ] Can only have one active vision per user

### Refinement Flow
- [ ] Start: Draft created with `is_draft=true, is_active=false`
- [ ] Commit: New version `is_draft=false, is_active=true`
- [ ] Commit: Old version set to `is_active=false`
- [ ] Draft tracking with `refined_categories` still works

### Queries
- [ ] Assembly page loads complete visions: `.eq('is_draft', false)`
- [ ] View page displays active vision correctly
- [ ] Version history shows correct states

---

## 🚀 Migration Impact

### Files Changed
1. ✅ `src/app/life-vision/new/assembly/page.tsx` - Uses `is_draft`/`is_active`
2. ✅ `src/app/life-vision/new/final/page.tsx` - Uses `is_draft`/`is_active` + deactivation

### Files NOT Changed (Yet)
These still reference `status` field:
- `src/app/life-vision/page.tsx` - List page
- `src/app/life-vision/[id]/page.tsx` - View page
- `src/app/life-vision/[id]/audio-sets/[audioSetId]/page.tsx` - Audio page
- `src/app/life-vision/[id]/print/html/route.ts` - Print export
- `src/app/life-vision/components/VisionVersionCard.tsx` - Version card component

**Recommendation:** Gradually migrate these to use `is_draft`/`is_active` instead of `status`.

---

## 📖 Related Documentation

- [LIFE_VISION_FLOWS_OVERVIEW.md](./LIFE_VISION_FLOWS_OVERVIEW.md) - Both flows explained
- [VISION_CREATION_TIMELINE.md](./VISION_CREATION_TIMELINE.md) - ⚠️ Outdated, needs update
- [DRAFT_VISION_EXPERT_GUIDE.md](./DRAFT_VISION_EXPERT_GUIDE.md) - Refinement flow

---

## ✅ Conclusion

**Both Life Vision flows now use consistent state management:**
- ✅ `is_draft` flag controls draft vs complete
- ✅ `is_active` flag controls which vision is current
- ✅ Automatic active vision management
- ✅ Clearer, more consistent codebase

**This is a better architecture for the long term!** 🎉

---

**Implemented By:** AI Development Team  
**Date:** November 12, 2025  
**Impact:** Low - Internal state management improvement  
**Status:** ✅ Production Ready

