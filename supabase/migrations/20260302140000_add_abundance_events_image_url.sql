-- Add optional image_url to abundance_events (for Upload Image / Generate with VIVA)
ALTER TABLE public.abundance_events
  ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.abundance_events.image_url IS 'Optional image URL (upload or VIVA-generated) for the abundance entry.';
