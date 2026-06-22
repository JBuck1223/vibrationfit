-- Migration: Enable RLS on three previously-exposed tables
-- Created: 2026-06-22
-- Description: vision_generation_batches, email_suppressions, and blast_segments
--   had Row Level Security disabled, leaving them fully readable/writable by the
--   anon + authenticated keys. This enables RLS and adds policies matching how
--   each table is actually accessed:
--     - vision_generation_batches: user-owned (queried via the user client,
--       filtered by user_id) -> per-user ownership policy.
--     - email_suppressions: backend-only (service role); sensitive email list ->
--       service-role full access + admin read.
--     - blast_segments: admin CRM tooling (service role + verifyAdminAccess) ->
--       service-role full access + admin manage.

-- ============================================================================
-- vision_generation_batches (user-owned)
-- ============================================================================
ALTER TABLE public.vision_generation_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage own vision_generation_batches"
  ON public.vision_generation_batches FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access on vision_generation_batches"
  ON public.vision_generation_batches FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- email_suppressions (backend-only; sensitive)
-- ============================================================================
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on email_suppressions"
  ON public.email_suppressions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can read email_suppressions"
  ON public.email_suppressions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- blast_segments (admin CRM tooling)
-- ============================================================================
ALTER TABLE public.blast_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on blast_segments"
  ON public.blast_segments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can manage blast_segments"
  ON public.blast_segments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.role IN ('admin', 'super_admin')
    )
  );
