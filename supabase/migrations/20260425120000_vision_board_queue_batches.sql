-- Vision board: persistent queue for "Add to Board" (VIVA ideas -> creations), similar in spirit to audio_generation_batches
-- Replaces client-only sessionStorage for reliability at 30+ jobs and audit trail.

CREATE TABLE public.vision_board_queue_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_jobs integer NOT NULL DEFAULT 0 CHECK (total_jobs >= 0),
  jobs_succeeded integer NOT NULL DEFAULT 0 CHECK (jobs_succeeded >= 0),
  jobs_failed integer NOT NULL DEFAULT 0 CHECK (jobs_failed >= 0),
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE public.vision_board_queue_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.vision_board_queue_batches (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  sort_index integer NOT NULL CHECK (sort_index >= 0),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  category_label text NOT NULL,
  idea_id uuid REFERENCES public.vision_board_ideas (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'error')),
  error_message text,
  created_vision_board_item_id uuid REFERENCES public.vision_board_items (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vision_board_queue_jobs_batch ON public.vision_board_queue_jobs (batch_id, sort_index);
CREATE INDEX idx_vision_board_queue_batches_user_created ON public.vision_board_queue_batches (user_id, created_at DESC);

COMMENT ON TABLE public.vision_board_queue_batches IS 'Persistent batches when adding multiple VIVA idea suggestions to the vision board; survives refresh and long queues.';
COMMENT ON TABLE public.vision_board_queue_jobs IS 'One row per vision board item to create within a batch.';

CREATE TRIGGER trg_vision_board_queue_batches_updated_at
  BEFORE UPDATE ON public.vision_board_queue_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_vision_board_queue_jobs_updated_at
  BEFORE UPDATE ON public.vision_board_queue_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.vision_board_queue_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_board_queue_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vision_board_queue_batches own rows"
  ON public.vision_board_queue_batches
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "vision_board_queue_jobs own rows"
  ON public.vision_board_queue_jobs
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
