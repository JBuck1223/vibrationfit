# Intensive Mode Trigger

## What Flags Someone as "In Intensive"

**Single Query:**
```sql
SELECT * FROM intensive_purchases
WHERE user_id = $user_id
  AND completion_status IN ('pending', 'in_progress')
ORDER BY created_at DESC
LIMIT 1
```

**If this returns a row → Intensive Mode ON**  
**If this returns NULL → Intensive Mode OFF**

---

## How to Remove Someone

### Option 1: Delete Everything (Clean Slate)
```bash
scripts/database/remove-from-intensive.sql
```

### Option 2: Mark as Completed (Keep Records)
```bash
scripts/database/mark-intensive-complete.sql
```

**Then user must hard refresh:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

## Checklist

✅ User must hard refresh after database changes  
✅ Check `completion_status` = only `'pending'` or `'in_progress'` trigger intensive  
✅ Both `intensive_purchases` and `intensive_checklist` should be cleaned

