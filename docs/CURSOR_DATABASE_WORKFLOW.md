# Cursor Database Workflow (Safe Operations Only)

Last Updated: November 16, 2025

## 🎯 Goal

Enable AI agents in Cursor to:
- ✅ **See** what's in the production database
- ✅ **Understand** the schema
- ❌ **NOT make changes** to production

---

## 📚 Reference Files for Agents

### What Agents Can Read:

1. **`docs/PRODUCTION_SCHEMA_REFERENCE.md`**
   - Complete schema overview
   - Table descriptions
   - Relationships
   - Common queries

2. **`supabase/CURRENT_SCHEMA_COLUMNS.txt`**
   - Detailed column information
   - Data types
   - Constraints

3. **`supabase/CURRENT_SCHEMA.md`**
   - Human-readable schema docs
   - Table purposes
   - Key relationships

4. **`supabase/COMPLETE_SCHEMA_DUMP.sql`**
   - Full SQL schema definition
   - For reference only

---

## ✅ Safe Operations (Agents Can Do)

### 1. Read Schema Information

```bash
# Get table list
psql "CONNECTION_STRING" -c "\dt public.*"

# Get column details
psql "CONNECTION_STRING" -c "
  SELECT table_name, column_name, data_type 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'your_table'
"

# Get row counts
psql "CONNECTION_STRING" -c "
  SELECT 
    tablename, 
    (xpath('/row/c/text()', query_to_xml(
      format('select count(*) as c from %I.%I', schemaname, tablename),
      false, true, ''
    )))[1]::text::int AS row_count
  FROM pg_tables
  WHERE schemaname = 'public'
"
```

### 2. Read-Only Queries

```bash
# Query specific data (read-only)
psql "CONNECTION_STRING" -c "
  SELECT * FROM vision_versions 
  WHERE user_id = 'some-uuid'
  LIMIT 10
"
```

**Note:** All SELECT queries are safe.

### 3. Check Database Status

```bash
# Check Supabase status
supabase status

# List projects
supabase projects list

# View local migrations
ls -la supabase/migrations/
```

---

## ❌ Forbidden Operations (Agents Must NOT Do)

### NEVER Run These:

```bash
❌ supabase db reset
❌ supabase db push
❌ supabase migration repair --status reverted
❌ DELETE FROM ...
❌ TRUNCATE ...
❌ DROP TABLE ...
❌ ALTER TABLE ... (without explicit approval)
```

### Why These Are Dangerous:

- `db reset` → **Deletes ALL data**
- `db push` → **Applies migrations** (could contain DELETE/TRUNCATE)
- `migration repair` → **Confuses migration history**
- `DELETE/TRUNCATE/DROP` → **Destroys data permanently**

---

## 🔄 How to Keep Schema Reference Updated

### When Schema Changes (After Manual Changes in Dashboard):

Run this **safe** command to refresh the reference:

```bash
# Update column reference (read-only)
cd /Users/jordanbuckingham/Desktop/vibrationfit

psql "postgresql://postgres:PASSWORD@db.nxjhqibnlbwzzphewncj.supabase.co:5432/postgres" -c "
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position
" > supabase/CURRENT_SCHEMA_COLUMNS.txt

echo "✅ Schema reference updated"
```

**This is READ-ONLY and completely safe.**

---

## 🤖 Agent Instructions

### If an Agent Needs Schema Information:

1. **First, check existing docs:**
   - `docs/PRODUCTION_SCHEMA_REFERENCE.md`
   - `supabase/CURRENT_SCHEMA_COLUMNS.txt`

2. **If docs are outdated, refresh them:**
   - Run the safe query above
   - Update `PRODUCTION_SCHEMA_REFERENCE.md` if needed

3. **For specific data queries:**
   - Use SELECT only
   - Add LIMIT to prevent large results
   - Never use UPDATE/DELETE/TRUNCATE

### If an Agent Needs to Make Schema Changes:

**STOP!** Follow this process:

1. **Document the change needed**
   - What table?
   - What column?
   - Why?

2. **Create a local migration first**
   ```bash
   supabase migration new describe_the_change
   ```

3. **Test locally ONLY**
   ```bash
   supabase start  # Make sure local is running
   supabase db reset  # Test migration locally
   ```

4. **Get human approval**
   - Show the migration file
   - Explain what it does
   - Wait for explicit "yes, push this"

5. **Then and ONLY then:**
   ```bash
   # Human runs this manually
   supabase db push --db-url "CONNECTION_STRING"
   ```

---

## 🔐 Connection Strings (For Reference)

### Production (Read-Only Recommended)
```
postgresql://cursor_reader:PASSWORD@db.nxjhqibnlbwzzphewncj.supabase.co:5432/postgres
```

### Production (Full Access - Use Carefully)
```
postgresql://postgres:PASSWORD@db.nxjhqibnlbwzzphewncj.supabase.co:5432/postgres
```

### Local Development (Safe to Modify)
```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Note:** Passwords stored in `.env.local` (gitignored)

---

## 📊 Common Agent Tasks

### Task: "Show me the user_profiles schema"

**Safe Response:**
```bash
psql "CONNECTION_STRING" -c "\d user_profiles"
```

### Task: "How many users do we have?"

**Safe Response:**
```bash
psql "CONNECTION_STRING" -c "SELECT COUNT(*) FROM profiles"
```

### Task: "Add a new column to user_profiles"

**Correct Response:**
1. Document the need
2. Create local migration
3. Test locally
4. Ask human for approval
5. Human pushes to production

**Incorrect Response:**
❌ Running `ALTER TABLE` directly on production

---

## 🛡️ Protection Checklist

Before any database operation, agents should verify:

- [ ] Is this operation READ-ONLY? (SELECT, SHOW, etc.)
  - ✅ If yes → Safe to proceed
  - ❌ If no → Requires human approval

- [ ] Does this modify data? (INSERT, UPDATE, DELETE, TRUNCATE)
  - ❌ Stop → Get approval first

- [ ] Does this modify schema? (ALTER, DROP, CREATE)
  - ❌ Stop → Test locally first, then get approval

- [ ] Am I connected to production?
  - ⚠️ If yes → Be extra careful
  - ✅ If local → Safe to experiment

---

## 📖 Related Documentation

- `docs/PRODUCTION_SCHEMA_REFERENCE.md` - What's in the database
- `docs/SUPABASE_COMMANDS_SIMPLE_GUIDE.md` - Command safety guide
- `docs/HOLY_GRAIL_SUPABASE_CONNECTION.md` - How to connect
- `docs/DATA_LOSS_INCIDENT_REPORT.md` - What went wrong (Nov 16)

---

## 🎓 Learning Resources

### For Understanding Supabase:
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Local Development](https://supabase.com/docs/guides/local-development)
- [Migration Guide](https://supabase.com/docs/guides/cli/migrations)

### For Safe Database Work:
- Always test locally first
- Never `db reset` on production
- Read-only queries are always safe
- When in doubt, ask a human

---

## 💬 Questions Agents Should Ask

Before any database operation:

1. "Is this read-only?"
2. "Am I modifying production data?"
3. "Have I tested this locally?"
4. "Do I have approval for this?"

If answer to 2-4 is "no", **STOP and ask a human.**

---

**Remember:** Reading is safe. Writing requires approval. Production requires extra care.

