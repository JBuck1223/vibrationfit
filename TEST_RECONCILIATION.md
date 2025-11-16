# Testing OpenAI Reconciliation System 🧪

**Date:** November 16, 2025

---

## 🎯 Quick Test Plan

### Step 1: Apply Migration (Choose One)

#### Option A: Direct SQL (Fastest)
```bash
# Copy the migration SQL and run it in Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/nxjhqibnlbwzzphewncj/sql/new
# Paste contents of: supabase/migrations/20251116141218_add_openai_reconciliation_fields.sql
# Click "Run"
```

#### Option B: Via psql
```bash
cd /Users/jordanbuckingham/Desktop/vibrationfit

psql "postgresql://postgres:$(grep PGPASSWORD .env.local | cut -d '=' -f2)@db.nxjhqibnlbwzzphewncj.supabase.co:5432/postgres" \
  -f supabase/migrations/20251116141218_add_openai_reconciliation_fields.sql
```

#### Option C: Supabase CLI (if migration history matches)
```bash
supabase db push
```

---

### Step 2: Make Some AI Calls

Go to your app and use ANY AI feature:

**Easy Test Routes:**
1. **VIVA Chat** - `/life-vision/new`
   - Start a conversation with VIVA
   - Ask it anything about your vision

2. **Category Summary** - `/life-vision/new`
   - Create a vision summary for any category
   - This uses the `category-summary` route we updated

3. **Prompt Suggestions** - `/life-vision/new`
   - Generate prompt suggestions
   - Quick and uses few tokens

4. **Transcription** - Upload audio anywhere
   - Tests Whisper API tracking

**Each of these will now capture the OpenAI request ID!**

---

### Step 3: Check the Results

#### A. Check the Database Directly
```sql
-- See the newest requests with OpenAI IDs
SELECT 
  action_type,
  model_used,
  openai_request_id,
  reconciliation_status,
  tokens_used,
  created_at
FROM token_usage
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
```
action_type              | openai_request_id     | status
-------------------------|----------------------|----------
chat_conversation        | chatcmpl-AbC123Xyz   | pending
life_vision_category_... | chatcmpl-DeF456Uvw   | pending
prompt_suggestions       | chatcmpl-GhI789Rst   | pending
```

#### B. Check the Admin Dashboard

1. Go to: `/admin/token-usage`
2. Click **"🔍 Reconciliation"** tab
3. You should see:
   - Pending count increased
   - Recent requests table populated
   - OpenAI request IDs visible!

---

### Step 4: Verify the View

```sql
-- Check the view is working
SELECT 
  action_type,
  openai_request_id,
  accurate_cost_usd,
  reconciliation_status,
  created_at
FROM token_usage_with_costs
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🎨 What Success Looks Like

### Before (Old Requests)
```sql
action_type         | openai_request_id | status
--------------------|-------------------|----------------
chat_conversation   | NULL              | not_applicable
vision_generation   | NULL              | not_applicable
```

### After (New Requests)
```sql
action_type         | openai_request_id      | status
--------------------|------------------------|----------
chat_conversation   | chatcmpl-AbC123Xyz456  | pending   ✅
vision_generation   | chatcmpl-DeF789Uvw123  | pending   ✅
prompt_suggestions  | chatcmpl-GhI456Rst789  | pending   ✅
```

---

## 📊 Testing Checklist

- [ ] Migration applied successfully
- [ ] Made at least 3 different AI calls
- [ ] Checked database - OpenAI request IDs present
- [ ] Viewed `/admin/token-usage` → Reconciliation tab
- [ ] Saw pending count increase
- [ ] Recent requests table shows OpenAI IDs
- [ ] OpenAI request IDs start with `chatcmpl-` or similar
- [ ] Reconciliation status shows "pending"

---

## 🐛 Troubleshooting

### Problem: OpenAI request ID is NULL
**Cause:** Code changes not deployed yet  
**Fix:** Deploy your code to production (the API routes need the updated tracking)

### Problem: Migration fails
**Cause:** Migration history mismatch  
**Fix:** Use Option A (direct SQL in Supabase Dashboard)

### Problem: Can't see Reconciliation tab
**Cause:** Browser cache  
**Fix:** Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Problem: "Column does not exist" error
**Cause:** Migration not applied  
**Fix:** Apply migration using one of the options above

---

## 🎯 Next Steps After Testing

Once you confirm it's working:

1. **Monitor for a Week**
   - Check pending count grows as users make AI calls
   - Verify all new requests have OpenAI IDs

2. **Export Request IDs** (end of month)
   ```sql
   SELECT openai_request_id, created_at
   FROM token_usage
   WHERE reconciliation_status = 'pending'
     AND created_at >= '2025-11-01'
     AND created_at < '2025-12-01';
   ```

3. **Match Against OpenAI Billing**
   - Use OpenAI's usage API
   - Update `actual_cost_cents` for each request

4. **See Reconciliation Results**
   - Matched count increases
   - Accuracy percentage updates
   - Any discrepancies are highlighted

---

## 💡 Pro Testing Tip

**Make different types of calls:**
1. Quick call (prompt suggestions) - cheap, fast
2. Medium call (category summary) - moderate cost
3. Long call (VIVA chat conversation) - more tokens

This will show different cost levels in your reconciliation dashboard!

---

**Ready?** Apply the migration and make some AI calls! 🚀

