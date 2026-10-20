-- Trial coupons: on Vision Pro checkout, a coupon with trial_days saves the
-- card without charging and starts a trialing membership whose first charge
-- is due trial_days after signup.

ALTER TABLE public.coupons
    ADD COLUMN trial_days integer
        CHECK (trial_days IS NULL OR trial_days > 0);

COMMENT ON COLUMN public.coupons.trial_days IS
    'Days before the first Vision Pro charge. When set, membership checkout saves the card and charges nothing today.';
