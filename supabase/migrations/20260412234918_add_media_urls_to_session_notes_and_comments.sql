-- Add media_urls column to session_notes (private notes)
ALTER TABLE public.session_notes
  ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}';

-- Add media_urls column to session_comments (public discussion)
ALTER TABLE public.session_comments
  ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}';

COMMENT ON COLUMN public.session_notes.media_urls IS 'CDN URLs for user-uploaded images/videos attached to private notes';
COMMENT ON COLUMN public.session_comments.media_urls IS 'CDN URLs for user-uploaded images/videos attached to discussion comments';
