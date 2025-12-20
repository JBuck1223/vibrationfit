# Vision Queue System Implementation

## Architecture: Background Job Queue

Inspired by `/life-vision/[id]/audio/queue`, this system uses **background jobs + status polling** to allow browser-independent vision generation.

### How It Works

```
1. User clicks "Generate Vision"
   → POST /api/vision-jobs/create
   → Creates job record (status: 'pending')
   → Returns jobId immediately
   → Triggers background processor

2. Background Processor (runs server-side)
   → POST /api/vision-jobs/process
   → Processes ONE category per request
   → Updates job record after each category
   → Triggers itself recursively for next category
   → After 12 categories: assembles final vision

3. UI Polls for Status (every 5 seconds)
   → GET /api/vision-jobs/status?jobId=xxx
   → Updates progress bar
   → Shows current category
   → Redirects when complete

4. User Can:
   ✅ Close browser (job continues)
   ✅ Refresh page (resume from last status)
   ✅ Check from another device
   ✅ Come back later
```

### Database Schema

```sql
vision_generation_jobs
├── id (UUID)
├── user_id (UUID)
├── status (pending | processing | completed | failed)
├── current_category (TEXT) - "Fun", "Health", etc.
├── categories_completed (INT)
├── categories_failed (INT)
├── vision_id (UUID) - Set when complete
└── timestamps (created_at, started_at, completed_at)
```

### API Endpoints

1. **POST `/api/vision-jobs/create`**
   - Creates job
   - Returns `{ jobId, status }`
   - Triggers background processor

2. **POST `/api/vision-jobs/process`** (internal)
   - Processes one category
   - Updates job progress
   - Recursively triggers next category
   - Assembles final vision when done

3. **GET `/api/vision-jobs/status?jobId=xxx`**
   - Returns current job status
   - UI polls this every 5 seconds

### Key Differences from Audio System

**Audio Queue** (short jobs):
- Browser triggers generation
- Browser stays open during generation (1-2 min)
- Polls for completion

**Vision Queue** (long jobs):
- Browser creates job, immediately returns
- Server processes in background (20-60 min)
- Browser can close, job continues
- User can check status anytime

### Benefits

✅ No timeout issues (each request is <5 min)
✅ Browser-independent
✅ Can resume after refresh
✅ Progress is persisted
✅ Can check from multiple devices
✅ Automatic retry on failure

### Next Steps

To fully implement this:

1. ✅ Run migration to create `vision_generation_jobs` table
2. ✅ API endpoints created
3. ⏳ Update UI to use job system (replace client-side loop)
4. ⏳ Add retry logic for failed categories
5. ⏳ Optional: Add cron job to process orphaned jobs

