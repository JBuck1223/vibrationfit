-- Fix FK constraints that block auth.users deletion.
-- These 8 constraints reference auth.users(id) with no ON DELETE action
-- (defaults to RESTRICT), which causes admin deleteUser() to fail.
-- Fix: SET NULL for "created_by" / "invited_by" / audit columns.

-- 1. bookings.cancelled_by
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_cancelled_by_fkey,
  ADD CONSTRAINT bookings_cancelled_by_fkey
    FOREIGN KEY (cancelled_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. email_templates.created_by
ALTER TABLE public.email_templates
  DROP CONSTRAINT IF EXISTS email_templates_created_by_fkey,
  ADD CONSTRAINT email_templates_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. household_invitations.invited_by
ALTER TABLE public.household_invitations
  DROP CONSTRAINT IF EXISTS household_invitations_invited_by_fkey,
  ADD CONSTRAINT household_invitations_invited_by_fkey
    FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. household_members.invited_by
ALTER TABLE public.household_members
  DROP CONSTRAINT IF EXISTS household_members_invited_by_fkey,
  ADD CONSTRAINT household_members_invited_by_fkey
    FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. scheduled_messages.created_by
ALTER TABLE public.scheduled_messages
  DROP CONSTRAINT IF EXISTS scheduled_messages_created_by_fkey,
  ADD CONSTRAINT scheduled_messages_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 6. sms_templates.created_by
ALTER TABLE public.sms_templates
  DROP CONSTRAINT IF EXISTS sms_templates_created_by_fkey,
  ADD CONSTRAINT sms_templates_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 7. support_ticket_replies.user_id
ALTER TABLE public.support_ticket_replies
  DROP CONSTRAINT IF EXISTS support_ticket_replies_user_id_fkey,
  ADD CONSTRAINT support_ticket_replies_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 8. token_transactions.created_by
ALTER TABLE public.token_transactions
  DROP CONSTRAINT IF EXISTS token_transactions_created_by_fkey,
  ADD CONSTRAINT token_transactions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
