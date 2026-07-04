-- Short links: first-party branded redirect slugs (vibrationfit.com/go/<slug>).
-- Redirects 302 to a destination URL that carries UTM params, so the existing
-- visitor/session attribution pipeline captures the source/creator on landing.
-- Managed from the admin CRM. Only the service role touches this table, so RLS
-- is enabled with no public policies (deny-by-default for anon/authenticated).

create table if not exists public.short_links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  destination text not null,
  label text,
  is_active boolean not null default true,
  click_count integer not null default 0,
  last_clicked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive slug lookups (slugs are stored lowercased by the app).
create unique index if not exists short_links_slug_lower_idx
  on public.short_links (lower(slug));

alter table public.short_links enable row level security;

-- Atomic click counter used by the public /go/<slug> redirect route.
create or replace function public.increment_short_link_click(p_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.short_links
  set click_count = click_count + 1,
      last_clicked_at = now()
  where lower(slug) = lower(p_slug)
    and is_active = true;
$$;
