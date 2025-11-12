# Household Accounts Architecture

## Overview

VibrationFit offers two subscription plans:
- **Solo**: Individual account, individual billing, individual tokens
- **Household**: Admin + invited members, shared billing, optional token sharing

## Database Schema

### 1. New Table: `households`

Represents a household subscription unit.

```sql
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'My Household',
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription info
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
  plan_type TEXT CHECK (plan_type IN ('solo', 'household')) DEFAULT 'household',
  
  -- Household settings
  max_members INTEGER DEFAULT 6, -- e.g., household plan includes up to 6 users
  shared_tokens_enabled BOOLEAN DEFAULT FALSE, -- Admin's global setting
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure household name uniqueness per admin (optional)
  UNIQUE(admin_user_id)
);

-- Index for quick admin lookups
CREATE INDEX idx_households_admin_user_id ON households(admin_user_id);
CREATE INDEX idx_households_stripe_customer_id ON households(stripe_customer_id);
```

### 2. New Table: `household_members`

Tracks which users belong to which household.

```sql
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Member role
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  
  -- Per-member token sharing preference
  allow_shared_tokens BOOLEAN DEFAULT TRUE, -- Member can opt-in/out
  
  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'active', 'removed')) DEFAULT 'pending',
  
  -- Metadata
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(household_id, user_id), -- User can only be in a household once
  UNIQUE(user_id) -- User can only be in ONE household at a time
);

-- Indexes
CREATE INDEX idx_household_members_household_id ON household_members(household_id);
CREATE INDEX idx_household_members_user_id ON household_members(user_id);
CREATE INDEX idx_household_members_status ON household_members(status);
```

### 3. New Table: `household_invitations`

Tracks pending invitations (before user accepts or creates account).

```sql
CREATE TABLE household_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invitation_token TEXT NOT NULL UNIQUE, -- Secure token for accepting invite
  
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')) DEFAULT 'pending',
  
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate pending invitations
  UNIQUE(household_id, invited_email, status)
);

-- Indexes
CREATE INDEX idx_household_invitations_token ON household_invitations(invitation_token);
CREATE INDEX idx_household_invitations_email ON household_invitations(invited_email);
CREATE INDEX idx_household_invitations_status ON household_invitations(status);
```

### 4. Update `user_profiles` Table

Add household-related fields to existing user_profiles:

```sql
-- Add these columns to existing user_profiles table
ALTER TABLE user_profiles 
  ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  ADD COLUMN is_household_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN allow_shared_tokens BOOLEAN DEFAULT TRUE; -- User's personal preference

-- Index for quick household member lookups
CREATE INDEX idx_user_profiles_household_id ON user_profiles(household_id);
```

### 5. Token Tracking Enhancement

The existing token tracking should work with these additions:

```sql
-- EXISTING COLUMNS in user_profiles (no changes needed):
-- vibe_assistant_tokens_used INTEGER DEFAULT 0
-- vibe_assistant_tokens_remaining INTEGER DEFAULT 100
-- vibe_assistant_total_cost DECIMAL(10,2) DEFAULT 0

-- NEW: Computed view for household token totals
CREATE OR REPLACE VIEW household_token_summary AS
SELECT 
  h.id AS household_id,
  h.name AS household_name,
  h.admin_user_id,
  h.shared_tokens_enabled,
  
  -- Admin tokens
  admin_profile.vibe_assistant_tokens_remaining AS admin_tokens_remaining,
  admin_profile.vibe_assistant_tokens_used AS admin_tokens_used,
  
  -- Household cumulative totals
  COALESCE(SUM(up.vibe_assistant_tokens_remaining), 0) AS household_tokens_remaining,
  COALESCE(SUM(up.vibe_assistant_tokens_used), 0) AS household_tokens_used,
  
  -- Member count
  COUNT(hm.id) AS member_count,
  
  -- Members with sharing enabled
  COUNT(hm.id) FILTER (WHERE hm.allow_shared_tokens = TRUE) AS sharing_enabled_count
  
FROM households h
LEFT JOIN household_members hm ON hm.household_id = h.id AND hm.status = 'active'
LEFT JOIN user_profiles up ON up.user_id = hm.user_id
LEFT JOIN user_profiles admin_profile ON admin_profile.user_id = h.admin_user_id
GROUP BY h.id, h.name, h.admin_user_id, h.shared_tokens_enabled,
         admin_profile.vibe_assistant_tokens_remaining,
         admin_profile.vibe_assistant_tokens_used;
```

---

## Token Sharing Logic

### How Token Deduction Works

#### Scenario 1: Solo User (no household)
```
User has 100 tokens remaining.
User spends 10 tokens on AI operation.
User now has 90 tokens remaining.
```

#### Scenario 2: Household Member with Shared Tokens DISABLED
```
Member has 100 tokens remaining.
Member spends 10 tokens.
Member now has 90 tokens.
Cannot exceed their individual quota.
```

#### Scenario 3: Household Member with Shared Tokens ENABLED
```
Admin has 500 tokens remaining.
Member A has 20 tokens remaining.
Member B has 5 tokens remaining.

Household cumulative: 525 tokens

Member B wants to spend 30 tokens:
1. Check Member B's individual balance: 5 tokens (insufficient)
2. Check if shared_tokens_enabled: YES (household setting)
3. Check if Member B opted in: YES (allow_shared_tokens = true)
4. Check household cumulative: 525 tokens (sufficient)
5. Deduct from Member B first: 5 tokens used, 0 remaining
6. Deduct remainder from admin: 25 tokens used
7. Admin now has 475 tokens remaining
8. Household cumulative: 500 tokens
```

### Token Purchase Flow

```
Admin purchases 1000 token pack:
1. Tokens added to admin's user_profile.vibe_assistant_tokens_remaining
2. Automatically available to household if shared_tokens_enabled = TRUE
3. Members with allow_shared_tokens = TRUE can pull from this pool
```

---

## User Flows

### Flow 1: Admin Creates Household

1. User signs up for VibrationFit
2. On subscription page, chooses **"Household Plan"** (vs. "Solo Plan")
3. Enters household name: "The Jordan Household"
4. Completes Stripe checkout
5. System creates:
   - `households` record with `admin_user_id = user.id`
   - `household_members` record with `role = 'admin'`
   - Updates `user_profiles.household_id` and `is_household_admin = true`
6. Redirected to `/household/settings` to invite members

### Flow 2: Admin Invites Member

1. Admin goes to `/household/settings`
2. Clicks "Invite Member"
3. Enters email: `sarah@example.com`
4. System:
   - Creates `household_invitations` record
   - Generates secure `invitation_token`
   - Sends email with link: `https://vibrationfit.com/invite/{token}`
5. Email recipient clicks link

### Flow 3: Member Accepts Invitation (Existing User)

1. User clicks invitation link with token
2. If logged in:
   - Shows: "Join The Jordan Household?"
   - Accept button
3. On accept:
   - Updates `household_invitations.status = 'accepted'`
   - Creates `household_members` record
   - Updates `user_profiles.household_id`
   - Redirected to dashboard with household context

### Flow 4: Member Accepts Invitation (New User)

1. User clicks invitation link (not logged in)
2. Redirected to `/signup?invite={token}`
3. Completes signup flow
4. After email verification:
   - Automatically joins household
   - No subscription required (covered by admin)
   - Starts with default token allocation

### Flow 5: Admin Removes Member

1. Admin goes to `/household/settings/members`
2. Clicks "Remove" next to member
3. Confirmation modal: "Remove Sarah from household?"
4. On confirm:
   - Updates `household_members.status = 'removed'`
   - Updates `household_members.removed_at = NOW()`
   - Keeps `user_profiles.household_id` temporarily (for recovery)
5. Member receives email: "You've been removed from The Jordan Household"

### Flow 6: Removed Member Creates Solo Account

1. Member logs in after being removed
2. Dashboard shows: "You're no longer part of a household"
3. Options:
   - **"Start Solo Plan"** - Become admin of own account
   - **"Contact Admin"** - Request to be re-added
4. If "Start Solo Plan":
   - Creates new `households` record with `plan_type = 'solo'`
   - Updates `household_members.role = 'admin'`
   - Updates `user_profiles.is_household_admin = true`
   - Redirected to subscription checkout
   - Gets default token allocation (100 tokens)

### Flow 7: Member Opts Into/Out of Shared Tokens

1. Member goes to `/settings/tokens`
2. Sees toggle: "Use shared household tokens when my tokens run out"
3. Toggle updates `household_members.allow_shared_tokens`
4. Shows preview:
   ```
   Your tokens: 10
   Available shared tokens: 450 (if enabled)
   Total available: 460 (if enabled) or 10 (if disabled)
   ```

---

## API Endpoints

### `POST /api/household/create`

Create a new household (admin only, during signup/upgrade).

**Request:**
```json
{
  "name": "The Jordan Household",
  "plan_type": "household",
  "stripe_subscription_id": "sub_xyz"
}
```

**Response:**
```json
{
  "household": {
    "id": "uuid",
    "name": "The Jordan Household",
    "admin_user_id": "uuid",
    "max_members": 6,
    "shared_tokens_enabled": false
  }
}
```

### `POST /api/household/invite`

Invite a member to the household (admin only).

**Request:**
```json
{
  "household_id": "uuid",
  "email": "sarah@example.com"
}
```

**Response:**
```json
{
  "invitation": {
    "id": "uuid",
    "invited_email": "sarah@example.com",
    "invitation_token": "secure_token_123",
    "expires_at": "2025-11-19T...",
    "status": "pending"
  },
  "email_sent": true
}
```

### `POST /api/household/accept-invite`

Accept a household invitation.

**Request:**
```json
{
  "invitation_token": "secure_token_123"
}
```

**Response:**
```json
{
  "success": true,
  "household": {
    "id": "uuid",
    "name": "The Jordan Household"
  },
  "member": {
    "role": "member",
    "status": "active"
  }
}
```

### `GET /api/household/members`

Get all members of the household (admin only).

**Response:**
```json
{
  "members": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "email": "jordan@example.com",
      "first_name": "Jordan",
      "role": "admin",
      "status": "active",
      "tokens_remaining": 500,
      "tokens_used": 100,
      "allow_shared_tokens": true
    },
    {
      "id": "uuid",
      "user_id": "uuid",
      "email": "sarah@example.com",
      "first_name": "Sarah",
      "role": "member",
      "status": "active",
      "tokens_remaining": 75,
      "tokens_used": 25,
      "allow_shared_tokens": true
    }
  ],
  "household_summary": {
    "total_tokens_remaining": 575,
    "total_tokens_used": 125,
    "shared_tokens_enabled": true,
    "member_count": 2
  }
}
```

### `DELETE /api/household/members/:memberId`

Remove a member from the household (admin only).

**Response:**
```json
{
  "success": true,
  "removed_user_email": "sarah@example.com"
}
```

### `PATCH /api/household/settings`

Update household settings (admin only).

**Request:**
```json
{
  "name": "Updated Household Name",
  "shared_tokens_enabled": true
}
```

### `POST /api/household/convert-to-solo`

Convert removed member to solo admin.

**Request:**
```json
{
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "new_household": {
    "id": "uuid",
    "plan_type": "solo",
    "admin_user_id": "uuid"
  },
  "redirect_to": "/subscribe?plan=solo"
}
```

---

## Token Deduction Function

Server-side function to handle token deduction with household sharing:

```typescript
// File: /src/lib/viva/deduct-tokens.ts

import { createClient } from '@/lib/supabase/server'

export async function deductTokens(
  userId: string,
  tokenAmount: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // 1. Get user profile with household info
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select(`
      *,
      household:households!user_profiles_household_id_fkey(
        id,
        admin_user_id,
        shared_tokens_enabled
      ),
      household_member:household_members!household_members_user_id_fkey(
        allow_shared_tokens
      )
    `)
    .eq('user_id', userId)
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'User profile not found' }
  }

  const userTokens = profile.vibe_assistant_tokens_remaining || 0

  // 2. Check if user has enough tokens individually
  if (userTokens >= tokenAmount) {
    // Simple case: deduct from user's own tokens
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        vibe_assistant_tokens_remaining: userTokens - tokenAmount,
        vibe_assistant_tokens_used: profile.vibe_assistant_tokens_used + tokenAmount
      })
      .eq('user_id', userId)

    if (updateError) {
      return { success: false, error: 'Failed to deduct tokens' }
    }

    return { success: true }
  }

  // 3. User doesn't have enough tokens - check household sharing
  const household = profile.household
  const householdMember = profile.household_member?.[0]

  if (!household || !household.shared_tokens_enabled || !householdMember?.allow_shared_tokens) {
    return { success: false, error: 'Insufficient tokens' }
  }

  // 4. Get admin's token balance
  const { data: adminProfile, error: adminError } = await supabase
    .from('user_profiles')
    .select('vibe_assistant_tokens_remaining, vibe_assistant_tokens_used')
    .eq('user_id', household.admin_user_id)
    .single()

  if (adminError || !adminProfile) {
    return { success: false, error: 'Household admin not found' }
  }

  const adminTokens = adminProfile.vibe_assistant_tokens_remaining || 0
  const neededFromAdmin = tokenAmount - userTokens

  // 5. Check if household has enough cumulative tokens
  if (adminTokens < neededFromAdmin) {
    return { success: false, error: 'Insufficient household tokens' }
  }

  // 6. Deduct from both user and admin
  const { error: batchError } = await supabase.rpc('deduct_tokens_from_household', {
    p_user_id: userId,
    p_admin_id: household.admin_user_id,
    p_user_deduction: userTokens,
    p_admin_deduction: neededFromAdmin,
    p_total_usage: tokenAmount
  })

  if (batchError) {
    return { success: false, error: 'Failed to deduct tokens from household' }
  }

  return { success: true }
}
```

### Database Function for Atomic Token Deduction

```sql
-- Supabase function for atomic token deduction
CREATE OR REPLACE FUNCTION deduct_tokens_from_household(
  p_user_id UUID,
  p_admin_id UUID,
  p_user_deduction INTEGER,
  p_admin_deduction INTEGER,
  p_total_usage INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Deduct from user
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = vibe_assistant_tokens_remaining - p_user_deduction,
    vibe_assistant_tokens_used = vibe_assistant_tokens_used + p_user_deduction
  WHERE user_id = p_user_id;

  -- Deduct remainder from admin
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = vibe_assistant_tokens_remaining - p_admin_deduction,
    vibe_assistant_tokens_used = vibe_assistant_tokens_used + p_admin_deduction
  WHERE user_id = p_admin_id;
END;
$$ LANGUAGE plpgsql;
```

---

## UI Components

### Household Dashboard Header

```tsx
// Shows household context at top of dashboard
import { Users, Settings } from 'lucide-react'
import { Badge, Button } from '@/lib/design-system/components'

export function HouseholdHeader({ household }: { household: Household }) {
  return (
    <div className="bg-[#1F1F1F] border-2 border-[#333] rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{household.name}</h2>
            <p className="text-sm text-neutral-400">
              {household.member_count} members · {household.total_tokens_remaining} tokens available
            </p>
          </div>
        </div>
        
        {household.is_admin && (
          <Button variant="ghost" href="/household/settings">
            <Settings className="w-4 h-4 mr-2" />
            Manage Household
          </Button>
        )}
      </div>
      
      {household.shared_tokens_enabled && (
        <Badge variant="success" className="mt-4">
          Token sharing enabled - members can use shared tokens
        </Badge>
      )}
    </div>
  )
}
```

### Token Balance Display (Enhanced for Household)

```tsx
// Shows individual + household tokens
export function TokenBalanceCard({ 
  userTokens, 
  householdTokens, 
  sharedEnabled,
  userAllowsSharing 
}: TokenBalanceProps) {
  return (
    <Card variant="elevated">
      <h3 className="text-xl font-semibold mb-4">Token Balance</h3>
      
      {/* Individual tokens */}
      <div className="mb-4">
        <p className="text-sm text-neutral-400">Your Tokens</p>
        <p className="text-3xl font-bold text-primary-500">{userTokens}</p>
      </div>
      
      {/* Household tokens (if applicable) */}
      {householdTokens && (
        <div className="pt-4 border-t-2 border-[#333]">
          <p className="text-sm text-neutral-400">Household Total</p>
          <p className="text-2xl font-bold text-secondary-500">{householdTokens}</p>
          
          {sharedEnabled && userAllowsSharing && (
            <Badge variant="info" className="mt-2">
              You can use shared tokens
            </Badge>
          )}
        </div>
      )}
      
      <Button variant="accent" className="mt-6 w-full">
        Purchase Token Pack
      </Button>
    </Card>
  )
}
```

### Household Settings Page (Admin Only)

```tsx
// /household/settings/page.tsx
export default function HouseholdSettings() {
  return (
    <PageLayout>
      <Container>
        <h1 className="text-4xl font-bold mb-8">Household Settings</h1>
        
        {/* Basic Settings */}
        <Card className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Basic Settings</h2>
          <Input label="Household Name" defaultValue="The Jordan Household" />
          <Toggle 
            label="Enable Shared Tokens" 
            description="Allow members to use your tokens when theirs run out"
          />
        </Card>
        
        {/* Members List */}
        <Card className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Members</h2>
          <Button variant="primary">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
          
          <div className="mt-6 space-y-4">
            {members.map(member => (
              <MemberRow key={member.id} member={member} />
            ))}
          </div>
        </Card>
        
        {/* Pending Invitations */}
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Pending Invitations</h2>
          {/* List of pending invites */}
        </Card>
      </Container>
    </PageLayout>
  )
}
```

---

## Pricing Page Updates

### Plan Comparison Table

```tsx
<div className="grid md:grid-cols-2 gap-8">
  {/* Solo Plan */}
  <Card variant="elevated">
    <h3 className="text-3xl font-bold mb-2">Solo</h3>
    <p className="text-5xl font-bold mb-6">$29<span className="text-xl">/mo</span></p>
    <ul className="space-y-3 mb-8">
      <li>✓ 1 user account</li>
      <li>✓ 100 AI tokens/month</li>
      <li>✓ Unlimited visions</li>
      <li>✓ Full feature access</li>
    </ul>
    <Button variant="primary" className="w-full">
      Start Solo Plan
    </Button>
  </Card>
  
  {/* Household Plan */}
  <Card variant="elevated" className="border-primary-500">
    <Badge variant="premium">Best Value</Badge>
    <h3 className="text-3xl font-bold mb-2">Household</h3>
    <p className="text-5xl font-bold mb-6">$49<span className="text-xl">/mo</span></p>
    <ul className="space-y-3 mb-8">
      <li>✓ Up to 6 user accounts</li>
      <li>✓ 100 tokens per member (600 total)</li>
      <li>✓ Optional token sharing</li>
      <li>✓ One admin manages billing</li>
      <li>✓ Invite by email</li>
    </ul>
    <Button variant="accent" className="w-full">
      Start Household Plan
    </Button>
  </Card>
</div>
```

---

## Migration Strategy

### Step 1: Database Migrations

```sql
-- Migration 1: Create households tables
-- File: supabase/migrations/20251112000000_create_households.sql
-- (See schema above)

-- Migration 2: Update user_profiles
-- File: supabase/migrations/20251112000001_add_household_to_profiles.sql
ALTER TABLE user_profiles 
  ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  ADD COLUMN is_household_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN allow_shared_tokens BOOLEAN DEFAULT TRUE;

-- Migration 3: Migrate existing users to solo households
-- File: supabase/migrations/20251112000002_migrate_existing_users.sql
INSERT INTO households (admin_user_id, plan_type, name)
SELECT 
  id,
  'solo',
  CONCAT(COALESCE(first_name, 'User'), '''s Account')
FROM auth.users;

UPDATE user_profiles
SET 
  household_id = (SELECT id FROM households WHERE admin_user_id = user_profiles.user_id),
  is_household_admin = TRUE;
```

### Step 2: Update Token Deduction Logic

Replace all direct token deductions with the new `deductTokens()` function.

### Step 3: Add UI Components

1. Household settings page
2. Invitation flow
3. Member management
4. Token balance displays

### Step 4: Update Pricing/Subscription Flow

1. Add household plan to Stripe
2. Update pricing page
3. Add household creation during checkout

---

## Row Level Security (RLS) Policies

```sql
-- Households: Users can only view their own household
CREATE POLICY "Users can view their household" ON households
FOR SELECT USING (
  admin_user_id = auth.uid() OR
  id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND status = 'active')
);

-- Only admin can update
CREATE POLICY "Admin can update household" ON households
FOR UPDATE USING (admin_user_id = auth.uid());

-- Household Members: Members can view all members in their household
CREATE POLICY "Members can view household members" ON household_members
FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Only admin can insert/delete members
CREATE POLICY "Admin can manage members" ON household_members
FOR ALL USING (
  household_id IN (
    SELECT id FROM households WHERE admin_user_id = auth.uid()
  )
);

-- Household Invitations: Admin can manage, invitee can view their own
CREATE POLICY "Invitations visibility" ON household_invitations
FOR SELECT USING (
  invited_by = auth.uid() OR
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
```

---

## Testing Scenarios

### Test 1: Solo User Upgrades to Household
1. User is on solo plan with 50 tokens
2. Upgrades to household plan
3. Invites 2 members
4. Each member gets 100 tokens
5. Total household: 250 tokens

### Test 2: Token Sharing Enabled
1. Admin has 500 tokens
2. Member has 10 tokens
3. Member tries to use 50 tokens
4. System uses member's 10, then admin's 40
5. Admin: 460 tokens, Member: 0 tokens

### Test 3: Token Sharing Disabled
1. Admin has 500 tokens, sharing disabled
2. Member has 10 tokens
3. Member tries to use 50 tokens
4. System rejects (insufficient tokens)

### Test 4: Member Removed → Creates Solo
1. Admin removes member
2. Member logs in, sees "removed" status
3. Clicks "Create Solo Account"
4. Gets redirected to subscription page
5. After payment, becomes admin of own household

---

## Next Steps for Implementation

1. **Create database migrations** (3 new tables + user_profiles updates)
2. **Build API routes** (household creation, invitations, member management)
3. **Update token deduction logic** (add household sharing)
4. **Build household settings UI** (admin dashboard, member management)
5. **Update pricing page** (show Solo vs. Household)
6. **Add invitation flow** (email invites, acceptance flow)
7. **Update navigation** (show household context when applicable)
8. **Testing** (all scenarios above)

Would you like me to start implementing any specific part of this? I can:
1. Create the migration files
2. Build the API endpoints
3. Create the household settings UI
4. Update the token deduction logic
5. Or tackle it in a specific order you prefer

