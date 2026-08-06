-- ============================================================================
-- ANNUAL UPGRADE CAMPAIGN (Day 21-25 of first 28-day Vision Pro cycle)
--
-- Two emails offering the founders' annual prepaid upgrade:
--   - Email 1 at Day 21 (30240 min from enrollment)
--   - Email 2 at Day 24 (34560 min from enrollment)
-- Triggered by 'intensive.purchased' (everyone rolls into 28-day continuity).
-- Exits when 'membership.upgraded_annual' fires from /api/billing/change-plan.
--
-- Plan-conditional pricing is rendered at send time via enrollment metadata
-- variables {{continuityPrice}} ($99 / $149) and {{annualPrice}} ($999 / $1,490)
-- set by the webhook when the intensive.purchased event fires.
-- ============================================================================


-- ============================================================================
-- 1. EMAIL TEMPLATES
-- ============================================================================

INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables, triggers)
VALUES (
  'annual-upgrade-day21',
  'Annual Upgrade: Day 21 Offer',
  'Day 21 of first 28-day Vision Pro cycle. Offers the founders'' annual prepaid upgrade with plan-conditional pricing.',
  'billing',
  'active',

  -- SUBJECT
  E'Lock in your year of Vision (and save)',

  -- HTML BODY
  E'<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;background-color:#000;color:#fff;">\n<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000;"><tr><td align="center" style="padding:40px 20px;">\n<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">\n\n<!-- Badge -->\n<tr><td style="padding:0 0 24px;text-align:center;"><div style="display:inline-block;padding:8px 24px;background-color:rgba(57,255,20,0.1);border-radius:50px;border:2px solid #39FF14;"><p style="margin:0;font-size:12px;font-weight:600;color:#39FF14;text-transform:uppercase;letter-spacing:1px;">Founders'' Annual Upgrade</p></div></td></tr>\n\n<!-- Main Card -->\n<tr><td style="padding:0;"><div style="padding:40px;background-color:#1F1F1F;border-radius:16px;border:2px solid #333;">\n\n  <h1 style="margin:0 0 24px;font-size:28px;font-weight:bold;color:#fff;text-align:center;line-height:1.2;">Lock in your year of Vision.</h1>\n\n  <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#E5E5E5;">Hi {{firstName}},</p>\n\n  <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#E5E5E5;">You''re about three weeks into your first 28 days with Vision Pro after completing your 72-Hour Vision Activation Intensive.</p>\n\n  <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#E5E5E5;">You''ve already done the hardest part: you started. Most people never make it this far.</p>\n\n  <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#E5E5E5;">If you want to keep your vision activated all year without thinking about billing every 28 days, you can upgrade to an annual Vision Pro membership and save compared to staying on 28-day billing.</p>\n\n  <!-- Pricing Box -->\n  <div style="margin:0 0 24px;padding:24px;background-color:#000;border-radius:12px;border:2px solid #39FF14;">\n    <p style="margin:0 0 16px;font-size:11px;color:#39FF14;text-transform:uppercase;letter-spacing:1px;font-weight:600;">For you, that looks like</p>\n    <p style="margin:0 0 8px;font-size:15px;color:#E5E5E5;">Regular: <strong style="color:#fff;">{{continuityPrice}} every 28 days</strong></p>\n    <p style="margin:0 0 8px;font-size:15px;color:#E5E5E5;">Annual upgrade: <strong style="color:#39FF14;">{{annualPrice}} for 12 months</strong></p>\n    <p style="margin:0;font-size:15px;color:#E5E5E5;">You save around 2 months vs paying every 28 days.</p>\n  </div>\n\n  <p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:#E5E5E5;">When you upgrade, nothing changes in your experience except your billing:</p>\n  <p style="margin:0 0 4px;font-size:15px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> Your membership continues as normal</p>\n  <p style="margin:0 0 4px;font-size:15px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> Your next renewal is 12 months from now, not in a few days</p>\n  <p style="margin:0 0 24px;font-size:15px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> You lock in this founders'' rate for the full year</p>\n\n  <!-- CTA Button -->\n  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td align="center"><a href="https://vibrationfit.com/account/billing?upgrade=annual" style="display:inline-block;padding:18px 48px;background-color:#39FF14;color:#000;text-decoration:none;font-size:16px;font-weight:700;border-radius:50px;">Upgrade to Annual Now</a></td></tr></table>\n\n  <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#999;text-align:center;">This link is live until the end of your first 28 days with Vision Pro. After that, you''ll stay on 28-day billing unless you upgrade later at whatever the current rate is at that time.</p>\n\n  <div style="height:2px;background:linear-gradient(90deg,#BF00FF,#39FF14);margin:32px 0;"></div>\n  <p style="margin:0;font-size:15px;color:#E5E5E5;">With love and appreciation,<br>Jordan &amp; Vanessa Buckingham</p>\n\n</div></td></tr>\n\n<!-- Footer -->\n<tr><td style="padding:32px 20px 0;text-align:center;"><p style="margin:0 0 12px;font-size:13px;color:#999;">Questions? Reply to this email or visit <a href="https://vibrationfit.com/support" style="color:#39FF14;text-decoration:none;font-weight:600;">vibrationfit.com/support</a></p><p style="margin:0 0 8px;font-size:11px;color:#666;">Vibration Fit &middot; <span style="color:#39FF14;">Above the Green Line</span></p><p style="margin:0;font-size:10px;color:#555;">You''re receiving this because you''re a Vision Pro member.</p></td></tr>\n\n</table></td></tr></table>\n</body></html>',

  -- TEXT BODY
  E'LOCK IN YOUR YEAR OF VISION (AND SAVE)\n\nHi {{firstName}},\n\nYou''re about three weeks into your first 28 days with Vision Pro after completing your 72-Hour Vision Activation Intensive.\n\nYou''ve already done the hardest part: you started. Most people never make it this far.\n\nIf you want to keep your vision activated all year without thinking about billing every 28 days, you can upgrade to an annual Vision Pro membership and save compared to staying on 28-day billing.\n\nFor you, that looks like:\n\nRegular: {{continuityPrice}} every 28 days\nAnnual upgrade: {{annualPrice}} for 12 months\nYou save around 2 months vs paying every 28 days.\n\nWhen you upgrade, nothing changes in your experience except your billing:\n\n- Your membership continues as normal\n- Your next renewal is 12 months from now, not in a few days\n- You lock in this founders'' rate for the full year\n\nUpgrade to annual now:\nhttps://vibrationfit.com/account/billing?upgrade=annual\n\nThis link is live until the end of your first 28 days with Vision Pro. After that, you''ll stay on 28-day billing unless you upgrade later at whatever the current rate is at that time.\n\nWith love and appreciation,\nJordan & Vanessa Buckingham',

  '["firstName", "continuityPrice", "annualPrice"]'::jsonb,
  '["Sequence: Annual Upgrade Offer (Day 21)"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  status = EXCLUDED.status, subject = EXCLUDED.subject, html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body, variables = EXCLUDED.variables,
  triggers = EXCLUDED.triggers, updated_at = NOW();


INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables, triggers)
VALUES (
  'annual-upgrade-day24',
  'Annual Upgrade: Day 24 Last Call',
  'Day 24 of first 28-day Vision Pro cycle. Last-call reminder for the founders'' annual prepaid upgrade.',
  'billing',
  'active',

  -- SUBJECT
  E'Last call to lock in your year of Vision Pro',

  -- HTML BODY
  E'<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;background-color:#000;color:#fff;">\n<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000;"><tr><td align="center" style="padding:40px 20px;">\n<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">\n\n<!-- Badge -->\n<tr><td style="padding:0 0 24px;text-align:center;"><div style="display:inline-block;padding:8px 24px;background-color:rgba(255,255,0,0.1);border-radius:50px;border:2px solid #FFFF00;"><p style="margin:0;font-size:12px;font-weight:600;color:#FFFF00;text-transform:uppercase;letter-spacing:1px;">Last Call</p></div></td></tr>\n\n<!-- Main Card -->\n<tr><td style="padding:0;"><div style="padding:40px;background-color:#1F1F1F;border-radius:16px;border:2px solid #333;">\n\n  <h1 style="margin:0 0 24px;font-size:28px;font-weight:bold;color:#fff;text-align:center;line-height:1.2;">Your first 28 days wrap up soon.</h1>\n\n  <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#E5E5E5;">Hi {{firstName}},</p>\n\n  <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#E5E5E5;">Quick reminder:</p>\n\n  <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#E5E5E5;">Your first 28 days with Vision Pro wrap up in a few days.</p>\n\n  <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#E5E5E5;">If you already know you want this to be your new normal, you can still upgrade to an annual Vision Pro membership and save compared to staying on 28-day billing:</p>\n\n  <!-- Pricing Box -->\n  <div style="margin:0 0 24px;padding:24px;background-color:#000;border-radius:12px;border:2px solid #39FF14;">\n    <p style="margin:0;font-size:15px;color:#E5E5E5;"><strong style="color:#39FF14;">{{annualPrice}} for 12 months</strong> (vs {{continuityPrice}} every 28 days)</p>\n  </div>\n\n  <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#E5E5E5;">This founders'' upgrade link is only available until the end of your first 28 days so we can honor the rate you joined at.</p>\n\n  <!-- CTA Button -->\n  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td align="center"><a href="https://vibrationfit.com/account/billing?upgrade=annual" style="display:inline-block;padding:18px 48px;background-color:#39FF14;color:#000;text-decoration:none;font-size:16px;font-weight:700;border-radius:50px;">Upgrade to Annual Before Your First 28 Days End</a></td></tr></table>\n\n  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#E5E5E5;">If you do nothing, you''ll simply continue on your current 28-day cycle.</p>\n\n  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#E5E5E5;">You''ve already invested the time and energy to activate your vision. This is how you protect it for the year ahead.</p>\n\n  <div style="height:2px;background:linear-gradient(90deg,#BF00FF,#39FF14);margin:32px 0;"></div>\n  <p style="margin:0;font-size:15px;color:#E5E5E5;">Jordan &amp; Vanessa Buckingham</p>\n\n</div></td></tr>\n\n<!-- Footer -->\n<tr><td style="padding:32px 20px 0;text-align:center;"><p style="margin:0 0 12px;font-size:13px;color:#999;">Questions? Reply to this email or visit <a href="https://vibrationfit.com/support" style="color:#39FF14;text-decoration:none;font-weight:600;">vibrationfit.com/support</a></p><p style="margin:0 0 8px;font-size:11px;color:#666;">Vibration Fit &middot; <span style="color:#39FF14;">Above the Green Line</span></p><p style="margin:0;font-size:10px;color:#555;">You''re receiving this because you''re a Vision Pro member.</p></td></tr>\n\n</table></td></tr></table>\n</body></html>',

  -- TEXT BODY
  E'LAST CALL TO LOCK IN YOUR YEAR OF VISION PRO\n\nHi {{firstName}},\n\nQuick reminder:\n\nYour first 28 days with Vision Pro wrap up in a few days.\n\nIf you already know you want this to be your new normal, you can still upgrade to an annual Vision Pro membership and save compared to staying on 28-day billing:\n\n{{annualPrice}} for 12 months (vs {{continuityPrice}} every 28 days)\n\nThis founders'' upgrade link is only available until the end of your first 28 days so we can honor the rate you joined at.\n\nUpgrade to annual before your first 28 days end:\nhttps://vibrationfit.com/account/billing?upgrade=annual\n\nIf you do nothing, you''ll simply continue on your current 28-day cycle.\n\nYou''ve already invested the time and energy to activate your vision. This is how you protect it for the year ahead.\n\nJordan & Vanessa Buckingham',

  '["firstName", "continuityPrice", "annualPrice"]'::jsonb,
  '["Sequence: Annual Upgrade Offer (Day 24)"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  status = EXCLUDED.status, subject = EXCLUDED.subject, html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body, variables = EXCLUDED.variables,
  triggers = EXCLUDED.triggers, updated_at = NOW();


-- ============================================================================
-- 2. ANNUAL UPGRADE SEQUENCE
-- ============================================================================

DO $$
DECLARE
  v_seq_id uuid;
  v_tpl_day21 uuid;
  v_tpl_day24 uuid;
BEGIN
  INSERT INTO public.sequences (name, description, trigger_event, trigger_conditions, exit_events, status)
  VALUES (
    'Annual Upgrade Offer',
    'Day 21 + Day 24 emails offering the founders'' annual prepaid upgrade during the first 28-day Vision Pro cycle. Exits if the member upgrades to annual.',
    'intensive.purchased',
    '{}'::jsonb,
    '["membership.upgraded_annual"]'::jsonb,
    'active'
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_seq_id FROM public.sequences WHERE name = 'Annual Upgrade Offer' LIMIT 1;

  IF v_seq_id IS NULL THEN
    RAISE NOTICE 'Annual Upgrade Offer sequence not found, skipping step creation.';
    RETURN;
  END IF;

  SELECT id INTO v_tpl_day21 FROM public.email_templates WHERE slug = 'annual-upgrade-day21';
  SELECT id INTO v_tpl_day24 FROM public.email_templates WHERE slug = 'annual-upgrade-day24';

  IF v_tpl_day21 IS NULL OR v_tpl_day24 IS NULL THEN
    RAISE NOTICE 'Annual upgrade email templates not found. Skipping step creation.';
    RETURN;
  END IF;

  DELETE FROM public.sequence_steps WHERE sequence_id = v_seq_id;

  -- Step 1: Day 21 offer (21 days = 30240 min from enrollment/purchase)
  INSERT INTO public.sequence_steps (sequence_id, step_order, channel, template_id, delay_minutes, delay_from, conditions, status)
  VALUES (v_seq_id, 1, 'email', v_tpl_day21, 30240, 'enrollment', '{}'::jsonb, 'active');

  -- Step 2: Day 24 last call (24 days = 34560 min from enrollment/purchase)
  INSERT INTO public.sequence_steps (sequence_id, step_order, channel, template_id, delay_minutes, delay_from, conditions, status)
  VALUES (v_seq_id, 2, 'email', v_tpl_day24, 34560, 'enrollment', '{}'::jsonb, 'active');

  RAISE NOTICE 'Annual Upgrade Offer sequence created with 2 steps (seq_id: %)', v_seq_id;
END $$;
