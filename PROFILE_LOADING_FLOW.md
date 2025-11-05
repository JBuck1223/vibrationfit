# Profile Loading Flow - Complete Step-by-Step Breakdown

## HEADER COMPONENT (`src/components/Header.tsx`)

### Initial Render (Server-Side)
1. Component mounts
2. `useState` initializes:
   - `user = null`
   - `profile = null`
   - `loading = true`
   - `mounted = false`
3. `useMemo(() => createClient(), [])` creates Supabase client instance
4. `getPageType(pathname)` checks if page is PUBLIC
   - If NOT PUBLIC → returns `null` (component doesn't render)
   - If PUBLIC → continues
5. **Initial render shows**: Loading skeleton (`!mounted || loading` is true)

### Client-Side Hydration
6. **First useEffect** (line 39-41):
   - Sets `mounted = true`
   - This prevents hydration mismatch

7. **Second useEffect** (line 43-142) - MAIN DATA FETCHING:
   
   **Step 7a: Setup**
   - Sets `mounted = true` (local flag)
   - Creates 5-second timeout (line 50-55)
   
   **Step 7b: Call `getUser()`**
   - **CALL 1**: `await supabase.auth.getUser()`
     - Creates browser client via `createBrowserClient()` (from `@supabase/ssr`)
     - Makes HTTP request to: `{SUPABASE_URL}/auth/v1/user`
     - Request includes: JWT token from cookies/localStorage
     - **Network call**: ~200-500ms (production)
     - Returns: `{ data: { user }, error }`
   
   **Step 7c: Handle User Response**
   - If error → sets `user = null`, `profile = null`, `loading = false`, returns
   - If success → sets `user = userObject`
   
   **Step 7d: Call `getActiveProfileClient(user.id)`** (line 77)
   
   **Step 7e: Inside `getActiveProfileClient()`** (`src/lib/supabase/profile-client.ts`):
   
     **Step 7e.1: Check Cache** (line 70)
     - Checks `profileCache.get(userId)`
     - If cached AND < 30 seconds old → **RETURNS IMMEDIATELY** (0ms)
     - If not cached → continues
   
     **Step 7e.2: Create Supabase Client** (line 75)
     - Calls `createClient()` which creates new browser client
     - **No network call** - just object creation
   
     **Step 7e.3: Create Timeout Promise** (line 79-81)
     - Sets up 10-second timeout guard
   
     **Step 7e.4: Execute Query** (line 86-111)
     - **CALL 2**: `supabase.from('user_profiles').select(...).eq('user_id', userId).eq('is_active', true).eq('is_draft', false).maybeSingle()`
     - Makes HTTP POST to: `{SUPABASE_URL}/rest/v1/user_profiles`
     - Request body:
       ```json
       {
         "select": "first_name,profile_picture_url,vibe_assistant_tokens_remaining",
         "user_id": "eq.{userId}",
         "is_active": "eq.true",
         "is_draft": "eq.false"
       }
       ```
     - **Network call**: ~200-500ms (production)
     - Response: `{ data: {...}, error: null }` or `{ data: null, error: {...} }`
   
     **Step 7e.5: Fallback Query** (if first query fails, line 95-108)
     - **CALL 3**: `supabase.from('user_profiles').select(...).eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle()`
     - Makes HTTP POST to: `{SUPABASE_URL}/rest/v1/user_profiles`
     - **Network call**: ~200-500ms (production)
     - This is a SECOND query if the first one returns no rows
   
     **Step 7e.6: Cache Result** (line 117)
     - Stores result in `profileCache` Map with timestamp
     - Cache valid for 30 seconds
   
     **Step 7e.7: Return Profile Data**
     - Returns: `{ first_name, profile_picture_url, vibe_assistant_tokens_remaining }` or `null`
   
   **Step 7f: Update State** (line 79-82)
   - Sets `profile = profileData`
   - Sets `loading = false`
   - Component re-renders with profile data
   
8. **Auth State Change Listener** (line 107-135)
   - Sets up `supabase.auth.onAuthStateChange()` subscription
   - Listens for auth events (login, logout, token refresh)
   - On change: Re-runs `getActiveProfileClient()` (same flow as Step 7e)

### Render with Profile Data
9. Component re-renders with:
   - `mounted = true`
   - `loading = false`
   - `user = UserObject`
   - `profile = { first_name, profile_picture_url, vibe_assistant_tokens_remaining }`

10. **UI Updates**:
    - Shows profile picture OR initials avatar
    - Shows `profile.first_name` OR fallback to `user.email`
    - Shows token balance in dropdown: `profile.vibe_assistant_tokens_remaining`

---

## SIDEBAR COMPONENT (`src/components/Sidebar.tsx`)

### Initial Render (Server-Side)
1. Component mounts
2. `useState` initializes:
   - `user = null`
   - `profile = null`
   - `loading = true`
3. `useMemo(() => createClient(), [])` creates Supabase client instance
4. **Hook Call**: `useStorageData()` starts fetching storage data (non-blocking)

### Client-Side Hydration
5. **useEffect** (line 40-81) - MAIN DATA FETCHING:
   
   **Step 5a: Immediate UI Render**
   - Sets `loading = false` **IMMEDIATELY** (line 45)
   - **UI renders instantly** (doesn't wait for data)
   
   **Step 5b: Parallel Fetch**
   - **CALL 1**: `await supabase.auth.getUser()` (line 49)
     - Same as Header: HTTP request to Supabase auth endpoint
     - **Network call**: ~200-500ms (production)
   
   **Step 5c: Handle User Response** (line 52-63)
   - If user found → sets `user = userObject`
   - **CALL 2**: `getActiveProfileClient(user.id)` (line 57)
     - **NON-BLOCKING** - uses `.then()` instead of `await`
     - Runs in background while UI already rendered
     - Same flow as Header Step 7e:
       - Check cache
       - Query 1: Active profile
       - Query 2: Fallback (if needed)
       - Cache result
   - Profile updates via `.then()` callback (line 58)
   
6. **Auth State Change Listener** (line 68-78)
   - Sets up `supabase.auth.onAuthStateChange()` subscription
   - On change: Re-runs `getActiveProfileClient()` (non-blocking)

### Storage Data (Separate Hook)
7. **useStorageData Hook** (`src/hooks/useStorageData.ts`):
   
   **Step 7a: Fetch Storage**
   - **CALL**: `fetch('/api/storage/usage')` (line 43)
   - Makes HTTP request to Next.js API route
   - **Network call**: ~500-5000ms (production - calls AWS S3)
   
   **Step 7b: API Route** (`src/app/api/storage/usage/route.ts`):
     - Gets user from Supabase
     - **CALL**: AWS S3 `ListObjectsV2Command` (line 45-47)
     - Lists up to 1000 files from S3 bucket
     - **Network call**: ~2000-5000ms (production - external AWS call)
     - Calculates storage totals
     - Returns JSON response
   
   **Step 7c: Update State**
   - Sets `storageData = {...}` or empty object on error
   - Sidebar shows storage info when available

---

## NETWORK CALL SUMMARY

### Header (Blocking - waits for profile):
1. `supabase.auth.getUser()` → Supabase Auth API (~200-500ms)
2. `getActiveProfileClient()` → Supabase REST API (~200-500ms)
   - OR fallback query (~200-500ms) if first fails
3. **Total**: ~400-1500ms (sequential)

### Sidebar (Non-blocking - renders immediately):
1. `supabase.auth.getUser()` → Supabase Auth API (~200-500ms)
2. `getActiveProfileClient()` → Supabase REST API (~200-500ms) [background]
3. `fetch('/api/storage/usage')` → Next.js API → AWS S3 (~2000-5000ms) [background]
4. **Total**: UI renders in ~0ms, data loads in background

---

## CACHE BEHAVIOR

### Profile Cache (`profileCache` Map):
- **Key**: `userId` (string)
- **Value**: `{ data: ProfileData, timestamp: number, userId: string }`
- **TTL**: 30 seconds
- **Shared**: Both Header and Sidebar use same cache (in-memory, per page load)
- **Cache Hit**: Returns instantly (0ms, no network call)
- **Cache Miss**: Full query flow (400-1500ms)

### Example Flow:
1. **First Load**: Header calls `getActiveProfileClient()` → Cache miss → Query → Cache stored
2. **Second Load**: Sidebar calls `getActiveProfileClient()` → Cache hit → Returns instantly
3. **After 30s**: Cache expires → Next call does full query again

---

## KEY DIFFERENCES: Header vs Sidebar

| Aspect | Header | Sidebar |
|--------|--------|---------|
| **Render Strategy** | Blocking (waits for profile) | Non-blocking (renders immediately) |
| **Loading State** | Shows skeleton until `loading = false` | Shows skeleton until profile arrives |
| **Profile Fetch** | `await` (blocks) | `.then()` (non-blocking) |
| **Storage Data** | N/A | Fetches separately (non-blocking) |
| **Cache Benefit** | First call slow, subsequent fast | Can benefit from Header's cache |

---

## PERFORMANCE BOTTLENECKS

1. **Supabase Auth Call** (~200-500ms) - Cannot be cached
2. **Profile Query** (~200-500ms) - Cached for 30s
3. **Fallback Query** (~200-500ms) - Only if first query fails
4. **Storage API** (~2000-5000ms) - Calls AWS S3, slowest operation
5. **RLS Policy Evaluation** - Database checks permissions (adds latency)

---

## PRODUCTION VS LOCAL DIFFERENCES

**Local (Fast)**:
- Supabase runs on localhost (low latency)
- Network calls are instant
- No cold starts

**Production (Slow)**:
- Supabase API calls go over internet (~200-500ms)
- AWS S3 calls from Vercel edge (~2000-5000ms)
- Cold starts on serverless functions
- Network latency between regions

