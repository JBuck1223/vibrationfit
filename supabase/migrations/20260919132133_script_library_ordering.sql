alter table public.admin_scripts add column sort_order bigint not null default 0;
with ordered as (
  select id, row_number() over (partition by group_id order by created_at, id) as position from public.admin_scripts
) update public.admin_scripts s set sort_order = o.position from ordered o where s.id = o.id;
create index admin_scripts_group_order_idx on public.admin_scripts(group_id, sort_order, id);

-- Serialize library moves, reorders, and inserts so positions stay deterministic.
create function public.place_admin_script() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(73421, 1);
  if TG_OP = 'INSERT' or new.group_id is distinct from old.group_id then
    select coalesce(max(sort_order), 0) + 1 into new.sort_order
      from public.admin_scripts where group_id is not distinct from new.group_id;
  end if;
  return new;
end;
$$;
revoke all on function public.place_admin_script() from public, anon, authenticated;
grant execute on function public.place_admin_script() to service_role;
create trigger place_admin_script before insert or update of group_id on public.admin_scripts
for each row execute function public.place_admin_script();

create function public.move_admin_script(p_script_id uuid, p_group_id uuid, p_direction text default null)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_script public.admin_scripts;
  v_neighbor public.admin_scripts;
begin
  perform pg_advisory_xact_lock(73421, 1);
  select * into v_script from public.admin_scripts where id = p_script_id for update;
  if not found then raise exception 'Script not found' using errcode = 'P0002'; end if;
  if p_direction is null then
    update public.admin_scripts set group_id = p_group_id where id = p_script_id;
    return;
  end if;
  if p_direction not in ('up', 'down') then raise exception 'Invalid direction' using errcode = '22023'; end if;
  if v_script.group_id is distinct from p_group_id then raise exception 'The script moved to another group. Refresh the library.' using errcode = '40001'; end if;
  if p_direction = 'up' then
    select * into v_neighbor from public.admin_scripts
    where group_id is not distinct from v_script.group_id and sort_order < v_script.sort_order
    order by sort_order desc, id desc limit 1 for update;
  else
    select * into v_neighbor from public.admin_scripts
    where group_id is not distinct from v_script.group_id and sort_order > v_script.sort_order
    order by sort_order, id limit 1 for update;
  end if;
  if v_neighbor.id is null then return; end if;
  update public.admin_scripts set sort_order = case when id = v_script.id then v_neighbor.sort_order else v_script.sort_order end
    where id in (v_script.id, v_neighbor.id);
end;
$$;
revoke all on function public.move_admin_script(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.move_admin_script(uuid, uuid, text) to service_role;
