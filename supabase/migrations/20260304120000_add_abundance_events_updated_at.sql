-- Add updated_at to abundance_events so we can show "Updated: date" when entry was edited
ALTER TABLE public.abundance_events
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- Backfill so existing rows don't show "Updated" (only show when actually updated after create)
UPDATE public.abundance_events
  SET updated_at = created_at;

-- Trigger to set updated_at on every update
DROP TRIGGER IF EXISTS trg_abundance_events_updated_at ON public.abundance_events;
CREATE TRIGGER trg_abundance_events_updated_at
  BEFORE UPDATE ON public.abundance_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON COLUMN public.abundance_events.updated_at IS 'Set automatically on update; used to show "Updated: date" when different from created_at.';
