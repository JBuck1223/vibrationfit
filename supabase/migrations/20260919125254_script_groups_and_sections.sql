create table public.admin_script_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 200),
  created_at timestamptz not null default now()
);
alter table public.admin_script_groups enable row level security;
revoke all on public.admin_script_groups from anon, authenticated;
grant all on public.admin_script_groups to service_role;
alter table public.admin_scripts add column group_id uuid references public.admin_script_groups(id) on delete set null;
create index admin_scripts_group_id_idx on public.admin_scripts(group_id);
alter table public.admin_script_versions add column sections jsonb;
update public.admin_script_versions set sections = jsonb_build_array(jsonb_build_object('id', 'main', 'title', 'Full script', 'content', content, 'locked', false));
alter table public.admin_script_versions alter column sections set not null;

create function public.import_admin_script_v2(
  p_request_id uuid, p_script_id uuid, p_title text, p_versions jsonb,
  p_group_id uuid default null, p_base_version_id uuid default null, p_unlock_section_ids text[] default '{}'
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
  v_payload jsonb := jsonb_build_object('script_id', p_script_id, 'title', p_title, 'versions', p_versions, 'group_id', p_group_id, 'base_version_id', p_base_version_id, 'unlock_section_ids', p_unlock_section_ids);
  v_existing jsonb;
  v_next integer;
  v_version jsonb;
  v_sections jsonb;
  v_previous jsonb;
  v_latest uuid;
  v_locked jsonb;
  v_match jsonb;
  v_content text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  select script_id, payload into v_id, v_existing from public.admin_script_imports where request_id = p_request_id;
  if found then
    if v_existing <> v_payload and not (
      p_group_id is null and p_base_version_id is null and cardinality(p_unlock_section_ids) = 0
      and v_existing = v_payload - 'group_id' - 'base_version_id' - 'unlock_section_ids'
    ) then raise exception 'Import ID already used with different content' using errcode = '22023'; end if;
    return v_id;
  end if;
  if jsonb_typeof(p_versions) is distinct from 'array' or jsonb_array_length(p_versions) not between 1 and 50 then
    raise exception 'Provide 1 to 50 versions' using errcode = '22023';
  end if;
  if p_script_id is null then
    insert into public.admin_scripts(title, group_id) values (p_title, p_group_id) returning id into v_id;
  else
    select id into v_id from public.admin_scripts where id = p_script_id for update;
    if not found then raise exception 'Script not found' using errcode = 'P0002'; end if;
  end if;
  select id, sections into v_latest, v_previous from public.admin_script_versions where script_id = v_id order by version_number desc limit 1;
  if p_base_version_id is not null and p_base_version_id is distinct from v_latest then
    raise exception 'A newer version exists. Reload the script before saving.' using errcode = '40001';
  end if;
  select coalesce(max(version_number), 0) + 1 into v_next from public.admin_script_versions where script_id = v_id;
  for v_version in select value from jsonb_array_elements(p_versions) loop
    v_sections := coalesce(v_version->'sections', jsonb_build_array(jsonb_build_object('id', 'main', 'title', 'Full script', 'content', v_version->>'content', 'locked', false)));
    if jsonb_typeof(v_sections) is distinct from 'array' or jsonb_array_length(v_sections) not between 1 and 100 then
      raise exception 'Provide 1 to 100 sections' using errcode = '22023';
    end if;
    if exists (select 1 from jsonb_array_elements(v_sections) s where
      jsonb_typeof(s->'content') is distinct from 'string' or jsonb_typeof(s->'locked') is distinct from 'boolean'
      or coalesce(length(s->>'id'), 0) not between 1 and 80 or coalesce(length(btrim(s->>'title')), 0) not between 1 and 200)
      or (select count(distinct s->>'id') from jsonb_array_elements(v_sections) s) <> jsonb_array_length(v_sections) then
      raise exception 'Invalid sections or duplicate section IDs' using errcode = '22023';
    end if;
    for v_locked in select value from jsonb_array_elements(coalesce(v_previous, '[]'::jsonb)) where value->>'locked' = 'true' loop
      if not ((v_locked->>'id') = any(coalesce(p_unlock_section_ids, '{}'::text[]))) then
        select value into v_match from jsonb_array_elements(v_sections) where value->>'id' = v_locked->>'id';
        if v_match is distinct from v_locked then
          raise exception 'A locked section was changed or removed. Unlock it in Script Studio first.' using errcode = '23514';
        end if;
      end if;
    end loop;
    select string_agg(value->>'content', E'\n\n' order by ordinality) into v_content from jsonb_array_elements(v_sections) with ordinality;
    insert into public.admin_script_versions(script_id, version_number, label, content, source, sections)
    values (v_id, v_next, coalesce(v_version->>'label', ''), v_content, coalesce(v_version->>'source', 'admin'), v_sections);
    v_next := v_next + 1;
    v_previous := v_sections;
    -- Explicit unlock applies only to the first version, never to later locks in this batch.
    p_unlock_section_ids := '{}';
  end loop;
  insert into public.admin_script_imports(request_id, script_id, payload) values (p_request_id, v_id, v_payload);
  return v_id;
end;
$$;
revoke all on function public.import_admin_script_v2(uuid, uuid, text, jsonb, uuid, uuid, text[]) from public, anon, authenticated;
grant execute on function public.import_admin_script_v2(uuid, uuid, text, jsonb, uuid, uuid, text[]) to service_role;

-- Old callers retain compatibility while still enforcing section locks.
create or replace function public.import_admin_script(p_request_id uuid, p_script_id uuid, p_title text, p_versions jsonb)
returns uuid language sql security invoker set search_path = '' as $$
  select public.import_admin_script_v2(p_request_id, p_script_id, p_title, p_versions);
$$;
