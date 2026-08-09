-- Tighten ai_tools RLS.
--
-- The table previously had a policy allowing ANY authenticated user to
-- modify it ("Authenticated users can modify ai_tools" USING true). Now that
-- ai_tools drives live model selection for VIVA (tool_key = 'viva_coach'),
-- writes must be admin-only.
--
-- Reads stay open to authenticated users: the VIVA coach route reads the
-- viva_coach row as the member on every turn.

DROP POLICY IF EXISTS "Authenticated users can modify ai_tools" ON public.ai_tools;
DROP POLICY IF EXISTS "Admins can manage all tools" ON public.ai_tools;

-- Admin check matches the app's checkIsAdmin(): user_accounts.role first,
-- with the legacy metadata/email fallback.
CREATE POLICY "Admins can manage all tools" ON public.ai_tools
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_accounts ua
      WHERE ua.id = auth.uid() AND ua.role IN ('admin', 'super_admin')
    )
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND (
        (u.raw_user_meta_data ->> 'is_admin')::boolean = true
        OR u.email IN ('buckinghambliss@gmail.com', 'admin@vibrationfit.com')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_accounts ua
      WHERE ua.id = auth.uid() AND ua.role IN ('admin', 'super_admin')
    )
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND (
        (u.raw_user_meta_data ->> 'is_admin')::boolean = true
        OR u.email IN ('buckinghambliss@gmail.com', 'admin@vibrationfit.com')
      )
    )
  );
