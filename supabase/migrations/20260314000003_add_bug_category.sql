ALTER TABLE public.support_tickets
  DROP CONSTRAINT support_tickets_category_check,
  ADD CONSTRAINT support_tickets_category_check
    CHECK (category = ANY (ARRAY['technical','billing','account','feature','bug','other']));
