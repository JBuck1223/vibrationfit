# Admin Permission Patterns in VibrationFit

**Last Updated:** November 15, 2025

## 🔍 How Admin Permissions Were Previously Handled

Your database uses **3 different patterns** for admin permissions, depending on the context:

---

## 1️⃣ Email-Based Admin Check (Most Common)

### Pattern A: Email Domain Check
```sql
-- Anyone with @vibrationfit.com email
CREATE POLICY "Admins can update site content metadata"
  ON media_metadata FOR UPDATE
  USING (
    (auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text
  );
```

### Pattern B: Specific Email Allowlist
```sql
-- Specific admin emails
CREATE POLICY "Admins can manage vibrational sources"
  ON vibrational_event_sources
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
        AND users.email IN (
          'buckinghambliss@gmail.com',
          'admin@vibrationfit.com'
        )
    )
  );
```

### Pattern C: Combined JWT + Domain Check
```sql
-- Either JWT role OR email domain
CREATE POLICY "Admins can insert site content metadata"
  ON media_metadata FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role'::text) = 'admin'::text
    OR
    (auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text
  );
```

---

## 2️⃣ User Metadata Admin Flag

### Pattern: Check `raw_user_meta_data`
```sql
-- Check if user has is_admin flag in metadata
CREATE POLICY "Admin via metadata"
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
        AND (
          users.raw_user_meta_data ->> 'is_admin'
        ) = 'true'
    )
  );
```

**Set via Supabase Auth:**
```typescript
// When creating admin user
const { data, error } = await supabase.auth.admin.updateUserById(
  userId,
  {
    user_metadata: { is_admin: true }
  }
)
```

---

## 3️⃣ Service Role (API/Admin Panel)

### Pattern: Role-Based Check
```sql
-- For backend operations and admin panel
CREATE POLICY "Service role has full access"
  ON token_balances FOR ALL
  USING (
    auth.role() = 'service_role'
  );
```

**When to use:**
- Admin panel operations
- Backend scripts
- Automated tasks
- No user-level admin needed

---

## 📊 Which Pattern Was Used Where?

| Table/Feature | Pattern | Check |
|---------------|---------|-------|
| **media_metadata** | Email domain | `@vibrationfit.com` |
| **vibrational_event_sources** | Email allowlist + metadata | Specific emails OR `is_admin` |
| **token_balances** | Service role | `service_role` |
| **user_storage** | Service role | `service_role` |
| **ai_model_pricing** | Service role ✅ (new) | `service_role` |

---

## 🎯 Why Service Role for AI Model Pricing?

For the `ai_model_pricing` table, I chose **service role** because:

1. ✅ **No admin column exists** in `user_profiles` (would need to create one)
2. ✅ **Simpler implementation** (no need to query auth.users)
3. ✅ **Admin panel context** (pricing management is admin panel feature)
4. ✅ **Consistent with token system** (token_balances uses service role)
5. ✅ **Everyone can read** (pricing is public data for calculations)
6. ✅ **Only admins modify** (updates happen via admin panel with service role)

---

## 🔄 Alternative: If You Want Email-Based Check

If you prefer the email-based pattern (like `media_metadata`), here's the alternative:

```sql
-- Option A: Email domain check
CREATE POLICY "Admins can modify model pricing"
  ON public.ai_model_pricing
  FOR INSERT, UPDATE, DELETE
  USING (
    (auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text
  );

-- Option B: Specific admin emails
CREATE POLICY "Admins can modify model pricing"
  ON public.ai_model_pricing
  FOR INSERT, UPDATE, DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
        AND users.email IN (
          'buckinghambliss@gmail.com',
          'admin@vibrationfit.com'
        )
    )
  );

-- Option C: Combined approach (most flexible)
CREATE POLICY "Admins can modify model pricing"
  ON public.ai_model_pricing
  FOR INSERT, UPDATE, DELETE
  USING (
    auth.role() = 'service_role'
    OR
    (auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
        AND (users.raw_user_meta_data ->> 'is_admin') = 'true'
    )
  );
```

---

## 📝 Summary

| Pattern | Pros | Cons | Best For |
|---------|------|------|----------|
| **Email Domain** | Simple, no extra columns | Can't revoke easily | Small teams |
| **Email Allowlist** | Explicit control | Hard-coded | Specific admins |
| **User Metadata** | Flexible, per-user | Requires Auth API | User-level admin |
| **Service Role** | Simple, secure | API-only | Backend operations |

---

## ✅ Current Implementation

**ai_model_pricing** uses **service role** (Pattern #3) because:
- Pricing updates happen via admin panel (service role context)
- No `is_admin` column exists in `user_profiles`
- Consistent with existing token system patterns
- Simple and secure

---

## 🔧 To Change Admin Pattern

If you want to switch to email-based admin:

```bash
# Edit migration file:
supabase/migrations/20251115000000_create_ai_model_pricing.sql

# Replace the policy with one of the alternatives above
# Then re-run the migration
```

---

## 📚 Related Files

- Current Schema: `supabase/CURRENT_SCHEMA.md`
- Full Schema: `supabase/schema_check.sql`
- Token System: `migrations/20251114000000_cleanup_user_profiles.sql`
- This Guide: `docs/ADMIN_PERMISSION_PATTERNS.md`

