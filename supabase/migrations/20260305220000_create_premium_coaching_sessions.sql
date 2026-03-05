-- Premium Coaching Sessions table
-- Tracks the 10 private 1:1 coaching sessions included with Premium Activation Intensive.
-- Schedule: 2 sessions/week for weeks 1-2, 1 session/week for weeks 3-8.

CREATE TABLE IF NOT EXISTS public.premium_coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intensive_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,

  total_sessions INTEGER NOT NULL DEFAULT 10,
  sessions_completed INTEGER NOT NULL DEFAULT 0,

  -- Individual session tracking (10 sessions)
  session_1_scheduled_at TIMESTAMPTZ,
  session_1_completed_at TIMESTAMPTZ,
  session_1_notes TEXT,

  session_2_scheduled_at TIMESTAMPTZ,
  session_2_completed_at TIMESTAMPTZ,
  session_2_notes TEXT,

  session_3_scheduled_at TIMESTAMPTZ,
  session_3_completed_at TIMESTAMPTZ,
  session_3_notes TEXT,

  session_4_scheduled_at TIMESTAMPTZ,
  session_4_completed_at TIMESTAMPTZ,
  session_4_notes TEXT,

  session_5_scheduled_at TIMESTAMPTZ,
  session_5_completed_at TIMESTAMPTZ,
  session_5_notes TEXT,

  session_6_scheduled_at TIMESTAMPTZ,
  session_6_completed_at TIMESTAMPTZ,
  session_6_notes TEXT,

  session_7_scheduled_at TIMESTAMPTZ,
  session_7_completed_at TIMESTAMPTZ,
  session_7_notes TEXT,

  session_8_scheduled_at TIMESTAMPTZ,
  session_8_completed_at TIMESTAMPTZ,
  session_8_notes TEXT,

  session_9_scheduled_at TIMESTAMPTZ,
  session_9_completed_at TIMESTAMPTZ,
  session_9_notes TEXT,

  session_10_scheduled_at TIMESTAMPTZ,
  session_10_completed_at TIMESTAMPTZ,
  session_10_notes TEXT,

  all_sessions_completed BOOLEAN NOT NULL DEFAULT false,
  all_sessions_completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_premium_coaching_per_intensive UNIQUE (intensive_id)
);

CREATE INDEX IF NOT EXISTS idx_premium_coaching_user_id ON public.premium_coaching_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_coaching_intensive_id ON public.premium_coaching_sessions(intensive_id);

-- RLS
ALTER TABLE public.premium_coaching_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coaching sessions"
  ON public.premium_coaching_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage coaching sessions"
  ON public.premium_coaching_sessions FOR ALL
  USING (auth.role() = 'service_role');

-- updated_at trigger
CREATE OR REPLACE TRIGGER set_updated_at_premium_coaching
  BEFORE UPDATE ON public.premium_coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
