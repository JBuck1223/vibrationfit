# [Feature Name]

**Version:** `vX.X.X`  
**Status:** [🔒 LOCKED | ✅ STABLE | 🚧 IN PROGRESS | ⚠️ NEEDS REVIEW | 🗄️ ARCHIVED]  
**Last Updated:** [Date]  
**Owner:** [Who built/maintains this]  
**Registry Entry:** See `FEATURE_REGISTRY.md`

---

## Overview

**What It Does:**
[2-3 sentence description of the feature's purpose and value]

**When to Use:**
- Use case 1
- Use case 2

**When NOT to Use:**
- Anti-pattern 1
- Anti-pattern 2

---

## Architecture

### Database Schema

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `table_name` | What it stores | `id`, `user_id`, `created_at` |

**Relationships:**
```
users → table_name (one-to-many)
table_name → other_table (many-to-one)
```

### API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `GET` | `/api/feature/list` | List items | Required |
| `POST` | `/api/feature/create` | Create item | Required |
| `PUT` | `/api/feature/[id]` | Update item | Required |
| `DELETE` | `/api/feature/[id]` | Delete item | Required |

### Frontend Pages

| Route | Purpose | Components |
|-------|---------|------------|
| `/feature` | Main view | `FeatureList`, `FeatureCard` |
| `/feature/new` | Create flow | `FeatureForm` |
| `/feature/[id]` | Detail view | `FeatureDetail` |

### Key Files

```
src/
├── app/
│   ├── api/feature/           ← API routes
│   └── feature/               ← Frontend pages
├── components/
│   └── Feature*.tsx           ← UI components
└── lib/
    └── feature/               ← Business logic
```

---

## User Flow

### Happy Path

1. **User starts:** Click "New Feature"
2. **System shows:** Feature creation form
3. **User inputs:** Required data
4. **System validates:** Check data integrity
5. **System creates:** New database record
6. **User sees:** Success confirmation
7. **System redirects:** To feature detail page

### Edge Cases

**Missing Required Data:**
- Show validation errors
- Highlight missing fields
- Don't allow submission

**Duplicate Detection:**
- Check for existing records
- Ask user if they want to continue
- Option to edit existing vs create new

**Permission Denied:**
- Check user auth
- Verify ownership
- Show friendly error message

---

## Code Examples

### Creating a New Item

```typescript
// API call
const response = await fetch('/api/feature/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Example',
    description: 'Description'
  })
})

const data = await response.json()
```

### Querying Data

```typescript
// Supabase query
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

---

## Testing & Verification

### Manual Test Plan

**Prerequisites:**
- [ ] User logged in
- [ ] Test data prepared
- [ ] Browser dev tools open

**Test Steps:**
1. Navigate to `/feature`
2. Click "Create New"
3. Fill in form with test data
4. Submit form
5. Verify success message
6. Verify redirect to detail page
7. Verify data in database

**Expected Results:**
- ✅ Form submits without errors
- ✅ Success message displays
- ✅ Redirect happens smoothly
- ✅ Data saved correctly
- ✅ UI updates appropriately

### Automated Tests (if they exist)

```bash
# Run feature tests
npm test -- feature.test.ts

# Expected: All tests pass
```

### Database Verification

```sql
-- Check data created
SELECT * FROM table_name 
WHERE user_id = '[test-user-id]' 
ORDER BY created_at DESC 
LIMIT 5;

-- Expected: See new record with correct data
```

---

## Common Issues & Solutions

### Issue 1: [Common Problem]

**Symptoms:**
- What the user sees/experiences

**Cause:**
- Why this happens

**Solution:**
```typescript
// Code fix or workaround
```

**Prevention:**
- How to avoid this in the future

---

## Dependencies

**Required Features:**
- Authentication system
- Database connection
- Token system (if uses AI)

**External Services:**
- OpenAI (if applicable)
- Supabase (always)
- AWS S3 (if applicable)

**NPM Packages:**
```json
{
  "required-package": "^1.0.0"
}
```

---

## Configuration

**Environment Variables:**
```bash
FEATURE_API_KEY=xxx
FEATURE_ENABLED=true
```

**Feature Flags:**
```typescript
const FEATURE_CONFIG = {
  maxItemsPerUser: 100,
  enableAdvancedMode: true,
  cacheTimeout: 3600
}
```

---

## Version History

| Version | Date | Changes | Breaking? |
|---------|------|---------|-----------|
| v1.2.0 | 2024-11-18 | Added advanced filtering | No |
| v1.1.0 | 2024-11-15 | Added bulk operations | No |
| v1.0.0 | 2024-11-01 | Initial release | - |

---

## Migration Guide (if applicable)

### Upgrading from v1.x to v2.0

**Breaking Changes:**
- API endpoint changed from `/api/old` to `/api/new`
- Database column renamed: `old_name` → `new_name`

**Migration Steps:**
1. Run database migration: `supabase migration up`
2. Update API calls in frontend
3. Clear cache: `npm run cache:clear`
4. Test thoroughly

**Rollback Plan:**
```bash
# If something breaks
supabase migration down
git revert [commit-hash]
```

---

## Performance Considerations

**Bottlenecks:**
- Large dataset queries (>10k records)
- Complex joins across multiple tables

**Optimizations:**
- Add index on `user_id` column
- Implement pagination (50 items per page)
- Cache frequently accessed data

**Monitoring:**
- Track API response times
- Monitor database query performance
- Set up alerts for >2s response time

---

## Security Considerations

**Authentication:**
- Requires valid session token
- Check user ownership before modifications

**Authorization:**
- Verify user has permission to access resource
- Admin-only endpoints protected

**Data Validation:**
- Sanitize all user inputs
- Validate data types and formats
- Prevent SQL injection (use parameterized queries)

**RLS Policies:**
```sql
-- Supabase RLS policy
CREATE POLICY "Users can only see their own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);
```

---

## Monitoring & Debugging

**Logs to Check:**
```bash
# API logs
grep "feature" .next/trace

# Database logs
supabase logs --type database | grep table_name
```

**Common Error Messages:**
- `"Feature not found"` → Check if record exists
- `"Permission denied"` → Verify user ownership
- `"Validation failed"` → Check input data

**Debug Mode:**
```typescript
// Enable detailed logging
const DEBUG = process.env.NODE_ENV === 'development'
if (DEBUG) console.log('Feature operation:', data)
```

---

## Related Features

- **[Other Feature]** - Uses this feature's data
- **[Another Feature]** - Depends on this feature

---

## Future Enhancements

### Planned (Next 30 Days)
- [ ] Enhancement 1
- [ ] Enhancement 2

### Backlog (Future)
- [ ] Nice-to-have 1
- [ ] Nice-to-have 2

### Won't Do (Rejected Ideas)
- ❌ Rejected idea 1 (reason: performance concerns)
- ❌ Rejected idea 2 (reason: out of scope)

---

## Questions & Answers

**Q: Why did we build it this way?**
A: [Architectural decision explanation]

**Q: Can we scale this to millions of users?**
A: [Scalability considerations]

**Q: What happens if external service fails?**
A: [Failure handling strategy]

---

## Contact & Support

**Questions?** Ask in #feature-name channel  
**Issues?** File in GitHub with `feature-name` label  
**Urgent?** Contact [owner] directly

---

**Last verified working:** [Date]  
**Next review date:** [Date + 30 days]

