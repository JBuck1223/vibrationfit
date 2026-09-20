begin;
do $test$
declare
  v_group uuid;
  v_script uuid;
  v_request uuid := gen_random_uuid();
  v_base uuid;
  v_latest uuid;
  v_sections jsonb := '[{"id":"opening","title":"Opening","content":"Approved words","locked":true},{"id":"body","title":"Lesson","content":"First body","locked":false}]';
  v_revised jsonb;
begin
  insert into public.admin_script_groups(name) values ('Verification group') returning id into v_group;
  v_script := public.import_admin_script_v2(v_request, null, 'Verification video', jsonb_build_array(jsonb_build_object('sections', v_sections)), v_group);
  if (select group_id from public.admin_scripts where id = v_script) <> v_group then raise exception 'Group assignment failed'; end if;
  if public.import_admin_script_v2(v_request, null, 'Verification video', jsonb_build_array(jsonb_build_object('sections', v_sections)), v_group) <> v_script then raise exception 'Retry failed'; end if;
  select id into v_base from public.admin_script_versions where script_id = v_script;
  v_revised := jsonb_set(v_sections, '{1,content}', '"Revised body"');
  perform public.import_admin_script_v2(gen_random_uuid(), v_script, 'Verification video', jsonb_build_array(jsonb_build_object('sections', v_revised)), null, v_base);
  select id into v_latest from public.admin_script_versions where script_id = v_script order by version_number desc limit 1;
  if (select sections->0 from public.admin_script_versions where id = v_latest) <> v_sections->0 then raise exception 'Locked section changed'; end if;
  if (select content from public.admin_script_versions where id = v_latest) <> E'Approved words\n\nRevised body' then raise exception 'Whole script assembly failed'; end if;
  begin
    perform public.import_admin_script_v2(gen_random_uuid(), v_script, 'Verification video', jsonb_build_array(jsonb_build_object('sections', v_revised)), null, v_base);
    raise exception 'Stale base accepted';
  exception when serialization_failure then null;
  end;
  begin
    perform public.import_admin_script_v2(gen_random_uuid(), v_script, 'Verification video', jsonb_build_array(jsonb_build_object('sections', jsonb_set(v_revised, '{0,content}', '"Overwritten"'))));
    raise exception 'Locked text change accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.import_admin_script_v2(gen_random_uuid(), v_script, 'Verification video', jsonb_build_array(jsonb_build_object('sections', jsonb_set(v_revised, '{0,title}', '"Renamed"'))));
    raise exception 'Locked title change accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.import_admin_script_v2(gen_random_uuid(), v_script, 'Verification video', jsonb_build_array(jsonb_build_object('sections', v_revised - 0)));
    raise exception 'Locked deletion accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.import_admin_script(gen_random_uuid(), v_script, 'Verification video', '[{"content":"Legacy overwrite"}]');
    raise exception 'Legacy lock bypass accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.import_admin_script_v2(gen_random_uuid(), v_script, 'Verification video', jsonb_build_array(jsonb_build_object('sections', v_revised), jsonb_build_object('sections', v_revised - 0)));
    raise exception 'Invalid batch accepted';
  exception when check_violation then null;
  end;
  if (select count(*) from public.admin_script_versions where script_id = v_script) <> 2 then raise exception 'Invalid batch partially committed'; end if;
  v_revised := jsonb_set(jsonb_set(v_revised, '{0,locked}', 'false'), '{0,content}', '"Explicitly revised"');
  perform public.import_admin_script_v2(gen_random_uuid(), v_script, 'Verification video', jsonb_build_array(jsonb_build_object('sections', v_revised)), null, v_latest, array['opening']);
  if (select count(*) from public.admin_script_versions where script_id = v_script) <> 3 then raise exception 'Explicit unlock failed'; end if;
  if has_table_privilege('authenticated', 'public.admin_script_groups', 'SELECT') or has_function_privilege('anon', 'public.import_admin_script_v2(uuid,uuid,text,jsonb,uuid,uuid,text[])', 'EXECUTE') then raise exception 'Client permissions exposed'; end if;
end $test$;
rollback;
select 'Passed: groups, retries, matching sections, locks, explicit unlock, stale versions, legacy protection, atomic batches, client privileges' as result;
