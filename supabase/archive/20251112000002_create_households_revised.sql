-- Household System - Revised for Actual Pricing Structure
-- Solo: $499 + $99/28-days (1 seat)
-- Household: $699 + $149/28-days (2 seats included)
-- Add-ons: $19/28-days or $192/annual per additional member

-- =====================================================================
-- 1. CREATE NEW MEMBERSHIP TIERS FOR HOUSEHOLDS
-- =====================================================================

-- Insert household-specific membership tiers
-- These link to the existing customer_subscriptions system

-- Household 28-Day Plan (2 seats included)
INSERT INTO membership_tiers (
  name,
  tier_type,
  description,
  monthly_vibe_assistant_tokens,
  features,
  is_active
) VALUES (
  'Vision Pro Household 28-Day',
  'household_28day',
  'Full Vision Pro access for 2 people, billed every 28 days',
  750000, -- 375k × 2 seats
  jsonb_build_object(
    'household_enabled', true,
    'included_seats', 2,
    'max_seats', 6,
    'max_additional_seats', 4,
    'addon_price_28day', 1900,
    'addon_price_annual', 19200
  ),
  true
) ON CONFLICT (tier_type) DO UPDATE SET
  description = EXCLUDED.description,
  monthly_vibe_assistant_tokens = EXCLUDED.monthly_vibe_assistant_tokens,
  features = EXCLUDED.features;

-- Household Annual Plan (2 seats included)
INSERT INTO membership_tiers (
  name,
  tier_type,
  description,
  monthly_vibe_assistant_tokens,
  features,
  is_active
) VALUES (
  'Vision Pro Household Annual',
  'household_annual',
  'Full Vision Pro access for 2 people, billed annually',
  5000000, -- 5M base (will be split or shared)
  jsonb_build_object(
    'household_enabled', true,
    'included_seats', 2,
    'max_seats', 6,
    'max_additional_seats', 4,
    'addon_price_28day', 1900,
    'addon_price_annual', 19200
  ),
  true
) ON CONFLICT (tier_type) DO UPDATE SET
  description = EXCLUDED.description,
  monthly_vibe_assistant_tokens = EXCLUDED.monthly_vibe_assistant_tokens,
  features = EXCLUDED.features;

-- =====================================================================
-- 2. HOUSEHOLDS TABLE (Simplified - No Stripe Fields)
-- =====================================================================
-- Admin's subscription is in customer_subscriptions table
-- This just groups users together

CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'My Household',
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Plan info (references admin's subscription)
  plan_type TEXT CHECK (plan_type IN ('household_28day', 'household_annual')),
  
  -- Household settings
  included_seats INTEGER DEFAULT 2, -- Comes with 2 seats
  max_seats INTEGER DEFAULT 6, -- Can add up to 4 more
  shared_tokens_enabled BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(admin_user_id)
);

-- Indexes
CREATE INDEX idx_households_admin_user_id ON households(admin_user_id);
CREATE INDEX idx_households_plan_type ON households(plan_type);

-- =====================================================================
-- 3. HOUSEHOLD MEMBERS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Member role
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  seat_number INTEGER NOT NULL, -- 1-6 (seats 1-2 included, 3-6 are add-ons)
  
  -- Token sharing preference
  allow_shared_tokens BOOLEAN DEFAULT TRUE,
  monthly_tokens_granted INTEGER DEFAULT 100, -- Individual token allocation
  
  -- Billing info for add-on seats (seats 3+)
  is_addon_seat BOOLEAN DEFAULT FALSE, -- True for seats 3-6
  addon_billing_cycle TEXT CHECK (addon_billing_cycle IN ('28day', 'annual', NULL)),
  stripe_subscription_item_id TEXT, -- For add-on billing via Stripe subscription items
  
  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('active', 'removed')) DEFAULT 'active',
  
  -- Metadata
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(household_id, user_id),
  UNIQUE(user_id), -- User can only be in ONE household
  UNIQUE(household_id, seat_number)
);

-- Indexes
CREATE INDEX idx_household_members_household_id ON household_members(household_id);
CREATE INDEX idx_household_members_user_id ON household_members(user_id);
CREATE INDEX idx_household_members_status ON household_members(status);
CREATE INDEX idx_household_members_stripe_item ON household_members(stripe_subscription_item_id);

-- =====================================================================
-- 4. HOUSEHOLD INVITATIONS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS household_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invitation_token TEXT NOT NULL UNIQUE,
  
  -- Seat assignment
  seat_number INTEGER, -- Pre-assigned seat number
  is_addon_seat BOOLEAN DEFAULT FALSE,
  
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(household_id, invited_email, status)
);

-- Indexes
CREATE INDEX idx_household_invitations_token ON household_invitations(invitation_token);
CREATE INDEX idx_household_invitations_email ON household_invitations(invited_email);
CREATE INDEX idx_household_invitations_status ON household_invitations(status);
CREATE INDEX idx_household_invitations_household_id ON household_invitations(household_id);

-- =====================================================================
-- 5. UPDATE USER_PROFILES TABLE
-- =====================================================================

-- Add household relationship columns
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_household_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS allow_shared_tokens BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS household_seat_number INTEGER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_household_id ON user_profiles(household_id);

-- Comments
COMMENT ON COLUMN user_profiles.household_id IS 'Reference to household (NULL for solo users)';
COMMENT ON COLUMN user_profiles.is_household_admin IS 'True if user is household admin (manages billing and members)';
COMMENT ON COLUMN user_profiles.allow_shared_tokens IS 'User preference for using household shared tokens';
COMMENT ON COLUMN user_profiles.household_seat_number IS 'Seat number in household (1-6)';

-- =====================================================================
-- 6. HOUSEHOLD TOKEN SUMMARY VIEW
-- =====================================================================

CREATE OR REPLACE VIEW household_token_summary AS
SELECT 
  h.id AS household_id,
  h.name AS household_name,
  h.admin_user_id,
  h.plan_type,
  h.shared_tokens_enabled,
  h.included_seats,
  h.max_seats,
  
  -- Admin tokens
  admin_profile.vibe_assistant_tokens_remaining AS admin_tokens_remaining,
  admin_profile.vibe_assistant_tokens_used AS admin_tokens_used,
  
  -- Household cumulative totals
  COALESCE(SUM(up.vibe_assistant_tokens_remaining), 0) AS household_tokens_remaining,
  COALESCE(SUM(up.vibe_assistant_tokens_used), 0) AS household_tokens_used,
  
  -- Member counts
  COUNT(hm.id) FILTER (WHERE hm.status = 'active') AS active_member_count,
  COUNT(hm.id) FILTER (WHERE hm.status = 'active' AND hm.is_addon_seat = FALSE) AS included_seats_used,
  COUNT(hm.id) FILTER (WHERE hm.status = 'active' AND hm.is_addon_seat = TRUE) AS addon_seats_used,
  COUNT(hm.id) FILTER (WHERE hm.allow_shared_tokens = TRUE AND hm.status = 'active') AS sharing_enabled_count
  
FROM households h
LEFT JOIN household_members hm ON hm.household_id = h.id
LEFT JOIN user_profiles up ON up.user_id = hm.user_id
LEFT JOIN user_profiles admin_profile ON admin_profile.user_id = h.admin_user_id
GROUP BY 
  h.id, 
  h.name, 
  h.admin_user_id,
  h.plan_type,
  h.shared_tokens_enabled,
  h.included_seats,
  h.max_seats,
  admin_profile.vibe_assistant_tokens_remaining,
  admin_profile.vibe_assistant_tokens_used;

-- =====================================================================
-- 7. FUNCTIONS
-- =====================================================================

-- Function: Atomic token deduction from household (user + admin)
CREATE OR REPLACE FUNCTION deduct_tokens_from_household(
  p_user_id UUID,
  p_admin_id UUID,
  p_user_deduction INTEGER,
  p_admin_deduction INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Deduct from user's tokens
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = vibe_assistant_tokens_remaining - p_user_deduction,
    vibe_assistant_tokens_used = vibe_assistant_tokens_used + p_user_deduction,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Deduct remainder from admin's tokens
  IF p_admin_deduction > 0 THEN
    UPDATE user_profiles
    SET 
      vibe_assistant_tokens_remaining = vibe_assistant_tokens_remaining - p_admin_deduction,
      vibe_assistant_tokens_used = vibe_assistant_tokens_used + p_admin_deduction,
      updated_at = NOW()
    WHERE user_id = p_admin_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get next available seat number
CREATE OR REPLACE FUNCTION get_next_seat_number(p_household_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next_seat INTEGER;
BEGIN
  SELECT COALESCE(MAX(seat_number), 0) + 1 INTO v_next_seat
  FROM household_members
  WHERE household_id = p_household_id;
  
  RETURN v_next_seat;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if household can add more members
CREATE OR REPLACE FUNCTION can_add_household_member(p_household_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_max_seats INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE status = 'active'),
    h.max_seats
  INTO v_current_count, v_max_seats
  FROM household_members hm
  JOIN households h ON h.id = hm.household_id
  WHERE hm.household_id = p_household_id
  GROUP BY h.max_seats;
  
  RETURN COALESCE(v_current_count, 0) < v_max_seats;
END;
$$ LANGUAGE plpgsql;

-- Function: Get household summary for a user
CREATE OR REPLACE FUNCTION get_user_household_summary(p_user_id UUID)
RETURNS TABLE (
  household_id UUID,
  household_name TEXT,
  is_admin BOOLEAN,
  plan_type TEXT,
  shared_tokens_enabled BOOLEAN,
  seat_number INTEGER,
  is_addon_seat BOOLEAN,
  user_tokens_remaining INTEGER,
  household_tokens_remaining INTEGER,
  active_member_count BIGINT,
  included_seats_used BIGINT,
  addon_seats_used BIGINT,
  can_use_shared_tokens BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id AS household_id,
    h.name AS household_name,
    (h.admin_user_id = p_user_id) AS is_admin,
    h.plan_type,
    h.shared_tokens_enabled,
    hm.seat_number,
    hm.is_addon_seat,
    up.vibe_assistant_tokens_remaining AS user_tokens_remaining,
    hts.household_tokens_remaining,
    hts.active_member_count,
    hts.included_seats_used,
    hts.addon_seats_used,
    (h.shared_tokens_enabled AND hm.allow_shared_tokens) AS can_use_shared_tokens
  FROM households h
  INNER JOIN household_members hm ON hm.household_id = h.id AND hm.user_id = p_user_id AND hm.status = 'active'
  LEFT JOIN user_profiles up ON up.user_id = p_user_id
  LEFT JOIN household_token_summary hts ON hts.household_id = h.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 8. TRIGGERS
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
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

-- Households policies
CREATE POLICY "Users can view their household" ON households
  FOR SELECT USING (
    admin_user_id = auth.uid() OR
    id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Admin can update household" ON households
  FOR UPDATE USING (admin_user_id = auth.uid());

CREATE POLICY "Users can create households" ON households
  FOR INSERT WITH CHECK (admin_user_id = auth.uid());

CREATE POLICY "Admin can delete household" ON households
  FOR DELETE USING (admin_user_id = auth.uid());

-- Household members policies
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

-- Household invitations policies
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
-- GRANTS
-- =====================================================================

GRANT SELECT ON household_token_summary TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_tokens_from_household TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_household_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_seat_number TO authenticated;
GRANT EXECUTE ON FUNCTION can_add_household_member TO authenticated;

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE households IS 'Household groups - admin subscribes to household tier (household_28day or household_annual) which includes 2 seats';
COMMENT ON TABLE household_members IS 'Household members - seats 1-2 included, seats 3-6 are add-ons at $19/28-days or $192/annual';
COMMENT ON TABLE household_invitations IS 'Pending household invitations';
COMMENT ON VIEW household_token_summary IS 'Aggregated household token and member statistics';
COMMENT ON FUNCTION deduct_tokens_from_household IS 'Atomically deduct tokens from user and admin';
COMMENT ON FUNCTION get_next_seat_number IS 'Get next available seat number (1-6)';
COMMENT ON FUNCTION can_add_household_member IS 'Check if household has capacity for more members';

