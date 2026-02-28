-- Fix profile field defaults: change concrete defaults to NULL
-- so new profiles start at 0% completion instead of ~22%.
--
-- Fields affected (nullable, just need default dropped):
--   units: 'US' → NULL
--   country: 'United States' → NULL
--   currency: 'USD' → NULL
--   has_children: false → NULL
--
-- Fields affected (NOT NULL constraint must be dropped first):
--   passport: false NOT NULL → NULL
--   countries_visited: 0 NOT NULL → NULL
--   personal_growth_focus: false NOT NULL → NULL
--   legacy_mindset: false NOT NULL → NULL

-- Step 1a: Drop NOT NULL constraints on columns that have them
ALTER TABLE user_profiles ALTER COLUMN passport DROP NOT NULL;
ALTER TABLE user_profiles ALTER COLUMN countries_visited DROP NOT NULL;
ALTER TABLE user_profiles ALTER COLUMN personal_growth_focus DROP NOT NULL;
ALTER TABLE user_profiles ALTER COLUMN legacy_mindset DROP NOT NULL;

-- Step 1b: Drop column defaults so new rows get NULL
ALTER TABLE user_profiles ALTER COLUMN units DROP DEFAULT;
ALTER TABLE user_profiles ALTER COLUMN country DROP DEFAULT;
ALTER TABLE user_profiles ALTER COLUMN currency DROP DEFAULT;
ALTER TABLE user_profiles ALTER COLUMN has_children DROP DEFAULT;
ALTER TABLE user_profiles ALTER COLUMN passport DROP DEFAULT;
ALTER TABLE user_profiles ALTER COLUMN countries_visited DROP DEFAULT;
ALTER TABLE user_profiles ALTER COLUMN personal_growth_focus DROP DEFAULT;
ALTER TABLE user_profiles ALTER COLUMN legacy_mindset DROP DEFAULT;

-- Step 2: Reset existing rows where the value matches the old default
-- AND the user has not engaged with that section (no adjacent fields filled).
-- This avoids resetting values that users explicitly chose.

-- units: reset to NULL if height and weight are also unset
UPDATE user_profiles
SET units = NULL
WHERE units = 'US'
  AND height IS NULL
  AND weight IS NULL
  AND exercise_frequency IS NULL;

-- country: reset to NULL if no other location fields are filled
UPDATE user_profiles
SET country = NULL
WHERE country = 'United States'
  AND city IS NULL
  AND state IS NULL
  AND postal_code IS NULL
  AND living_situation IS NULL;

-- currency: reset to NULL if no other financial fields are filled
UPDATE user_profiles
SET currency = NULL
WHERE currency = 'USD'
  AND household_income IS NULL
  AND savings_retirement IS NULL
  AND assets_equity IS NULL
  AND consumer_debt IS NULL;

-- has_children: reset to NULL if no children data exists
UPDATE user_profiles
SET has_children = NULL
WHERE has_children = false
  AND (children IS NULL OR children = '[]'::jsonb);

-- passport: reset to NULL if no other travel fields are filled
UPDATE user_profiles
SET passport = NULL
WHERE passport = false
  AND travel_frequency IS NULL
  AND (countries_visited IS NULL OR countries_visited = 0);

-- countries_visited: reset to NULL if no other travel fields are filled
UPDATE user_profiles
SET countries_visited = NULL
WHERE countries_visited = 0
  AND travel_frequency IS NULL
  AND passport IS NOT TRUE;

-- personal_growth_focus: reset to NULL if no other spirituality fields are filled
UPDATE user_profiles
SET personal_growth_focus = NULL
WHERE personal_growth_focus = false
  AND spiritual_practice IS NULL
  AND meditation_frequency IS NULL;

-- legacy_mindset: reset to NULL if no other giving fields are filled
UPDATE user_profiles
SET legacy_mindset = NULL
WHERE legacy_mindset = false
  AND volunteer_status IS NULL
  AND charitable_giving IS NULL;
