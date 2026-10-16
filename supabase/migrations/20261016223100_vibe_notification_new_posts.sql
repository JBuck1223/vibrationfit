-- Let Vibe Tribe notifications include a new-post type so every active
-- member can be told when someone posts.

ALTER TABLE public.vibe_notifications
  DROP CONSTRAINT vibe_notifications_type_check;

ALTER TABLE public.vibe_notifications
  ADD CONSTRAINT vibe_notifications_type_check
  CHECK (type = ANY (ARRAY['comment'::text, 'reply'::text, 'mention'::text, 'heart'::text, 'post'::text]));
