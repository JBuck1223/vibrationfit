-- Admin-only script library. All access goes through authenticated server routes.
create table public.admin_scripts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 200),
  created_at timestamptz not null default now()
);
create table public.admin_script_versions (
  id uuid primary key default gen_random_uuid(),
  script_id uuid not null references public.admin_scripts(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  label text not null default '',
  content text not null check (length(btrim(content)) between 1 and 100000),
  source text not null default 'admin' check (source in ('admin', 'personal', 'viva')),
  created_at timestamptz not null default now(),
  unique (script_id, version_number)
);
-- Idempotent imports: retrying the same batch cannot create duplicate versions.
create table public.admin_script_imports (
  request_id uuid primary key,
  script_id uuid not null references public.admin_scripts(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.admin_scripts enable row level security;
alter table public.admin_script_versions enable row level security;
alter table public.admin_script_imports enable row level security;
revoke all on public.admin_scripts, public.admin_script_versions, public.admin_script_imports from anon, authenticated;
grant all on public.admin_scripts, public.admin_script_versions, public.admin_script_imports to service_role;
create index admin_script_imports_script_id_idx on public.admin_script_imports(script_id);

-- One transaction per batch; locking the script serializes version numbering.
create function public.import_admin_script(p_request_id uuid, p_script_id uuid, p_title text, p_versions jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
  v_payload jsonb := jsonb_build_object('script_id', p_script_id, 'title', p_title, 'versions', p_versions);
  v_existing jsonb;
  v_next integer;
  v_version jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  select script_id, payload into v_id, v_existing from public.admin_script_imports where request_id = p_request_id;
  if found then
    if v_existing <> v_payload then raise exception 'Import ID already used with different content' using errcode = '22023'; end if;
    return v_id;
  end if;
  if jsonb_typeof(p_versions) <> 'array' or jsonb_array_length(p_versions) not between 1 and 50 then
    raise exception 'Provide 1 to 50 versions' using errcode = '22023';
  end if;
  if p_script_id is null then
    insert into public.admin_scripts(title) values (p_title) returning id into v_id;
  else
    select id into v_id from public.admin_scripts where id = p_script_id for update;
    if not found then raise exception 'Script not found' using errcode = 'P0002'; end if;
  end if;
  select coalesce(max(version_number), 0) + 1 into v_next from public.admin_script_versions where script_id = v_id;
  for v_version in select value from jsonb_array_elements(p_versions) loop
    insert into public.admin_script_versions(script_id, version_number, label, content, source)
    values (v_id, v_next, coalesce(v_version->>'label', ''), v_version->>'content', coalesce(v_version->>'source', 'admin'));
    v_next := v_next + 1;
  end loop;
  insert into public.admin_script_imports(request_id, script_id, payload) values (p_request_id, v_id, v_payload);
  return v_id;
end;
$$;
revoke all on function public.import_admin_script(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.import_admin_script(uuid, uuid, text, jsonb) to service_role;
