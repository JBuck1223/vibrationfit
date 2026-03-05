-- Fix existing lowercase first_name/last_name in user_accounts
UPDATE public.user_accounts
SET
  first_name = INITCAP(first_name),
  last_name  = INITCAP(last_name)
WHERE first_name IS NOT NULL
   OR last_name  IS NOT NULL;

-- Fix household names that were stored lowercase
UPDATE public.households
SET name = INITCAP(name)
WHERE name IS NOT NULL;
