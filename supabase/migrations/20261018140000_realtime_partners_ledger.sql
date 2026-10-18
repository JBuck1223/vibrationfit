-- Realtime invalidation for the member Partners page and dashboard widget.
-- RLS already limits each member to their own referrals and ledger rows.
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals, public.commission_ledger;
