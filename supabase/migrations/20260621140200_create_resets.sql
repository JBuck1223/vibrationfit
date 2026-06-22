-- Migration: Reset ("Phoenix") feature
-- Created: 2026-06-21
-- Description: A free, repeatable program for active members to "hit the reset
--   button" on life. Each reset captures anchors for selected items (profile,
--   life vision, vision board, audio, projects, MAP habits) and tracks progress
--   toward a fresh start. Focus areas scope the experience to chosen life categories.

-- ============================================================================
-- 1. resets
-- ============================================================================
CREATE TABLE IF NOT EXISTS resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  title TEXT,
  focus_categories TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resets_user ON resets(user_id);
CREATE INDEX IF NOT EXISTS idx_resets_status ON resets(status);

CREATE TRIGGER set_resets_updated_at
  BEFORE UPDATE ON resets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage own resets"
  ON resets FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read resets"
  ON resets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role full access on resets"
  ON resets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- 2. reset_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS reset_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reset_id UUID NOT NULL REFERENCES resets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL
    CHECK (item_type IN ('profile', 'life_vision', 'vision_board', 'audio', 'project', 'map')),
  label TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMPTZ,
  -- Snapshot captured at selection time, used for reliable change detection
  anchor JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Optional link to a concrete entity (e.g. a project id)
  reference_id UUID,
  -- Categories the detected activity touched (cached from last verify)
  detected_categories TEXT[] NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reset_items_reset ON reset_items(reset_id);
CREATE INDEX IF NOT EXISTS idx_reset_items_user ON reset_items(user_id);

CREATE TRIGGER set_reset_items_updated_at
  BEFORE UPDATE ON reset_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE reset_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage own reset_items"
  ON reset_items FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read reset_items"
  ON reset_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role full access on reset_items"
  ON reset_items FOR ALL TO service_role
  USING (true) WITH CHECK (true);
