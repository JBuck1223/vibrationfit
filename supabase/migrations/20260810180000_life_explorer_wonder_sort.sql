-- Manual ordering of Wonder Wall stickies within each board column.
alter table le_wonder_items add column if not exists sort_order integer;

comment on column le_wonder_items.sort_order is
  'Manual position within its kind column on the Wonder Wall (lower = higher). Null sorts after ordered items, by created_at.';
