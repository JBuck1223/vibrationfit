-- Add custom_message column so users can save their own personalized referral message
ALTER TABLE public.referral_participants
  ADD COLUMN IF NOT EXISTS custom_message TEXT;

COMMENT ON COLUMN public.referral_participants.custom_message IS 'User-customized outreach message for sharing via text, email, and DM';
