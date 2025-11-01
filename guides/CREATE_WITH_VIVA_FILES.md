# Create with VIVA - File Summary

## Overview

The "Create with VIVA" flow is an **older, deprecated** vision creation interface that provides a chat-based conversational experience for building life visions. This has been replaced by the modern `/life-vision/new` flow which uses the actual VIVA AI system.

## Files Associated with Create with VIVA

### Core Files (4 main files, 954 lines total)

#### 1. Page Component
**`src/app/life-vision/create-with-viva/page.tsx`** (116 lines)
- Main page that renders the VisionBuilder component
- Handles authentication and loading state
- Saves completed vision to `vision_versions` table
- Redirects to `/life-vision` on completion
- **Status:** ✅ Accessible at `/life-vision/create-with-viva`

#### 2. Vision Builder Component
**`src/components/VisionBuilder.tsx`** (354 lines)
- Chat-based conversational vision builder
- Iterates through all 12 vision categories sequentially
- Uses **hardcoded prompts** for each category (not AI-generated)
- Features:
  - Real-time chat interface
  - Category-by-category progression
  - "Generate Vision" button for each category
  - Forward section warmup with markdown
- Calls: `/api/viva/vision/generate` to generate paragraph for each category

#### 3. Vision Generation API (Slash Path)
**`src/app/api/viva/vision/generate/route.ts`** (122 lines)
- **Used by:** VisionBuilder component
- Zod-validated endpoint
- Creates/updates draft in `vision_versions` table
- Uses:
  - `ensureForwardWarmup()` - Seeds forward section warmup
  - `computeCompletion()` - Calculates completion percentage
- Hardcoded GPT-4o model (not from admin config)
- Returns: `{ reflection, paragraph, clarifier, vision }`

#### 4. Vision Generation API (Hyphenated Path)
**`src/app/api/viva/vision-generate/route.ts`** (362 lines)
- **NOT USED** by VisionBuilder
- More complex action-based system
- Supports multiple actions:
  - `analyze` - Profile/assessment insights
  - `start_conversation` - Begin category conversation
  - `continue_conversation` - Continue conversation turn
  - `generate_vision_from_conversation` - Generate from conversation history
- Uses:
  - `ConversationManager` - Manages conversation sessions
  - `profile-analyzer` - Analyzes user data
  - `conversation-generator` - Generates prompts
  - `vision-composer` - Composes vision paragraphs
- **Status:** Appears to be an alternative implementation, possibly abandoned

## How It Works

```
User visits /life-vision/create-with-viva
  ↓
VisionBuilder component loads
  ↓
Shows welcome message, then starts Forward category
  ↓
User chats with hardcoded prompts (NOT real VIVA)
  ↓
User clicks "Generate Vision"
  ↓
Calls /api/viva/vision/generate
  ↓
GPT-4o generates paragraph for that category
  ↓
Displays paragraph to user
  ↓
User moves to next category
  ↓
Repeat for all 12 categories
  ↓
Saves completed vision to database
```

## Navigation Links

- **Footer:** `src/components/Footer.tsx` line 48
- **Sitemap:** `src/app/sitemap/page.tsx` line 80

## Comparison: Old vs New Flow

### Create with VIVA (Old - Deprecated)
- ❌ Hardcoded prompts (no AI personalization)
- ❌ Simple chat interface
- ❌ Sequential category-by-category
- ❌ No profile/assessment awareness
- ❌ Direct vision generation
- ✅ Chat-based, conversational
- ✅ Forward warmup section

### /life-vision/new (New - Current)
- ✅ AI-generated personalized prompts
- ✅ Audio/video recording + text input
- ✅ Show profile & assessment context
- ✅ Category summaries before assembly
- ✅ Master vision assembly
- ✅ Uses profile/assessment data
- ✅ Admin-configurable AI models
- ✅ Token tracking

## Dependencies

### Shared Libraries (Used by VisionBuilder)
- `src/lib/viva/forward-warmup.ts` - Forward section warmup markdown content
- `src/lib/viva/seed-forward.ts` - Seeds forward warmup in database
- `src/lib/viva/compute-completion.ts` - Calculates completion percentage
- `src/lib/viva/vision-composer.ts` - Core vision paragraph generation
- `src/lib/design-system/vision-categories.ts` - Category definitions

### Not Used by VisionBuilder (but exists in alternative API)
- `src/lib/viva/conversation-manager.ts` - Conversation session management
- `src/lib/viva/profile-analyzer.ts` - Profile/assessment analysis
- `src/lib/viva/conversation-generator.ts` - Conversational prompt generation

## Deprecation Status

**Current:** ⚠️ **DEPRECATED but still functional**

- Still accessible via navigation
- Still works if users access it
- **Should be:** Redirected to `/life-vision/new` or removed

## Recommended Action

### Option 1: Soft Deprecation (Redirect)
```typescript
// In src/app/life-vision/create-with-viva/page.tsx
export default function CreateWithVivaPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to new flow
    router.replace('/life-vision/new')
  }, [router])
  
  return <LoadingSpinner />
}
```

### Option 2: Hard Removal
Delete all 4 files:
```bash
rm src/app/life-vision/create-with-viva/page.tsx
rm src/components/VisionBuilder.tsx
rm src/app/api/viva/vision/generate/route.ts
rm src/app/api/viva/vision-generate/route.ts  # if truly unused
```

Update navigation files:
```bash
# Remove links from:
# - src/components/Footer.tsx
# - src/app/sitemap/page.tsx
```

## Questions for User

1. **Should `/life-vision/create-with-viva` be removed completely?**
   - Or kept as an alternative interface with deprecation notice?

2. **Is `/api/viva/vision-generate` (hyphenated) used anywhere?**
   - It has more features (conversation management, profile analysis)
   - But doesn't appear to be referenced

3. **Do any existing users have incomplete visions in the old format?**
   - Need migration strategy if removing

4. **Should we preserve the conversational chat interface style?**
   - Could reimplement in new flow if desired

