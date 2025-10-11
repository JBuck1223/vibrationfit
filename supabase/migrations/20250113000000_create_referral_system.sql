-- Create referral system tables
-- Migration: 20250113000000_create_referral_system.sql

-- ============================================================================
-- USER REFERRALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  successful_conversions INTEGER DEFAULT 0,
  reward_tier TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_referral UNIQUE(user_id)
);

-- Index for fast lookups
CREATE INDEX idx_referral_code ON public.user_referrals(referral_code);
CREATE INDEX idx_user_referrals_user_id ON public.user_referrals(user_id);

-- ============================================================================
-- REFERRAL CLICKS TABLE (Track who clicked referral links)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for analytics
CREATE INDEX idx_referral_clicks_referrer ON public.referral_clicks(referrer_id);
CREATE INDEX idx_referral_clicks_referred ON public.referral_clicks(referred_user_id);
CREATE INDEX idx_referral_clicks_code ON public.referral_clicks(referral_code);

-- ============================================================================
-- REFERRAL REWARDS TABLE (Track rewards earned)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_click_id UUID REFERENCES public.referral_clicks(id) ON DELETE SET NULL,
  reward_type TEXT NOT NULL, -- 'free_month', 'discount', 'tokens', 'free_forever'
  reward_value JSONB, -- { "months": 1, "discount_percent": 50, "tokens": 1000 }
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user rewards
CREATE INDEX idx_referral_rewards_user ON public.referral_rewards(user_id);
CREATE INDEX idx_referral_rewards_unclaimed ON public.referral_rewards(user_id, is_claimed) WHERE NOT is_claimed;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Policies for user_referrals
CREATE POLICY "Users can view their own referral data"
  ON public.user_referrals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral code"
  ON public.user_referrals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral data"
  ON public.user_referrals
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for referral_clicks
CREATE POLICY "Users can view clicks to their referral code"
  ON public.referral_clicks
  FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Anyone can insert referral clicks"
  ON public.referral_clicks
  FOR INSERT
  WITH CHECK (true);

-- Policies for referral_rewards
CREATE POLICY "Users can view their own rewards"
  ON public.referral_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_first_name TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base code from first name (or fallback)
  base_code := LOWER(COALESCE(user_first_name, 'user'));
  base_code := REGEXP_REPLACE(base_code, '[^a-z0-9]', '', 'g');
  
  -- Limit to 10 characters
  IF LENGTH(base_code) > 10 THEN
    base_code := SUBSTRING(base_code, 1, 10);
  END IF;
  
  -- Try base code first
  final_code := base_code;
  
  -- If taken, append random suffix until unique
  WHILE EXISTS (SELECT 1 FROM public.user_referrals WHERE referral_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || floor(random() * 10000)::TEXT;
    
    -- Safety check to prevent infinite loop
    IF counter > 100 THEN
      final_code := 'user' || SUBSTRING(user_id::TEXT, 1, 8);
      EXIT;
    END IF;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code for new users
CREATE OR REPLACE FUNCTION create_user_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  user_first_name TEXT;
BEGIN
  -- Get user's first name from user_profiles if exists
  SELECT first_name INTO user_first_name
  FROM public.user_profiles
  WHERE user_id = NEW.id
  LIMIT 1;
  
  -- Generate unique code
  new_code := generate_referral_code(user_first_name, NEW.id);
  
  -- Insert referral record
  INSERT INTO public.user_referrals (user_id, referral_code)
  VALUES (NEW.id, new_code)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create referral code on user signup
CREATE OR REPLACE TRIGGER trigger_create_referral_code
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_referral_code();

-- Function to track referral conversion
CREATE OR REPLACE FUNCTION track_referral_conversion()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscription just became active and has a referrer
  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    -- Check if there's a referrer_id in metadata
    IF NEW.metadata->>'referrer_id' IS NOT NULL THEN
      -- Update referral click to converted
      UPDATE public.referral_clicks
      SET 
        converted = true,
        converted_at = now()
      WHERE 
        referred_user_id = NEW.user_id 
        AND referrer_id = (NEW.metadata->>'referrer_id')::UUID
        AND NOT converted;
      
      -- Increment referrer's stats
      UPDATE public.user_referrals
      SET 
        total_referrals = total_referrals + 1,
        successful_conversions = successful_conversions + 1,
        updated_at = now()
      WHERE user_id = (NEW.metadata->>'referrer_id')::UUID;
      
      -- Check if referrer earned a reward (3 referrals = free)
      DECLARE
        referrer_conversions INTEGER;
      BEGIN
        SELECT successful_conversions INTO referrer_conversions
        FROM public.user_referrals
        WHERE user_id = (NEW.metadata->>'referrer_id')::UUID;
        
        -- Every 3rd referral = 1 free month
        IF referrer_conversions % 3 = 0 THEN
          INSERT INTO public.referral_rewards (
            user_id,
            reward_type,
            reward_value
          ) VALUES (
            (NEW.metadata->>'referrer_id')::UUID,
            'free_month',
            '{"months": 1, "message": "You earned a free month! 3 friends joined."}'::JSONB
          );
        END IF;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to track conversions
CREATE OR REPLACE TRIGGER trigger_track_referral_conversion
  AFTER INSERT OR UPDATE OF status ON public.customer_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION track_referral_conversion();

-- ============================================================================
-- TIMESTAMP TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_referral_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_updated_at
  BEFORE UPDATE ON public.user_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.user_referrals IS 'User referral codes and stats';
COMMENT ON TABLE public.referral_clicks IS 'Track clicks on referral links';
COMMENT ON TABLE public.referral_rewards IS 'Rewards earned from referrals';
COMMENT ON COLUMN public.user_referrals.referral_code IS 'Unique referral code (e.g., "jordan", "sarah123")';
COMMENT ON COLUMN public.user_referrals.successful_conversions IS 'Number of referred users who became paying customers';
COMMENT ON COLUMN public.referral_rewards.reward_type IS 'Type: free_month, discount, tokens, free_forever';

