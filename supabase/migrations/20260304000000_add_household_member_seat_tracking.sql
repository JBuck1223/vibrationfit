-- Add optional seat tracking columns to household_members.
-- These are not required by current logic (seat count is derived dynamically)
-- but provide useful metadata for reporting and future seat management.

ALTER TABLE public.household_members
  ADD COLUMN IF NOT EXISTS is_addon_seat boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS seat_number integer,
  ADD COLUMN IF NOT EXISTS stripe_subscription_item_id text;

COMMENT ON COLUMN public.household_members.is_addon_seat
  IS 'True for members beyond the 2 included household seats (paid add-on seats)';
COMMENT ON COLUMN public.household_members.seat_number
  IS 'Seat position in the household (1-2 are included, 3+ are add-ons)';
COMMENT ON COLUMN public.household_members.stripe_subscription_item_id
  IS 'Stripe subscription item ID for the seat add-on (only for add-on seats)';

CREATE INDEX IF NOT EXISTS idx_household_members_addon_seat
  ON public.household_members(household_id)
  WHERE is_addon_seat = true;
