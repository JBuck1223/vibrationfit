-- Add SMS opt-in fields to user_profiles table
-- This allows users to consent to SMS notifications for A2P compliance

-- Add phone and SMS consent columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_opt_in_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sms_opt_in_ip TEXT;

-- Create index for quick lookup by phone
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone 
ON user_profiles(phone) 
WHERE phone IS NOT NULL;

-- Create index for SMS-enabled users (for bulk messaging queries)
CREATE INDEX IF NOT EXISTS idx_user_profiles_sms_opt_in 
ON user_profiles(sms_opt_in) 
WHERE sms_opt_in = true;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.phone IS 'User phone number in E.164 format (e.g., +15551234567)';
COMMENT ON COLUMN user_profiles.sms_opt_in IS 'User has explicitly consented to receive SMS notifications (A2P compliance)';
COMMENT ON COLUMN user_profiles.sms_opt_in_date IS 'Timestamp when user opted in to SMS (required for A2P compliance audit trail)';
COMMENT ON COLUMN user_profiles.sms_opt_in_ip IS 'IP address when user opted in (compliance/proof of consent)';

