-- Migration: Populate guest_email for existing tickets
-- Date: 2025-12-13
-- Description: Update all tickets that have a user_id but no guest_email

-- Update tickets with user_id but no guest_email
UPDATE support_tickets
SET guest_email = (
  SELECT email 
  FROM auth.users 
  WHERE auth.users.id = support_tickets.user_id
)
WHERE user_id IS NOT NULL 
  AND guest_email IS NULL;

