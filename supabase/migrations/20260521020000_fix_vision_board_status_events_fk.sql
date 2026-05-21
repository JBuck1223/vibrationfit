-- Fix: BEFORE INSERT trigger on vision_board_items tries to insert into
-- vision_board_item_status_events with NEW.id, but the FK check fails because
-- the parent row doesn't exist yet. Making the FK deferrable allows the check
-- to happen at transaction commit time when both rows exist.

ALTER TABLE public.vision_board_item_status_events
  DROP CONSTRAINT vision_board_item_status_events_item_id_fkey;

ALTER TABLE public.vision_board_item_status_events
  ADD CONSTRAINT vision_board_item_status_events_item_id_fkey
  FOREIGN KEY (item_id)
  REFERENCES public.vision_board_items(id)
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;
