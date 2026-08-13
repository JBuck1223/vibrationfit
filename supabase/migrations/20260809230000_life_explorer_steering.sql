-- Expedition steering: the lead explorer's console.
--
-- priority on le_wonder_items = position in the "Up Next" queue
-- (1 = the question the next lesson is built around; null = not queued).
-- steer on le_expeditions = expedition-level direction chosen by the
-- parent (continue / deepen / wrap_up), read by the Lesson Composer.

alter table public.le_wonder_items
  add column if not exists priority integer;

alter table public.le_expeditions
  add column if not exists steer jsonb not null default '{}'::jsonb;

comment on column public.le_wonder_items.priority is
  'Up Next queue position (1 = next lesson''s primary question); null = not queued';
comment on column public.le_expeditions.steer is
  'Lead-explorer steering: { direction: continue|deepen|wrap_up, updated_at }';
