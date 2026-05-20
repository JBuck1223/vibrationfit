-- Vision board status history for point-in-time board snapshots

CREATE TABLE IF NOT EXISTS public.vision_board_item_status_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES public.vision_board_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL CHECK (to_status IN ('active', 'actualized', 'inactive')),
  changed_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vb_status_events_item_changed
  ON public.vision_board_item_status_events (item_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_vb_status_events_user_changed
  ON public.vision_board_item_status_events (user_id, changed_at DESC);

ALTER TABLE public.vision_board_item_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vision board status events"
  ON public.vision_board_item_status_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vision board status events"
  ON public.vision_board_item_status_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.vision_board_item_status_events IS
  'Append-only log of vision board item status changes for historical board snapshots.';

-- Log status changes and preserve first actualized_at
CREATE OR REPLACE FUNCTION public.log_vision_board_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.vision_board_item_status_events (
      item_id, user_id, from_status, to_status, changed_at
    ) VALUES (
      NEW.id, NEW.user_id, NULL, NEW.status, COALESCE(NEW.created_at, now())
    );

    IF NEW.status = 'actualized' AND NEW.actualized_at IS NULL THEN
      NEW.actualized_at := COALESCE(NEW.created_at, now());
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.vision_board_item_status_events (
        item_id, user_id, from_status, to_status, changed_at
      ) VALUES (
        NEW.id, NEW.user_id, OLD.status, NEW.status, now()
      );
    END IF;

    IF NEW.status = 'actualized' AND NEW.actualized_at IS NULL THEN
      NEW.actualized_at := now();
    ELSIF NEW.status <> 'actualized' AND OLD.actualized_at IS NOT NULL THEN
      NEW.actualized_at := OLD.actualized_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_vision_board_status_change ON public.vision_board_items;

CREATE TRIGGER trg_log_vision_board_status_change
  BEFORE INSERT OR UPDATE ON public.vision_board_items
  FOR EACH ROW
  EXECUTE FUNCTION public.log_vision_board_status_change();

-- Backfill status history from existing items (best-effort)
INSERT INTO public.vision_board_item_status_events (item_id, user_id, from_status, to_status, changed_at)
SELECT
  id,
  user_id,
  NULL,
  CASE
    WHEN status = 'actualized' AND actualized_at IS NOT NULL AND actualized_at > created_at THEN 'active'
    ELSE status
  END,
  created_at
FROM public.vision_board_items
WHERE NOT EXISTS (
  SELECT 1 FROM public.vision_board_item_status_events e WHERE e.item_id = vision_board_items.id
);

INSERT INTO public.vision_board_item_status_events (item_id, user_id, from_status, to_status, changed_at)
SELECT id, user_id, 'active', 'actualized', actualized_at
FROM public.vision_board_items
WHERE actualized_at IS NOT NULL
  AND status IN ('actualized', 'inactive')
  AND actualized_at > created_at
  AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_item_status_events e
    WHERE e.item_id = vision_board_items.id
      AND e.to_status = 'actualized'
      AND e.changed_at = vision_board_items.actualized_at
  );

INSERT INTO public.vision_board_item_status_events (item_id, user_id, from_status, to_status, changed_at)
SELECT
  id,
  user_id,
  CASE WHEN actualized_at IS NOT NULL THEN 'actualized' ELSE 'active' END,
  'inactive',
  updated_at
FROM public.vision_board_items
WHERE status = 'inactive'
  AND updated_at > created_at
  AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_item_status_events e
    WHERE e.item_id = vision_board_items.id AND e.to_status = 'inactive'
  );
