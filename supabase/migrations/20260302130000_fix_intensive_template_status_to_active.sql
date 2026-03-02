-- Set template to active so it displays correctly in admin (sequence sends by template_id, so it already worked)
UPDATE public.email_templates
SET status = 'active', updated_at = NOW()
WHERE id = '2236bb16-e3c6-4548-8c95-41c675319bc3'
  AND status = 'draft';
