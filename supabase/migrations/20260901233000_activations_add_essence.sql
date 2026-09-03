-- The vision object's essence (one word / short phrase naming the core feeling)
-- is displayed on the Immersion screen and feeds the song + audio generation.
ALTER TABLE public.activations ADD COLUMN essence text;
