-- Remove entry_type column from journal_entries table
-- This field is no longer needed as we've simplified the journal entry form

ALTER TABLE journal_entries DROP COLUMN IF EXISTS entry_type;
