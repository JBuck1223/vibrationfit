# Intensive Mode: Single Source of Truth

## ✅ Source of Truth: `intensive_purchases` table ONLY

**Enrollment Status = `intensive_purchases.completion_status`**

### Valid States:
- `'pending'` → Enrolled, not started (shows welcome screen)
- `'in_progress'` → Enrolled, started (shows dashboard with timer)
- `'completed'` → Graduated (exits intensive mode)
- `'refunded'` → Exited

---

## Tables & Their Roles:

### `intensive_purchases` (ENROLLMENT)
**Purpose:** Source of truth for intensive enrollment  
**Key Fields:**
- `user_id` → Who is enrolled
- `completion_status` → Are they in intensive mode?
- `started_at` → When did they start?
- `completed_at` → When did they finish?

**This table answers:** "Is this user in intensive mode?"

### `intensive_checklist` (PROGRESS ONLY)
**Purpose:** Track progress through 10 steps  
**Key Fields:**
- `intensive_id` → FK to intensive_purchases
- `profile_completed`, `assessment_completed`, etc.

**This table answers:** "What steps have they completed?"

---

## Clean Queries:

### Check if user is in intensive:
```sql
SELECT id FROM intensive_purchases
WHERE user_id = $user_id
  AND completion_status IN ('pending', 'in_progress')
LIMIT 1;
```

### Remove from intensive:
```sql
DELETE FROM intensive_checklist WHERE user_id = $user_id;
DELETE FROM intensive_purchases WHERE user_id = $user_id;
```

### Mark as completed:
```sql
UPDATE intensive_purchases 
SET completion_status = 'completed', completed_at = NOW()
WHERE user_id = $user_id
  AND completion_status IN ('pending', 'in_progress');
```

---

## ❌ Don't Do This:
- Don't check `intensive_checklist` to determine enrollment
- Don't use both tables as enrollment flags
- Don't orphan checklist rows without a purchase row

## ✅ Do This:
- Always check `intensive_purchases.completion_status` for enrollment
- Use `intensive_checklist` only for progress UI
- Delete both tables together when removing user

