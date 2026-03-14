-- Add timezone column to user_accounts
-- Auto-detected from the user's browser, editable in account settings
ALTER TABLE user_accounts
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York';
