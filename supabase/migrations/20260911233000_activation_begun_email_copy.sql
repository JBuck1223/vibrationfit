-- First-visit copy for the Activation access email.
-- CTA was resume-only ("Continue My Activation"); sign-off stacked VIVA
-- before the visitor has met her. Warm team closing for a human tone.

UPDATE public.email_templates
SET
  subject = 'Your Free Activation is ready ✨',
  html_body = $html$
<p>Hi {{firstName}},</p>
<p>This is your door in — open it on this device or any other.</p>
<p style="margin:28px 0;">
  <a href="{{resumeUrl}}" style="display:inline-block;background:#39FF14;color:#000;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:999px;">
    Access My Free Activation
  </a>
</p>
<p>Most importantly, have fun with it. We're rooting for you and the life you're choosing to create.</p>
<p>The Vibration Fit Team</p>
$html$,
  text_body = $text$Hi {{firstName}},

This is your door in — open it on this device or any other:
{{resumeUrl}}

Most importantly, have fun with it. We're rooting for you and the life you're choosing to create.

The Vibration Fit Team
$text$,
  updated_at = NOW()
WHERE slug = 'activation-begun';
