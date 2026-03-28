-- Add FK from support_tickets.user_id → user_accounts(id)
-- Enables PostgREST joins like .select('*, user_accounts(full_name, email)')
-- Named explicitly so PostgREST can resolve it unambiguously

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_user_accounts_fkey 
    FOREIGN KEY (user_id) REFERENCES public.user_accounts(id) ON DELETE SET NULL;

COMMENT ON CONSTRAINT support_tickets_user_id_user_accounts_fkey ON public.support_tickets 
    IS 'FK to user_accounts for PostgREST joins - enables fetching user profile with tickets';
