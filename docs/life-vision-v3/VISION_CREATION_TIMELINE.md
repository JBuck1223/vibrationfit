# Vision Creation Timeline - /life-vision/new Flow

**Last Updated:** November 12, 2025  
**Status:** ✅ Current - Documents when draft/active vision is created

---

## 🎯 Quick Answer

**The vision gets created in two stages:**

1. **Step 5 (Assembly):** Vision created with `is_draft: true, is_active: false` ⚠️
2. **Step 6 (Final):** Vision updated to `is_draft: false, is_active: true` ✅

**Important:** Both `/life-vision/new` (creation) and `/life-vision/[id]/refine` (refinement) now use `is_draft` and `is_active` flags consistently!

---

## 📋 Detailed Timeline

### **Steps 1-4: Category State Storage**
**Pages:** 
- Step 1: `/life-vision/new/category/[key]` (Clarity)
- Step 2: `/life-vision/new/category/[key]/imagination` (Ideal State)
- Step 3: `/life-vision/new/category/[key]/blueprint` (Being/Doing/Receiving)
- Step 4: `/life-vision/new/category/[key]/scenes` (Visualization)

**Database:** `life_vision_category_state` table

**What Happens:**
- ✅ User progresses through 12 categories
- ✅ Each step saves to `life_vision_category_state`:
  - `transcript` (Step 1)
  - `ai_summary` (Step 1)
  - `ideal_state` (Step 2)
  - `blueprint_data` (Step 3)
- ✅ Scenes saved to `vibration_scenes` (Step 4)
- ❌ **No vision_versions entry yet**

**Status:** Data collection phase

---

### **Step 5: Master Assembly** 🎨
**Page:** `/life-vision/new/assembly`

**What Happens:**
1. User clicks "Assemble Vision"
2. Fetches all 12 categories from `life_vision_category_state`
3. Calls `/api/viva/master-vision` to generate complete vision
4. **CREATES `vision_versions` entry** with:
   ```typescript
   {
     user_id: user.id,
     version_number: (latestVersion + 1),
     fun: '...',
     health: '...',
     travel: '...',
     // ... all 12 categories
     forward: '',           // Empty initially
     conclusion: '',        // Empty initially
     is_draft: true,        // ⚠️ DRAFT status
     is_active: false,      // ⚠️ Not active yet
     completion_percent: 100,
     richness_metadata: {...}
   }
   ```

**Important Fields:**
- ✅ `is_draft: true` - Not complete yet
- ✅ `is_active: false` - Not active yet
- ✅ All 12 categories populated
- ❌ `forward` and `conclusion` are empty

**Database State After Step 5:**
```sql
vision_versions:
  id: abc-123
  is_draft: true
  is_active: false
  forward: ''
  conclusion: ''
  activation_message: NULL
```

**Why Draft?**
- Vision content is complete
- But forward/conclusion/activation not added yet
- User proceeds to Step 6 to finalize

---

### **Step 6: Final Polish** ✨
**Page:** `/life-vision/new/final`

**What Happens:**
1. Page loads existing draft vision by ID
2. User selects perspective (I/My vs We/Our)
3. Pre-written bookend templates loaded:
   - Forward (based on woo level + perspective)
   - Conclusion (based on woo level + perspective)
4. User can edit forward/conclusion
5. User clicks "Complete Vision"
6. **UPDATES `vision_versions` entry** with:
   ```typescript
   {
     forward: editedForward,
     conclusion: editedConclusion,
     perspective: 'singular' or 'plural',
     activation_message: 'Your vision is ready...',
     is_draft: false,        // ✅ NOW COMPLETE
     is_active: true         // ✅ NOW ACTIVE
   }
   ```
7. **DEACTIVATES other active visions** for this user:
   ```typescript
   // Automatic deactivation
   await supabase
     .from('vision_versions')
     .update({ is_active: false })
     .eq('user_id', user.id)
     .neq('id', visionId)
     .eq('is_active', true)
   ```

**Database State After Step 6:**
```sql
-- This vision (newly finalized)
vision_versions (id: abc-123):
  is_draft: false           ✅ Updated
  is_active: true           ✅ Now active
  forward: '...'            ✅ Populated
  conclusion: '...'         ✅ Populated
  perspective: 'singular'   ✅ Set
  activation_message: '...' ✅ Set

-- Any previous active visions (automatically deactivated)
vision_versions (id: old-456):
  is_draft: false
  is_active: false          ✅ Auto-deactivated
```

**Result:**
- ✅ Vision is now **complete and active**
- ✅ Only one active vision per user
- ✅ User redirected to `/life-vision/[id]` (view page)
- ✅ Vision is fully viewable/downloadable

---

## 🔍 Key Differences: Creation vs Refinement

### `/life-vision/new` (Creation Flow)
**Uses:**
- ✅ `is_draft` flag (`true` → `false`)
- ✅ `is_active` flag (`false` → `true`)

**Flow:**
```
Steps 1-4: Build in life_vision_category_state
↓
Step 5: Create vision_versions (is_draft=true, is_active=false)
↓
Step 6: Update to (is_draft=false, is_active=true)
       + Deactivate other active visions
↓
User views complete, active vision
```

---

### `/life-vision/[id]/refine` (Refinement Flow)
**Uses:**
- ✅ `is_draft` flag (`true` while editing)
- ✅ `is_active` flag (`false` for drafts, `true` when committed)
- ✅ `refined_categories` JSONB array

**Flow:**
```
Start with existing active vision
↓
Create draft copy (is_draft=true, is_active=false)
↓
User edits categories
↓
Commit: New version (is_draft=false, is_active=true)
       Old version (is_active=false)
```

---

## 📊 Database Column Usage

| Column | Creation Flow (`/new`) | Refinement Flow (`/refine`) |
|--------|------------------------|----------------------------|
| `is_draft` | ✅ true → false | ✅ true → false |
| `is_active` | ✅ false → true | ✅ false → true |
| `refined_categories` | ❌ Not set | ✅ JSONB array |
| `perspective` | ✅ Set in Step 6 | ✅ Can be updated |
| `forward` | ✅ Set in Step 6 | ✅ Can be edited |
| `conclusion` | ✅ Set in Step 6 | ✅ Can be edited |

**Note:** `status` field still exists for legacy compatibility but is no longer used in either flow.

---

## 🎯 Important Notes

### 1. **Unified Draft System ✅**
- **Both Flows:** Use `is_draft` and `is_active` flags consistently
- **Creation Flow:** `is_draft: true` → `false`, `is_active: false` → `true`
- **Refinement Flow:** `is_draft: true` → `false`, `is_active: false` → `true`

### 2. **No Version Conflicts**
- Creation flow creates NEW visions
- Refinement flow creates NEW versions of existing visions
- Both increment `version_number`

### 3. **When Is Vision "Active"?**
- **Both Flows:** When `is_draft=false` AND `is_active=true`
- **Automatic:** System deactivates other visions when one is made active

### 4. **User Can Have Multiple Visions (But Only One Active)**
- Creation flow can be run multiple times
- Each creates a new separate vision document
- **Only one vision can be active at a time** (automatically enforced)
- Previous active visions are kept but marked `is_active=false`

---

## 🔧 Code References

### Assembly Page (Step 5)
```typescript
// File: src/app/life-vision/new/assembly/page.tsx
// Line: 236

await supabase
  .from('vision_versions')
  .insert({
    // ... all category content
    is_draft: true,   // ⚠️ Created as draft
    is_active: false, // ⚠️ Not active yet
    forward: '',
    conclusion: ''
  })
```

### Final Page (Step 6)
```typescript
// File: src/app/life-vision/new/final/page.tsx
// Line: 190-208

// Mark vision as complete and active
await supabase
  .from('vision_versions')
  .update({
    forward: editedForward,
    conclusion: editedConclusion,
    perspective: perspective,
    activation_message: activationMsg,
    is_draft: false,  // ✅ Updated to complete
    is_active: true   // ✅ Updated to active
  })
  .eq('id', visionId)

// Deactivate any other active visions for this user
await supabase
  .from('vision_versions')
  .update({ is_active: false })
  .eq('user_id', user.id)
  .neq('id', visionId)
  .eq('is_active', true)
```

---

## 🚀 User Journey Summary

```
User starts: /life-vision/new
↓
Steps 1-4: Complete 12 categories
  → Data in: life_vision_category_state
  → Status: No vision_versions yet
↓
Step 5: Assembly
  → CREATES vision_versions entry
  → is_draft: true, is_active: false
  → Forward/Conclusion: Empty
↓
Step 6: Final
  → UPDATES vision_versions entry
  → is_draft: false, is_active: true
  → Forward/Conclusion: Populated
  → Other active visions deactivated
↓
User views: /life-vision/[id]
  → Vision is complete, active, and viewable
```

---

## ✅ Summary

**When does the vision get created?**
- **Step 5 (Assembly):** Vision entry created with `is_draft=true, is_active=false`
- **Step 6 (Final):** Vision updated to `is_draft=false, is_active=true` + auto-deactivates other visions

**Key Insight:**
Both `/life-vision/new` (creation) and `/life-vision/[id]/refine` (refinement) now use the same `is_draft`/`is_active` flags for consistent state management. The system automatically ensures only one vision is active per user.

---

**Related Documentation:**
- [LIFE_VISION_FLOWS_OVERVIEW.md](./LIFE_VISION_FLOWS_OVERVIEW.md) - Both flows explained
- [LIFE_VISION_NEW_SYSTEM_EXPERT_GUIDE.md](./LIFE_VISION_NEW_SYSTEM_EXPERT_GUIDE.md) - Complete creation flow
- [DRAFT_VISION_EXPERT_GUIDE.md](./DRAFT_VISION_EXPERT_GUIDE.md) - Refinement flow

