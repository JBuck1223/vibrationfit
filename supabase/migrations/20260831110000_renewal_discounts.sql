-- Renewal discounts: let a coupon discount the recurring membership, not just
-- the one-time checkout charge. DB-driven — the discounted amount lives in
-- customer_subscriptions.amount_cents and the cron counts down the cycles.

-- Coupon-level configuration (set in /admin/coupons)
ALTER TABLE public.coupons
    ADD COLUMN renewal_discount_type text
        CHECK (renewal_discount_type IN ('percent', 'fixed')),
    ADD COLUMN renewal_discount_value integer,
    ADD COLUMN renewal_discount_cycles integer;

COMMENT ON COLUMN public.coupons.renewal_discount_type IS
    'When set, the coupon also discounts membership renewals (percent or fixed cents).';
COMMENT ON COLUMN public.coupons.renewal_discount_cycles IS
    'How many renewal charges get the discount. NULL = forever.';

-- Per-subscription tracking (stamped at fulfillment, counted down by the cron)
ALTER TABLE public.customer_subscriptions
    ADD COLUMN renewal_discount_type text
        CHECK (renewal_discount_type IN ('percent', 'fixed')),
    ADD COLUMN renewal_discount_value integer,
    ADD COLUMN renewal_discount_cycles_remaining integer;

COMMENT ON COLUMN public.customer_subscriptions.renewal_discount_cycles_remaining IS
    'Renewal charges left at the discounted price. NULL = discount applies forever. Cleared (with amount_cents restored) when it reaches 0.';
