-- Household Accounts System
-- Creates tables for Solo vs. Household subscription plans with token sharing

-- =====================================================================
-- 1. HOUSEHOLDS TABLE
-- =====================================================================
-- Represents a household subscription unit (solo or multi-user)

CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'My Household',
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription info
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')) DEFAULT 'active',
  plan_type TEXT CHECK (plan_type IN ('solo', 'household')) DEFAULT 'household',
  
  -- Household settings
  max_members INTEGER DEFAULT 6, -- Household plan includes up to 6 users
  shared_tokens_enabled BOOLEAN DEFAULT FALSE, -- Admin's global setting for token sharing
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one household per admin
  UNIQUE(admin_user_id)
);

-- Indexes for performance
CREATE INDEX idx_households_admin_user_id ON households(admin_user_id);
CREATE INDEX idx_households_stripe_customer_id ON households(stripe_customer_id);
CREATE INDEX idx_households_subscription_status ON households(subscription_status);

-- =====================================================================
-- 2. HOUSEHOLD MEMBERS TABLE
-- =====================================================================
-- Tracks which users belong to which household

CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Member role
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  
  -- Per-member token sharing preference
  allow_shared_tokens BOOLEAN DEFAULT TRUE, -- Member can opt-in/out of using admin's tokens
  
  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'active', 'removed')) DEFAULT 'active',
  
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

-- =====================================================================
-- 3. HOUSEHOLD INVITATIONS TABLE
-- =====================================================================
-- Tracks pending invitations before user accepts or creates account

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
  
  -- Prevent duplicate pending invitations to same email
  UNIQUE(household_id, invited_email, status)
);

-- Indexes
CREATE INDEX idx_household_invitations_token ON household_invitations(invitation_token);
CREATE INDEX idx_household_invitations_email ON household_invitations(invited_email);
CREATE INDEX idx_household_invitations_status ON household_invitations(status);
CREATE INDEX idx_household_invitations_household_id ON household_invitations(household_id);

-- =====================================================================
-- 4. HOUSEHOLD TOKEN SUMMARY VIEW (DEPRECATED)
-- =====================================================================
-- NOTE: This view is deprecated because token balances are now calculated
-- on-the-fly from token_transactions and token_usage using get_user_token_balance()
-- Household token summaries should be calculated in the application layer
-- by calling get_user_token_balance() for each member and summing the results.

-- Drop the old view if it exists (it used deprecated token fields)
-- We don't recreate it because it would require expensive RPC calls in a view
DROP VIEW IF EXISTS household_token_summary CASCADE;

-- =====================================================================
-- 5. FUNCTIONS
-- =====================================================================

-- Function: Atomic token deduction from household (DEPRECATED)
-- NOTE: This function is deprecated because token balances are now calculated
-- on-the-fly from token_transactions and token_usage.
-- Token deductions are now handled by recording entries in the token_usage table.
-- The balance is automatically calculated by get_user_token_balance().
DROP FUNCTION IF EXISTS deduct_tokens_from_household(UUID, UUID, INTEGER, INTEGER);

-- Function: Get household summary for a user (UPDATED FOR NEW TOKEN SYSTEM)
-- NOTE: Token balances are now calculated on-the-fly using get_user_token_balance()
-- This function returns basic household info without token balances.
-- Call get_user_token_balance() separately for each member to get token info.
CREATE OR REPLACE FUNCTION get_user_household_summary(p_user_id UUID)
RETURNS TABLE (
  household_id UUID,
  household_name TEXT,
  is_admin BOOLEAN,
  plan_type TEXT,
  shared_tokens_enabled BOOLEAN,
  member_count BIGINT,
  can_use_shared_tokens BOOLEAN,
  admin_user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id AS household_id,
    h.name AS household_name,
    (h.admin_user_id = p_user_id) AS is_admin,
    h.plan_type,
    h.shared_tokens_enabled,
    (SELECT COUNT(*) FROM household_members WHERE household_id = h.id AND status = 'active') AS member_count,
    (h.shared_tokens_enabled AND hm.allow_shared_tokens) AS can_use_shared_tokens,
    h.admin_user_id
  FROM households h
  INNER JOIN household_members hm ON hm.household_id = h.id AND hm.user_id = p_user_id AND hm.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-expire old invitations (run daily via cron)
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE household_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 6. TRIGGERS
-- =====================================================================

-- Update updated_at timestamp on households
CREATE OR REPLACE FUNCTION update_households_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW
  EXECUTE FUNCTION update_households_updated_at();

-- =====================================================================
-- GRANTS
-- =====================================================================

-- Grant access to authenticated users
-- Note: household_token_summary and deduct_tokens_from_household are deprecated
GRANT EXECUTE ON FUNCTION get_user_household_summary TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_invitations TO authenticated;

-- =====================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
-- Enable RLS and create policies for all tables
-- NOTE: These are created AFTER all tables exist to avoid forward references

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

-- Households table policies
CREATE POLICY "Users can view their household" ON households
  FOR SELECT USING (
    admin_user_id = auth.uid() OR
    id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Admin can update their household" ON households
  FOR UPDATE USING (admin_user_id = auth.uid());

CREATE POLICY "Users can create households" ON households
  FOR INSERT WITH CHECK (admin_user_id = auth.uid());

CREATE POLICY "Admin can delete their household" ON households
  FOR DELETE USING (admin_user_id = auth.uid());

-- Household members table policies
CREATE POLICY "Members can view household members" ON household_members
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admin can manage members" ON household_members
  FOR ALL USING (
    household_id IN (
      SELECT id FROM households WHERE admin_user_id = auth.uid()
    )
  );

-- Household invitations table policies
CREATE POLICY "Admin can manage invitations" ON household_invitations
  FOR ALL USING (
    household_id IN (
      SELECT id FROM households WHERE admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Invitees can view their invitations" ON household_invitations
  FOR SELECT USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE households IS 'Household subscription units - either solo (1 user) or household (multiple users)';
COMMENT ON TABLE household_members IS 'Users who belong to a household';
COMMENT ON TABLE household_invitations IS 'Pending invitations to join a household';
-- Note: household_token_summary and deduct_tokens_from_household are deprecated
COMMENT ON FUNCTION get_user_household_summary IS 'Get complete household info for a user (token balances calculated separately via get_user_token_balance)';

