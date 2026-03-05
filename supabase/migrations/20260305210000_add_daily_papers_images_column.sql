-- Add images JSONB array column to daily_papers for multiple image uploads.
-- The existing attachment_* columns remain for the single file upload (handwritten paper PDF/photo).
-- This new column stores an array of image objects, each with: url, key, contentType, size, originalName.

ALTER TABLE public.daily_papers
  ADD COLUMN images jsonb DEFAULT '[]'::jsonb NOT NULL;

COMMENT ON COLUMN public.daily_papers.images IS 'Array of image upload objects [{url, key, contentType, size, originalName}]';
