# Household Accounts - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Run Database Migrations

```bash
# Option A: Using Supabase CLI (recommended)
cd /Users/jordanbuckingham/Desktop/vibrationfit
supabase db push

# Option B: Manual (via Supabase Dashboard)
# 1. Open Supabase Dashboard → SQL Editor
# 2. Run migration files in order:
#    - supabase/migrations/20251112000000_create_households.sql
#    - supabase/migrations/20251112000001_add_household_to_profiles.sql
```

### Step 2: Verify Migration Success

```sql
-- Run this in Supabase SQL Editor
SELECT 
  (SELECT COUNT(*) FROM households) as total_households,
  (SELECT COUNT(*) FROM user_profiles WHERE household_id IS NOT NULL) as users_with_household,
  (SELECT COUNT(*) FROM user_profiles) as total_users;

-- All users should have household_id assigned
```

### Step 3: Test API Endpoints

```bash
# Get your household
curl -X GET "https://your-site.com/api/household" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Invite a member (admin only)
curl -X POST "https://your-site.com/api/household/invite" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 📋 Feature Checklist

### ✅ **DONE (Backend)**
- [x] Database schema (3 tables, 1 view, 3 functions)
- [x] User profiles updated with household fields
- [x] Auto-migration of existing users to solo households
- [x] TypeScript utilities library
- [x] 5 API routes (household, invite, accept, members, convert)
- [x] Token validation with household sharing
- [x] Token deduction with household sharing
- [x] RLS security policies
- [x] Comprehensive documentation

### 🚧 **TODO (Frontend)**
- [ ] Household settings page
- [ ] Invitation acceptance page
- [ ] Household token balance component
- [ ] Dashboard household context indicator
- [ ] Pricing page updates
- [ ] Subscription flow integration
- [ ] Email templates

---

## 🎨 UI Implementation Priority

### **Phase 1: Core Functionality (Week 1)**

#### 1. Household Settings Page
**File:** `/src/app/household/settings/page.tsx`

```tsx
import { getUserHousehold, getHouseholdWithMembers } from '@/lib/supabase/household'

export default async function HouseholdSettings() {
  const household = await getUserHousehold(userId)
  const { members } = await getHouseholdWithMembers(household.id)
  
  return (
    <div>
      {/* Household name form */}
      {/* Shared tokens toggle */}
      {/* Members list */}
      {/* Invite member form */}
    </div>
  )
}
```

#### 2. Invitation Acceptance Page
**File:** `/src/app/invite/[token]/page.tsx`

```tsx
'use client'

export default function AcceptInvite({ params }: { params: { token: string } }) {
  // Fetch invitation details via /api/household/invite?token=...
  // Show household name and inviter
  // Button to accept → POST /api/household/invite/accept
}
```

#### 3. Token Balance Component
**File:** `/src/components/household/TokenBalanceCard.tsx`

```tsx
export function TokenBalanceCard({ userId }: { userId: string }) {
  // Fetch user's tokens
  // Fetch household tokens
  // Display both with indication of sharing status
}
```

---

### **Phase 2: Polish (Week 2)**

#### 4. Dashboard Header
Update existing dashboard to show household context

#### 5. Pricing Page
Update with Solo vs Household comparison

#### 6. Subscription Flow
Add household plan option during checkout

---

## 🔧 Common Code Patterns

### Fetch User's Household

```typescript
import { getUserHousehold } from '@/lib/supabase/household'

const household = await getUserHousehold(userId)
if (household) {
  console.log('User is in household:', household.name)
  console.log('Is admin:', household.admin_user_id === userId)
}
```

### Check Token Sharing Status

```typescript
import { canUseSharedTokens } from '@/lib/supabase/household'

const canShare = await canUseSharedTokens(userId)
if (canShare) {
  console.log('User can use shared household tokens')
}
```

### Invite a Member

```typescript
// Client-side
const response = await fetch('/api/household/invite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'member@example.com' })
})

const data = await response.json()
console.log('Invitation URL:', data.invitation_url)
// Send this URL via email
```

### Accept Invitation

```typescript
// Client-side
const response = await fetch('/api/household/invite/accept', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ invitation_token: token })
})

const data = await response.json()
if (data.success) {
  // Redirect to dashboard
  window.location.href = '/dashboard'
}
```

### Get Household Token Summary

```typescript
import { getHouseholdTokenSummary } from '@/lib/supabase/household'

const summary = await getHouseholdTokenSummary(householdId)
console.log('Total tokens:', summary.household_tokens_remaining)
console.log('Members:', summary.member_count)
console.log('Sharing enabled:', summary.shared_tokens_enabled)
```

---

## 🎯 Design System Integration

All UI components should use your existing design system:

```tsx
import { 
  Card, 
  Button, 
  Badge, 
  Input,
  Toggle 
} from '@/lib/design-system/components'

// Household context indicator
<Badge variant="premium">
  <Users className="w-4 h-4 mr-2" />
  Household Plan
</Badge>

// Token balance card
<Card variant="elevated" className="p-8">
  <h3 className="text-2xl font-bold text-primary-500">
    {tokens} Tokens
  </h3>
  <p className="text-sm text-neutral-400">
    {householdTokens} household tokens available
  </p>
</Card>

// Invite member button
<Button variant="primary" onClick={handleInvite}>
  <UserPlus className="w-4 h-4 mr-2" />
  Invite Member
</Button>
```

**Colors to use:**
- **Primary Green** (`#199D67`) - Household features, success states
- **Secondary Teal** (`#14B8A6`) - Shared tokens indicator
- **Accent Purple** (`#8B5CF6`) - Premium household plan
- **Energy Yellow** (`#FFB701`) - Admin role indicator

---

## 🧪 Testing Scenarios

### Scenario 1: New User Signs Up
1. User completes signup
2. Auto-gets solo household (via trigger)
3. Sees "Solo Plan" in dashboard
4. Can upgrade to household plan

### Scenario 2: Admin Invites Member
1. Admin goes to household settings
2. Enters member email
3. Invitation created, email sent (you'll need to implement email)
4. Invitation expires in 7 days

### Scenario 3: Member Accepts Invite
1. Member clicks invitation link
2. Sees household name and inviter
3. Clicks "Accept"
4. Joins household, redirected to dashboard
5. Sees household context in header

### Scenario 4: Token Sharing Enabled
1. Admin enables shared tokens
2. Member has 10 tokens, wants to use 50
3. System checks: member (10) + admin (500) = 510 total
4. Deducts: member (10) + admin (40) = 50 total
5. Operation succeeds
6. Member: 0 tokens, Admin: 460 tokens

### Scenario 5: Member Removed
1. Admin removes member
2. Member logs in, sees "You've been removed"
3. Options: "Create Solo Account" or contact admin
4. If creates solo: new household created, redirected to subscribe
5. Member becomes admin of own solo household

---

## 📊 Admin Monitoring

### View All Households

```sql
SELECT 
  h.name,
  h.plan_type,
  h.shared_tokens_enabled,
  COUNT(hm.id) as member_count,
  SUM(up.vibe_assistant_tokens_remaining) as total_tokens
FROM households h
LEFT JOIN household_members hm ON hm.household_id = h.id AND hm.status = 'active'
LEFT JOIN user_profiles up ON up.user_id = hm.user_id
GROUP BY h.id, h.name, h.plan_type, h.shared_tokens_enabled
ORDER BY total_tokens DESC;
```

### View Pending Invitations

```sql
SELECT 
  hi.invited_email,
  h.name as household_name,
  hi.created_at,
  hi.expires_at,
  hi.status
FROM household_invitations hi
JOIN households h ON h.id = hi.household_id
WHERE hi.status = 'pending'
ORDER BY hi.created_at DESC;
```

### View Token Sharing Usage

```sql
-- Find members who are using shared tokens
SELECT 
  up.user_id,
  up.email,
  up.vibe_assistant_tokens_remaining as user_tokens,
  h.name as household_name,
  admin_up.vibe_assistant_tokens_remaining as admin_tokens,
  hm.allow_shared_tokens
FROM user_profiles up
JOIN household_members hm ON hm.user_id = up.user_id
JOIN households h ON h.id = hm.household_id
JOIN user_profiles admin_up ON admin_up.user_id = h.admin_user_id
WHERE 
  h.shared_tokens_enabled = true
  AND hm.allow_shared_tokens = true
  AND up.vibe_assistant_tokens_remaining < 50
ORDER BY up.vibe_assistant_tokens_remaining ASC;
```

---

## 🔒 Security Notes

### What's Protected:
✅ RLS ensures users can only see their own household
✅ Admin-only actions properly gated
✅ Token deduction is atomic (no race conditions)
✅ Invitations expire automatically
✅ Users can only be in one household at a time

### What You Should Add:
- Rate limiting on invitation creation (prevent spam)
- Email verification before invitation acceptance
- Audit log for admin actions (who removed whom, when)
- Two-factor auth for admin actions (optional)

---

## 📧 Email Integration (TODO)

You'll need to implement email sending for:

### 1. Invitation Email
```typescript
// Template: invitation-email.tsx
Subject: You're invited to join [Household Name] on VibrationFit

Body:
[Inviter Name] has invited you to join their household on VibrationFit.

[Accept Invitation Button] → links to /invite/[token]

This invitation expires in 7 days.
```

### 2. Member Removed Email
```typescript
// Template: member-removed-email.tsx
Subject: Update to your VibrationFit household

Body:
You've been removed from [Household Name].

Your data is safe and you can:
1. Create your own solo account
2. Contact [Admin Email] for questions

[Create Solo Account] → links to /household/convert-to-solo
```

### 3. Admin Notification
```typescript
// Template: member-joined-email.tsx
Subject: [Member Name] joined your household

Body:
[Member Name] ([Email]) has accepted your invitation and joined [Household Name].

[View Household Members] → links to /household/settings
```

---

## 🆘 Troubleshooting

### Migration Fails
**Problem:** Migration won't run
**Solution:** 
1. Check Supabase logs
2. Ensure auth.users table exists
3. Run migrations in order (000000 before 000001)

### User Not Auto-Migrated
**Problem:** Existing user has no household_id
**Solution:**
```sql
-- Manually create household for user
DO $$
DECLARE
  user_uuid UUID := 'USER_ID_HERE';
  new_household_id UUID;
BEGIN
  -- Create household
  INSERT INTO households (admin_user_id, name, plan_type)
  VALUES (user_uuid, 'My Account', 'solo')
  RETURNING id INTO new_household_id;
  
  -- Create member record
  INSERT INTO household_members (household_id, user_id, role, status)
  VALUES (new_household_id, user_uuid, 'admin', 'active');
  
  -- Update profile
  UPDATE user_profiles
  SET household_id = new_household_id, is_household_admin = true
  WHERE user_id = user_uuid;
END $$;
```

### Token Deduction Not Working
**Problem:** Tokens not being deducted properly
**Solution:**
1. Check console logs for errors
2. Verify household sharing settings:
```sql
SELECT 
  up.user_id,
  h.shared_tokens_enabled,
  hm.allow_shared_tokens
FROM user_profiles up
JOIN household_members hm ON hm.user_id = up.user_id
JOIN households h ON h.id = hm.household_id
WHERE up.user_id = 'USER_ID_HERE';
```
3. Test with `deductTokens()` function directly

### Invitation Not Working
**Problem:** Invitation can't be accepted
**Solution:**
1. Check expiration: `SELECT expires_at FROM household_invitations WHERE invitation_token = 'TOKEN'`
2. Check status: `SELECT status FROM household_invitations WHERE invitation_token = 'TOKEN'`
3. Verify user isn't already in a household

---

## 📞 Quick Help

**Architecture:** See `/docs/architecture/HOUSEHOLD_ACCOUNTS_ARCHITECTURE.md`
**Summary:** See `/docs/HOUSEHOLD_IMPLEMENTATION_SUMMARY.md`
**This Guide:** `/docs/HOUSEHOLD_QUICK_START.md`

**Key Files:**
- Database: `/supabase/migrations/20251112000000*.sql`
- Library: `/src/lib/supabase/household.ts`
- Token Logic: `/src/lib/tokens/tracking.ts`
- APIs: `/src/app/api/household/**/route.ts`

---

**Last Updated:** November 12, 2025
**Status:** Ready for UI implementation 🚀

