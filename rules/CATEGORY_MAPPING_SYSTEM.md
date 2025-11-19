# Category System - Single Source of Truth

**Last Updated:** November 19, 2025  
**Status:** 🔒 LOCKED - This is production critical infrastructure  
**Location:** `/src/lib/design-system/vision-categories.ts`

---

## 🎉 ONE Set of Category Names Everywhere!

**We use the SAME clean category names across ALL systems:**

```
fun, health, travel, love, family, social, home, work, money, stuff, giving, spirituality
```

**Used in:**
- ✅ Vision documents
- ✅ Assessment questions
- ✅ Story recordings
- ✅ Profile sections
- ✅ Audio files
- ✅ Database tables

**No exceptions. No variations. Just clean, simple category names.**

---

## 🚨 CRITICAL: Never Hardcode Category Keys

**Even though the keys are simple, ALWAYS use the mapping functions:**

❌ **DON'T:**
```typescript
category: 'fun'  // Hardcoded!
```

✅ **DO:**
```typescript
category: visionToRecordingKey('fun')  // Returns 'fun' but future-proof
```

**Why?** If we ever need to change a category key, we only update it in ONE place and everything works.

---

## All 12 Categories

| Category | Key | Label |
|----------|-----|-------|
| 🎉 Fun | `fun` | Fun |
| 💪 Health | `health` | Health |
| ✈️ Travel | `travel` | Travel |
| ❤️ Love | `love` | Love |
| 👨‍👩‍👧‍👦 Family | `family` | Family |
| 👥 Social | `social` | Social |
| 🏠 Home | `home` | Home |
| 💼 Work | `work` | Work |
| 💰 Money | `money` | Money |
| 📦 Stuff | `stuff` | Stuff |
| 🎁 Giving | `giving` | Giving |
| ✨ Spirituality | `spirituality` | Spirituality |

---

## How to Use

### Import the Functions

```typescript
import { 
  visionToRecordingKey,
  visionToProfileSectionKey,
  profileSectionToVisionKey,
  convertCategoryKey,
  getCategoryMapping,
  VISION_CATEGORIES
} from '@/lib/design-system/vision-categories'
```

### Common Use Cases

#### 1. Saving a Recording

```typescript
const newRecording = {
  url,
  transcript,
  type: 'audio',
  category: visionToRecordingKey('fun'), // Returns 'fun'
  created_at: new Date().toISOString()
}
```

#### 2. Filtering Recordings

```typescript
<SavedRecordings
  recordings={profile.story_recordings || []}
  categoryFilter={visionToRecordingKey('health')} // Returns 'health'
  onDelete={handleDelete}
/>
```

#### 3. Profile Section Navigation

```typescript
// Get section ID for a category
const sectionId = visionToProfileSectionKey('love') // Returns 'love'
router.push(`/profile/edit#${sectionId}`)

// Convert section ID back to category
const categoryKey = profileSectionToVisionKey('love') // Returns 'love'
```

#### 4. Getting Category Info

```typescript
import { getVisionCategory } from '@/lib/design-system/vision-categories'

const category = getVisionCategory('fun')
// Returns: { key: 'fun', label: 'Fun', icon: PartyPopper, ... }
```

---

## Where This System Is Used

### Core Files
- **`vision-categories.ts`** - SOURCE OF TRUTH for all category data
- **Profile Components** - All 12 section components use `visionToRecordingKey()`
- **Assessment Flow** - Uses consistent category keys
- **Life Vision System** - Uses consistent category keys
- **Audio System** - Uses consistent category keys

### All Profile Section Components
- `FunRecreationSection.tsx`
- `HealthSection.tsx`
- `TravelAdventureSection.tsx`
- `RelationshipSection.tsx`
- `FamilySection.tsx`
- `SocialFriendsSection.tsx`
- `LocationSection.tsx`
- `CareerSection.tsx`
- `FinancialSection.tsx`
- `PossessionsLifestyleSection.tsx`
- `GivingLegacySection.tsx`
- `SpiritualityGrowthSection.tsx`

---

## Common Mistakes to Avoid

### ❌ DON'T: Hardcode Category Strings

```typescript
// BAD - Even though it's correct, it's hardcoded
const newRecording = {
  category: 'fun', // ❌ Hardcoded
  ...
}
```

### ✅ DO: Use the Mapping Function

```typescript
// GOOD - Future-proof
const newRecording = {
  category: visionToRecordingKey('fun'), // ✅ Uses mapping
  ...
}
```

---

### ❌ DON'T: Create Local Lists

```typescript
// BAD - Duplicated list
const categories = ['fun', 'health', 'travel', 'love', ...]
```

### ✅ DO: Import from Vision Categories

```typescript
// GOOD - Single source
import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'
```

---

## Testing Your Changes

After modifying category-related code, test:

1. **Profile**: Do recordings save and filter correctly?
2. **Assessment**: Do questions load for all categories?
3. **Life Vision**: Does the creation flow work for all categories?
4. **Audio**: Do audio tracks organize correctly?

---

## When to Update

You should update `CATEGORY_MAPPINGS` if:

1. **New category added** to the system
2. **Category key changes** (rename)
3. **Category removed** (deprecation)

**After updating:**
- [ ] Update the mapping array in `vision-categories.ts`
- [ ] Update `VISION_CATEGORIES` array
- [ ] Update this documentation
- [ ] Test all flows
- [ ] Update `FEATURE_REGISTRY.md`

---

## Quick Reference

**Most common functions:**

| Function | What it does |
|----------|--------------|
| `visionToRecordingKey(key)` | Returns the recording category key (same as input) |
| `visionToProfileSectionKey(key)` | Returns the profile section ID (same as input) |
| `profileSectionToVisionKey(key)` | Converts profile section to vision key (same as input) |
| `getVisionCategory(key)` | Gets full category object with label, icon, etc. |
| `LIFE_CATEGORY_KEYS` | Array of all category keys |

**Since all keys are the same now, these functions just return the input. But KEEP USING THEM for future-proofing!**

---

## Questions?

**Before asking:**
1. Check `src/lib/design-system/vision-categories.ts`
2. Search for examples: `grep -r "visionToRecordingKey" src/`
3. Review this document

**If you need to modify:**
1. Check `FEATURE_REGISTRY.md` 
2. Verify Category Mapping status
3. Get user permission if LOCKED

---

**Remember:** ONE set of clean category names everywhere. No exceptions. Use the mapping functions even though they're simple - it makes the system maintainable and future-proof.
