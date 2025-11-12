# Vision Creation Timeline - /life-vision/new Flow

**Last Updated:** November 12, 2025  
**Status:** ✅ Current - Documents when draft/active vision is created

---

## 🎯 Quick Answer

**The vision gets created in two stages:**

1. **Step 5 (Assembly):** Vision created as `status: 'draft'` ⚠️
2. **Step 6 (Final):** Vision updated to `status: 'complete'` ✅

**Important:** The `/life-vision/new` flow does NOT use `is_draft` or `is_active` flags! Those are only for the refinement system.

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
     status: 'draft',       // ⚠️ DRAFT status
     completion_percent: 100,
     richness_metadata: {...}
   }
   ```

**Important Fields:**
- ✅ `status: 'draft'` - Not complete yet
- ✅ All 12 categories populated
- ❌ `forward` and `conclusion` are empty
- ❌ No `is_draft` flag (not used in creation flow)
- ❌ No `is_active` flag (not used in creation flow)

**Database State After Step 5:**
```sql
vision_versions:
  id: abc-123
  status: 'draft'
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
     status: 'complete'      // ✅ NOW COMPLETE
   }
   ```

**Database State After Step 6:**
```sql
vision_versions:
  id: abc-123
  status: 'complete'        ✅ Updated
  forward: '...'            ✅ Populated
  conclusion: '...'         ✅ Populated
  perspective: 'singular'   ✅ Set
  activation_message: '...' ✅ Set
```

**Result:**
- ✅ Vision is now **complete**
- ✅ User redirected to `/life-vision/[id]` (view page)
- ✅ Vision is fully viewable/downloadable

---

## 🔍 Key Differences: Creation vs Refinement

### `/life-vision/new` (Creation Flow)
**Uses:**
- ✅ `status` field (`'draft'` → `'complete'`)
- ❌ Does NOT use `is_draft` flag
- ❌ Does NOT use `is_active` flag

**Flow:**
```
Steps 1-4: Build in life_vision_category_state
↓
Step 5: Create vision_versions (status='draft')
↓
Step 6: Update to (status='complete')
↓
User views complete vision
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
| `status` | ✅ 'draft' → 'complete' | ❌ Not used |
| `is_draft` | ❌ Not set | ✅ true/false |
| `is_active` | ❌ Not set | ✅ true/false |
| `refined_categories` | ❌ Not set | ✅ JSONB array |
| `perspective` | ✅ Set in Step 6 | ✅ Can be updated |
| `forward` | ✅ Set in Step 6 | ✅ Can be edited |
| `conclusion` | ✅ Set in Step 6 | ✅ Can be edited |

---

## 🎯 Important Notes

### 1. **Two Different Draft Systems**
- **Creation Flow:** Uses `status='draft'` temporarily
- **Refinement Flow:** Uses `is_draft=true` for editing

### 2. **No Version Conflicts**
- Creation flow creates NEW visions
- Refinement flow creates NEW versions of existing visions
- Both increment `version_number`

### 3. **When Is Vision "Active"?**
- **Creation Flow:** When `status='complete'` (no `is_active` flag)
- **Refinement Flow:** When `is_draft=false` AND `is_active=true`

### 4. **User Can Have Multiple Visions**
- Creation flow can be run multiple times
- Each creates a new separate vision document
- User manually sets which one is "active" (feature not yet built)

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
    status: 'draft',  // ⚠️ Created as draft
    forward: '',
    conclusion: ''
  })
```

### Final Page (Step 6)
```typescript
// File: src/app/life-vision/new/final/page.tsx
// Line: 193

await supabase
  .from('vision_versions')
  .update({
    forward: editedForward,
    conclusion: editedConclusion,
    perspective: perspective,
    activation_message: activationMsg,
    status: 'complete'  // ✅ Updated to complete
  })
  .eq('id', visionId)
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
  → Status: 'draft'
  → Forward/Conclusion: Empty
↓
Step 6: Final
  → UPDATES vision_versions entry
  → Status: 'complete'
  → Forward/Conclusion: Populated
↓
User views: /life-vision/[id]
  → Vision is complete and viewable
```

---

## ✅ Summary

**When does the vision get created?**
- **Step 5 (Assembly):** Vision entry created with `status='draft'`
- **Step 6 (Final):** Vision updated to `status='complete'`

**Key Insight:**
The `/life-vision/new` flow does NOT use the `is_draft`/`is_active` flags. Those are exclusively for the refinement system (`/life-vision/[id]/refine`). The creation flow uses a simpler `status` field that goes from `'draft'` to `'complete'`.

---

**Related Documentation:**
- [LIFE_VISION_FLOWS_OVERVIEW.md](./LIFE_VISION_FLOWS_OVERVIEW.md) - Both flows explained
- [LIFE_VISION_NEW_SYSTEM_EXPERT_GUIDE.md](./LIFE_VISION_NEW_SYSTEM_EXPERT_GUIDE.md) - Complete creation flow
- [DRAFT_VISION_EXPERT_GUIDE.md](./DRAFT_VISION_EXPERT_GUIDE.md) - Refinement flow

