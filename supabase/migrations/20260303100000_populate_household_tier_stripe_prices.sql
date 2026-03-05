-- Populate stripe_price_id on membership tiers so the change-plan API
-- can resolve prices directly from the database.

-- Solo Annual
UPDATE public.membership_tiers
SET stripe_price_id = 'price_1SHGXhFVKmXx41XwJlMJbUJa'
WHERE tier_type = 'vision_pro_annual'
  AND (is_household_plan = false OR is_household_plan IS NULL)
  AND is_active = true
  AND stripe_price_id IS NULL;

-- Solo 28-Day
UPDATE public.membership_tiers
SET stripe_price_id = 'price_1SHGZCFVKmXx41Xw1dhfKW1u'
WHERE tier_type = 'vision_pro_28day'
  AND (is_household_plan = false OR is_household_plan IS NULL)
  AND is_active = true
  AND stripe_price_id IS NULL;

-- Household Annual (tier_type = vision_pro_household_annual)
UPDATE public.membership_tiers
SET stripe_price_id = 'price_1SzfroFVKmXx41XwEdpFd6Ub'
WHERE tier_type = 'vision_pro_household_annual'
  AND is_active = true
  AND stripe_price_id IS NULL;

-- Household 28-Day (tier_type = vision_pro_household_28day)
UPDATE public.membership_tiers
SET stripe_price_id = 'price_1SzfriFVKmXx41Xwst5GkIp6'
WHERE tier_type = 'vision_pro_household_28day'
  AND is_active = true
  AND stripe_price_id IS NULL;

-- Handle legacy naming: household tiers stored with solo tier_type + is_household_plan = true
UPDATE public.membership_tiers
SET stripe_price_id = 'price_1SzfroFVKmXx41XwEdpFd6Ub'
WHERE tier_type = 'vision_pro_annual'
  AND is_household_plan = true
  AND is_active = true
  AND stripe_price_id IS NULL;

UPDATE public.membership_tiers
SET stripe_price_id = 'price_1SzfriFVKmXx41Xwst5GkIp6'
WHERE tier_type = 'vision_pro_28day'
  AND is_household_plan = true
  AND is_active = true
  AND stripe_price_id IS NULL;
