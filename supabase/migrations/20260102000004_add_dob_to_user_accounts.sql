-- Add date_of_birth to user_accounts
-- Migration: 20260102000004_add_dob_to_user_accounts.sql

ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

COMMENT ON COLUMN user_accounts.date_of_birth IS 'User date of birth - fixed demographic data';



