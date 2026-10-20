-- Port every saved (non-draft) Profile version into Your World versions.
-- Keeps each version's date, order, and active flag. Drafts are not ported.
-- state_* essays stay on the old Profile rows (still readable there).
-- Address comes from the account; Profile city/state/country fill blanks.
-- Then the active version is copied into member_roster, where facts already
-- confirmed in conversation win and Profile only fills blanks.
-- Safe to re-run: rows already ported (source_profile_id) are skipped.

WITH src AS (
  SELECT
    p.*,
    row_number() OVER (PARTITION BY p.user_id ORDER BY p.created_at) AS vn,
    (coalesce(p.is_active, false)
      AND row_number() OVER (
        PARTITION BY p.user_id
        ORDER BY coalesce(p.is_active, false) DESC, p.updated_at DESC
      ) = 1) AS act
  FROM public.user_profiles p
  WHERE coalesce(p.is_draft, false) = false
    AND NOT EXISTS (
      SELECT 1 FROM public.member_world_versions w WHERE w.source_profile_id = p.id
    )
)
INSERT INTO public.member_world_versions (
  user_id, version_number, is_draft, is_active, snapshot, version_notes,
  source, source_profile_id, created_at, updated_at, committed_at
)
SELECT
  src.user_id,
  src.vn + coalesce((SELECT max(w.version_number) FROM public.member_world_versions w WHERE w.user_id = src.user_id), 0),
  false,
  src.act AND NOT EXISTS (
    SELECT 1 FROM public.member_world_versions w WHERE w.user_id = src.user_id AND w.is_active
  ),
  jsonb_strip_nulls(jsonb_build_object(
    'gender', nullif(trim(src.gender), ''),
    'ethnicity', nullif(trim(src.ethnicity), ''),
    'social_preference', nullif(src.social_preference::text, ''),
    'hobbies', to_jsonb(coalesce(array_remove(src.hobbies, ''), '{}'::text[])),
    'partner', jsonb_strip_nulls(jsonb_build_object(
      'status', nullif(trim(src.relationship_status), ''),
      'length', nullif(trim(src.relationship_length), ''),
      'name', nullif(trim(src.partner_name), '')
    )),
    'children', coalesce((
      SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'name', trim(c->>'first_name'),
        'birthday', nullif(c->>'birthday', '')
      )))
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(src.children) = 'array' THEN src.children ELSE '[]'::jsonb END
      ) c
      WHERE nullif(trim(c->>'first_name'), '') IS NOT NULL
    ), '[]'::jsonb),
    'pets', '[]'::jsonb,
    'address', jsonb_strip_nulls(jsonb_build_object(
      'line1', nullif(trim(a.shipping_line1), ''),
      'line2', nullif(trim(a.shipping_line2), ''),
      'city', coalesce(nullif(trim(a.shipping_city), ''), nullif(trim(src.city), '')),
      'region', coalesce(nullif(trim(a.shipping_state), ''), nullif(trim(src.state), '')),
      'postal_code', nullif(trim(a.shipping_postal_code), ''),
      'country', coalesce(nullif(trim(a.shipping_country), ''), nullif(trim(src.country), ''))
    )),
    'living_situation', nullif(trim(src.living_situation), ''),
    'time_at_location', nullif(trim(src.time_at_location), ''),
    'work', jsonb_strip_nulls(jsonb_build_object(
      'employment_type', nullif(trim(src.employment_type), ''),
      'occupation', nullif(trim(src.occupation), ''),
      'company', nullif(trim(src.company), ''),
      'time_in_role', nullif(trim(src.time_in_role), ''),
      'education', nullif(trim(src.education), ''),
      'education_description', nullif(trim(src.education_description), '')
    )),
    'money', jsonb_strip_nulls(jsonb_build_object(
      'currency', nullif(trim(src.currency), ''),
      'household_income', nullif(trim(src.household_income), ''),
      'savings_retirement', nullif(trim(src.savings_retirement), ''),
      'assets_equity', nullif(trim(src.assets_equity), ''),
      'consumer_debt', nullif(trim(src.consumer_debt), '')
    ))
  )),
  nullif(trim(src.version_notes), ''),
  'profile_port',
  src.id,
  src.created_at,
  coalesce(src.updated_at, src.created_at),
  coalesce(src.updated_at, src.created_at)
FROM src
JOIN public.user_accounts a ON a.id = src.user_id;

-- Active ported version -> member_roster (roster facts win, Profile fills blanks)
INSERT INTO public.member_roster (
  user_id, gender, ethnicity, social_preference, hobbies, partner, children, place, work, money, vocation
)
SELECT
  w.user_id,
  w.snapshot->>'gender',
  w.snapshot->>'ethnicity',
  w.snapshot->>'social_preference',
  coalesce(ARRAY(SELECT jsonb_array_elements_text(w.snapshot->'hobbies')), '{}'::text[]),
  nullif(w.snapshot->'partner', '{}'::jsonb),
  coalesce(w.snapshot->'children', '[]'::jsonb),
  jsonb_strip_nulls(jsonb_build_object(
    'city', w.snapshot->'address'->>'city',
    'region', w.snapshot->'address'->>'region',
    'living_situation', w.snapshot->>'living_situation',
    'time_at_location', w.snapshot->>'time_at_location'
  )),
  coalesce(w.snapshot->'work', '{}'::jsonb),
  coalesce(w.snapshot->'money', '{}'::jsonb),
  CASE
    WHEN w.snapshot->'work'->>'occupation' IS NOT NULL AND w.snapshot->'work'->>'company' IS NOT NULL
      THEN (w.snapshot->'work'->>'occupation') || ' at ' || (w.snapshot->'work'->>'company')
    ELSE coalesce(w.snapshot->'work'->>'occupation', w.snapshot->'work'->>'employment_type')
  END
FROM public.member_world_versions w
WHERE w.is_active AND w.source = 'profile_port'
ON CONFLICT (user_id) DO UPDATE SET
  gender = coalesce(member_roster.gender, excluded.gender),
  ethnicity = coalesce(member_roster.ethnicity, excluded.ethnicity),
  social_preference = coalesce(member_roster.social_preference, excluded.social_preference),
  hobbies = CASE WHEN cardinality(member_roster.hobbies) > 0 THEN member_roster.hobbies ELSE excluded.hobbies END,
  partner = CASE
    WHEN excluded.partner IS NULL THEN member_roster.partner
    ELSE excluded.partner || coalesce(member_roster.partner, '{}'::jsonb)
  END,
  children = CASE
    WHEN jsonb_array_length(coalesce(member_roster.children, '[]'::jsonb)) > 0 THEN member_roster.children
    ELSE excluded.children
  END,
  place = excluded.place || coalesce(member_roster.place, '{}'::jsonb),
  work = excluded.work || coalesce(member_roster.work, '{}'::jsonb),
  money = excluded.money || coalesce(member_roster.money, '{}'::jsonb),
  vocation = coalesce(member_roster.vocation, excluded.vocation);

-- Members whose roster already held conversation facts: carry those into
-- the active version so it matches what VIVA uses.
UPDATE public.member_world_versions w
SET snapshot = w.snapshot
  || jsonb_build_object('partner', coalesce(w.snapshot->'partner', '{}'::jsonb) || coalesce(r.partner, '{}'::jsonb))
  || CASE WHEN jsonb_array_length(coalesce(r.children, '[]'::jsonb)) > 0
       THEN jsonb_build_object('children', r.children) ELSE '{}'::jsonb END
  || CASE WHEN jsonb_array_length(coalesce(r.pets, '[]'::jsonb)) > 0
       THEN jsonb_build_object('pets', r.pets) ELSE '{}'::jsonb END
FROM public.member_roster r
WHERE r.user_id = w.user_id
  AND w.is_active
  AND w.source = 'profile_port'
  AND (r.partner IS NOT NULL
    OR jsonb_array_length(coalesce(r.children, '[]'::jsonb)) > 0
    OR jsonb_array_length(coalesce(r.pets, '[]'::jsonb)) > 0);
