-- SEO page ideas: spoken (Whisper-transcribed) or typed founder notes attached to an
-- SEO roadmap path, captured in /admin/seo. Claude Code reads them when redesigning
-- or writing a page (scripts/seo/ideas.ts). Admin-only; written via the service role
-- from /api/admin/seo/ideas.

CREATE TABLE IF NOT EXISTS public.seo_page_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Roadmap/SeoPage path without leading slash (e.g. 'vision-boards/ideas'), or '_general'
  -- for ideas not tied to a page yet.
  page_path text NOT NULL,
  transcript text NOT NULL,
  source text NOT NULL DEFAULT 'voice' CHECK (source IN ('voice', 'typed')),
  audio_seconds numeric,
  -- Set when the idea has been folded into the page content.
  applied_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seo_page_ideas_path_idx ON public.seo_page_ideas (page_path, created_at DESC);

COMMENT ON TABLE public.seo_page_ideas IS 'Founder voice/typed notes per SEO roadmap page, captured in /admin/seo and read by Claude Code for page redesigns';

ALTER TABLE public.seo_page_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage seo page ideas" ON public.seo_page_ideas;
CREATE POLICY "Admins manage seo page ideas" ON public.seo_page_ideas
  FOR ALL TO authenticated
  USING (public.is_admin_account())
  WITH CHECK (public.is_admin_account());
