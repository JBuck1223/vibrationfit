-- Fix employment_type check constraint to match expanded UI options
-- The UI was updated with 7 options but the DB constraint still only allows the original 4.
-- This causes "violates check constraint user_profiles_employment_type_check" on save.

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_employment_type_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_employment_type_check
  CHECK (employment_type = ANY (ARRAY[
    'Employed',
    'Business Owner',
    'Freelance/Contractor',
    'Retired',
    'Student (Full Time)',
    'Student (Working)',
    'Unemployed'
  ]));
