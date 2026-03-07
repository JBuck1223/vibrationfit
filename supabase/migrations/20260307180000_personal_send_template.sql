INSERT INTO public.email_templates (
  slug,
  name,
  description,
  category,
  status,
  subject,
  html_body,
  text_body,
  variables,
  triggers
) VALUES (
  'personal-offer-link',
  'Personal Offer Link',
  'Short personal email with offer link -- designed for Primary inbox delivery',
  'marketing',
  'active',
  'Hey {{firstName}}, here''s what we talked about',
  '',
  E'Hey {{firstName}},\n\nHere''s the link we discussed: https://vibrationfit.com/offer/launch\n\nTake a look when you get a chance and let me know if you have any questions -- happy to walk you through it.\n\nTalk soon,\nJordan',
  '["firstName"]',
  '["Manual CRM send"]'
);
