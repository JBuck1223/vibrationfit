begin;
do $test$
declare
  g1 uuid; g2 uuid; a uuid; b uuid; c uuid; d uuid;
  actual uuid[];
begin
  insert into public.admin_script_groups(name) values ('Ordering test A') returning id into g1;
  insert into public.admin_script_groups(name) values ('Ordering test B') returning id into g2;
  insert into public.admin_scripts(title, group_id) values ('A', g1) returning id into a;
  insert into public.admin_scripts(title, group_id) values ('B', g1) returning id into b;
  insert into public.admin_scripts(title, group_id) values ('C', g1) returning id into c;
  insert into public.admin_scripts(title, group_id) values ('D', g2) returning id into d;
  perform public.move_admin_script(c, g1, 'up');
  select array_agg(id order by sort_order) into actual from public.admin_scripts where group_id = g1;
  if actual <> array[a,c,b] then raise exception 'Move up failed'; end if;
  perform public.move_admin_script(a, g1, 'down');
  select array_agg(id order by sort_order) into actual from public.admin_scripts where group_id = g1;
  if actual <> array[c,a,b] then raise exception 'Move down failed'; end if;
  perform public.move_admin_script(c, g1, 'up');
  select array_agg(id order by sort_order) into actual from public.admin_scripts where group_id = g1;
  if actual <> array[c,a,b] then raise exception 'Boundary move changed order'; end if;
  perform public.move_admin_script(a, g2);
  select array_agg(id order by sort_order) into actual from public.admin_scripts where group_id = g2;
  if actual <> array[d,a] then raise exception 'Group move did not append'; end if;
  begin
    perform public.move_admin_script(a, g1, 'up');
    raise exception 'Stale group accepted';
  exception when serialization_failure then null;
  end;
  perform public.move_admin_script(a, null);
  if (select group_id from public.admin_scripts where id = a) is not null then raise exception 'Ungroup failed'; end if;
  if has_function_privilege('authenticated', 'public.move_admin_script(uuid,uuid,text)', 'EXECUTE') then raise exception 'Client access exposed'; end if;
end $test$;
rollback;
select 'Passed: persisted up/down order, boundaries, group append, stale-group rejection, ungrouping, access restriction' as result;
