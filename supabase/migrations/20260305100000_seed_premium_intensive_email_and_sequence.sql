-- ============================================================================
-- PREMIUM INTENSIVE ONBOARDING: Welcome Email Template + Drip Sequence
--
-- Adds a premium-specific welcome email (sent immediately on purchase) and
-- creates a 6-step onboarding sequence triggered by 'intensive_premium.purchased'.
-- Steps 2-6 reuse the standard intensive onboarding templates (orientation,
-- day 1, day 2, day 3, day 4) since premium buyers do the same 14-step
-- Activation Intensive.
-- ============================================================================


-- ============================================================================
-- 1. PREMIUM WELCOME EMAIL TEMPLATE
-- ============================================================================

INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables, triggers)
VALUES (
  'premium-intensive-welcome-access',
  'Premium Intensive: Welcome & Access',
  'Immediately after premium intensive purchase. Login link, password setup, 14-step overview, coaching schedule, 72-hour framing.',
  'intensive',
  'active',

  -- SUBJECT
  E'You''re in: Activation Intensive + Premium Coaching',

  -- HTML BODY
  E'<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;background-color:#000;color:#fff;">\n<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000;"><tr><td align="center" style="padding:40px 20px;">\n<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">\n\n<!-- Badge -->\n<tr><td style="padding:0 0 24px;text-align:center;"><div style="display:inline-block;padding:8px 24px;background-color:rgba(191,0,255,0.1);border-radius:50px;border:2px solid #BF00FF;"><p style="margin:0;font-size:12px;font-weight:600;color:#BF00FF;text-transform:uppercase;letter-spacing:1px;">Activation Intensive + Premium Coaching</p></div></td></tr>\n\n<!-- Main Card -->\n<tr><td style="padding:0;"><div style="padding:40px;background-color:#1F1F1F;border-radius:16px;border:2px solid #BF00FF;">\n\n  <h1 style="margin:0 0 24px;font-size:28px;font-weight:bold;color:#fff;text-align:center;line-height:1.2;">Welcome to the Premium Experience.</h1>\n\n  <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#E5E5E5;">Hi {{firstName}},</p>\n\n  <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#E5E5E5;">Your Activation Intensive + Premium Coaching access is live. You have everything you need to install a complete conscious creation system in 72 hours, <strong style="color:#BF00FF;">plus 10 private coaching sessions</strong> to accelerate your results over the next 8 weeks.</p>\n\n  <!-- Login Box -->\n  <div style="margin:0 0 24px;padding:24px;background-color:#000;border-radius:12px;border:2px solid #39FF14;">\n    <p style="margin:0 0 16px;font-size:11px;color:#39FF14;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Login</p>\n    <p style="margin:0 0 8px;font-size:15px;color:#E5E5E5;">Your account is set up with <strong style="color:#39FF14;">{{email}}</strong></p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;">1. Click the button below</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;">2. Set your password</p>\n    <p style="margin:0;font-size:14px;color:#E5E5E5;">3. You''ll land on your Intensive start page</p>\n  </div>\n\n  <!-- CTA Button -->\n  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td align="center"><a href="https://vibrationfit.com/auth/setup-password?intensive=true" style="display:inline-block;padding:18px 48px;background-color:#BF00FF;color:#fff;text-decoration:none;font-size:16px;font-weight:700;border-radius:50px;">Set Your Password &amp; Log In</a></td></tr></table>\n  <p style="margin:0 0 24px;font-size:13px;color:#999;text-align:center;">Already set your password? <a href="https://vibrationfit.com/auth/login" style="color:#BF00FF;text-decoration:none;">Log in here</a></p>\n\n  <!-- Premium Coaching Schedule -->\n  <div style="margin:0 0 24px;padding:24px;background-color:rgba(191,0,255,0.05);border-radius:12px;border:2px solid #BF00FF;">\n    <p style="margin:0 0 16px;font-size:11px;color:#BF00FF;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Premium Coaching Schedule</p>\n    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#E5E5E5;">You have <strong style="color:#BF00FF;">10 private 1:1 coaching sessions</strong> over 8 weeks:</p>\n    <p style="margin:0 0 8px;font-size:14px;color:#E5E5E5;"><strong style="color:#BF00FF;">Weeks 1-2:</strong> 2 sessions per week (rapid constraint clearing)</p>\n    <p style="margin:0 0 8px;font-size:14px;color:#E5E5E5;"><strong style="color:#BF00FF;">Weeks 3-8:</strong> 1 session per week (deepening and integration)</p>\n    <p style="margin:0 0 16px;font-size:14px;color:#E5E5E5;">Your coach will reach out within 24 hours of your Intensive completion to schedule your first session.</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#BF00FF;">&#10003;</span> Identify and eliminate vibrational constraints</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#BF00FF;">&#10003;</span> Personalized practice plan built each session</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#BF00FF;">&#10003;</span> Deep-dive vision refinement with expert guidance</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#BF00FF;">&#10003;</span> Real-time course correction as your reality shifts</p>\n    <p style="margin:0;font-size:14px;color:#E5E5E5;"><span style="color:#BF00FF;">&#10003;</span> Priority support between sessions</p>\n  </div>\n\n  <!-- 72-Hour Intensive Path -->\n  <div style="margin:0 0 24px;padding:24px;background-color:#000;border-radius:12px;border:1px solid #333;">\n    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#fff;">When Your 72 Hours Starts</p>\n    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#E5E5E5;">Your 72-hour focus window does <strong>not</strong> start until you click the "Start My Activation Intensive" button. No rush to click today if you need to carve out focused time first.</p>\n    <p style="margin:0 0 8px;font-size:14px;color:#E5E5E5;">Once you hit "Start," you''ll be guided through a clear 14-step path:</p>\n    <p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">1. Start Your Intensive</p>\n    <p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">2. Account Settings</p>\n    <p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">3. Baseline Intake</p>\n    <p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">4. Create Your Profile</p>\n    <p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">5. Vibration Assessment (84 Questions)</p>\n    <p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">6. Build Your Life Vision (12 Categories)</p>\n    <p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">7. Refine Your Vision with VIVA</p>\n    <p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">8. Generate Your Activation Audio</p>\n    <p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">9. Record Your Voice</p>\n    <p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">10. Audio Mix</p>\n    <p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">11. Build Your Vision Board</p>\n    <p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">12. First Journal Entry</p>\n    <p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">13. Book Your Calibration Call</p>\n    <p style="margin:0;font-size:13px;color:#E5E5E5;">14. My Activation Plan (28-Day Launch)</p>\n  </div>\n\n  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#E5E5E5;">Most people complete everything inside their 72-hour window. If life happens and you need more time, take it. The timer is for momentum, not pressure.</p>\n\n  <!-- What''s Included Summary -->\n  <div style="margin:0 0 24px;padding:24px;background-color:#000;border-radius:12px;border:1px solid #333;">\n    <p style="margin:0 0 16px;font-size:11px;color:#39FF14;text-transform:uppercase;letter-spacing:1px;font-weight:600;">What''s Included</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> Full 72-Hour Activation Intensive</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> 12-category Life Vision built with VIVA</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> Vision Audio (AM/PM), Vision Board, and Journal</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> Calibration Call with a coach</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> My Activation Plan (your daily roadmap)</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> Graduate Unlocks: Advanced Audio Suite, Alignment Gym, and Vibe Tribe</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> 5M VIVA tokens included</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> 8 weeks Vision Pro included</p>\n    <p style="margin:0 0 8px;font-size:14px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> 100GB storage</p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#BF00FF;">&#10003;</span> <strong style="color:#BF00FF;">10 private 1:1 coaching sessions over 8 weeks</strong></p>\n    <p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#BF00FF;">&#10003;</span> <strong style="color:#BF00FF;">Priority support between sessions</strong></p>\n    <p style="margin:0;font-size:14px;color:#E5E5E5;"><span style="color:#BF00FF;">&#10003;</span> <strong style="color:#BF00FF;">Deep-dive vision refinement with expert guidance</strong></p>\n  </div>\n\n  <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#fff;">Need Help?</p>\n  <p style="margin:0;font-size:15px;line-height:1.6;color:#E5E5E5;">Just reply to this email or reach us at <a href="mailto:support@vibrationfit.com" style="color:#BF00FF;text-decoration:none;">support@vibrationfit.com</a>. We typically respond within 24 hours on business days.</p>\n\n  <div style="height:2px;background:linear-gradient(90deg,#BF00FF,#39FF14);margin:32px 0;"></div>\n  <p style="margin:0;font-size:15px;color:#E5E5E5;">Welcome to the Premium experience,<br>The Vibration Fit Team</p>\n\n</div></td></tr>\n\n<!-- Footer -->\n<tr><td style="padding:32px 20px 0;text-align:center;"><p style="margin:0 0 12px;font-size:13px;color:#999;">Questions? Reply to this email or visit <a href="https://vibrationfit.com/support" style="color:#BF00FF;text-decoration:none;font-weight:600;">vibrationfit.com/support</a></p><p style="margin:0 0 8px;font-size:11px;color:#666;">Vibration Fit &middot; <span style="color:#39FF14;">Above the Green Line</span></p><p style="margin:0;font-size:10px;color:#555;">You''re receiving this because you purchased the Activation Intensive + Premium Coaching.</p></td></tr>\n\n</table></td></tr></table>\n</body></html>',

  -- TEXT BODY
  E'YOU''RE IN: ACTIVATION INTENSIVE + PREMIUM COACHING\n\nHi {{firstName}},\n\nYour Activation Intensive + Premium Coaching access is live. You have everything you need to install a complete conscious creation system in 72 hours, plus 10 private coaching sessions to accelerate your results over the next 8 weeks.\n\nYOUR LOGIN\nYour account is set up with {{email}}\n1. Click the link below\n2. Set your password\n3. You''ll land on your Intensive start page\n\nSet Your Password & Log In:\nhttps://vibrationfit.com/auth/setup-password?intensive=true\n\nAlready set your password? Log in here:\nhttps://vibrationfit.com/auth/login\n\nYOUR PREMIUM COACHING SCHEDULE\nYou have 10 private 1:1 coaching sessions over 8 weeks:\n\nWeeks 1-2: 2 sessions per week (rapid constraint clearing)\nWeeks 3-8: 1 session per week (deepening and integration)\n\nYour coach will reach out within 24 hours of your Intensive completion to schedule your first session.\n\n- Identify and eliminate vibrational constraints\n- Personalized practice plan built each session\n- Deep-dive vision refinement with expert guidance\n- Real-time course correction as your reality shifts\n- Priority support between sessions\n\nWHEN YOUR 72 HOURS STARTS\nYour 72-hour focus window does NOT start until you click the "Start My Activation Intensive" button. No rush to click today if you need to carve out focused time first.\n\nOnce you hit "Start," you''ll be guided through a clear 14-step path:\n1. Start Your Intensive\n2. Account Settings\n3. Baseline Intake\n4. Create Your Profile\n5. Vibration Assessment (84 Questions)\n6. Build Your Life Vision (12 Categories)\n7. Refine Your Vision with VIVA\n8. Generate Your Activation Audio\n9. Record Your Voice\n10. Audio Mix\n11. Build Your Vision Board\n12. First Journal Entry\n13. Book Your Calibration Call\n14. My Activation Plan (28-Day Launch)\n\nMost people complete everything inside their 72-hour window. If life happens and you need more time, take it. The timer is for momentum, not pressure.\n\nWHAT''S INCLUDED\n- Full 72-Hour Activation Intensive\n- 12-category Life Vision built with VIVA\n- Vision Audio (AM/PM), Vision Board, and Journal\n- Calibration Call with a coach\n- My Activation Plan (your daily roadmap)\n- Graduate Unlocks: Advanced Audio Suite, Alignment Gym, and Vibe Tribe\n- 5M VIVA tokens included\n- 8 weeks Vision Pro included\n- 100GB storage\n- 10 private 1:1 coaching sessions over 8 weeks\n- Priority support between sessions\n- Deep-dive vision refinement with expert guidance\n\nNEED HELP?\nJust reply to this email or reach us at support@vibrationfit.com.\nWe typically respond within 24 hours on business days.\n\nWelcome to the Premium experience,\nThe Vibration Fit Team',

  '["firstName", "email"]'::jsonb,
  '["Stripe webhook: premium intensive purchased", "triggerEvent: intensive_premium.purchased"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  status = EXCLUDED.status, subject = EXCLUDED.subject, html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body, variables = EXCLUDED.variables,
  triggers = EXCLUDED.triggers, updated_at = NOW();


-- ============================================================================
-- 2. PREMIUM INTENSIVE ONBOARDING SEQUENCE
-- ============================================================================

DO $$
DECLARE
  v_seq_id uuid;
  v_tpl_premium_welcome uuid;
  v_tpl_orientation uuid;
  v_tpl_day1 uuid;
  v_tpl_day2 uuid;
  v_tpl_day3 uuid;
  v_tpl_day4 uuid;
BEGIN
  INSERT INTO public.sequences (name, description, trigger_event, trigger_conditions, exit_events, status)
  VALUES (
    'Premium Intensive Onboarding',
    '6-step drip sequence after Premium Intensive purchase. Premium welcome email, then same orientation and daily guidance as standard. Day 4 debrief only if not yet unlocked.',
    'intensive_premium.purchased',
    '{}'::jsonb,
    '["intensive.completed"]'::jsonb,
    'active'
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_seq_id FROM public.sequences WHERE name = 'Premium Intensive Onboarding' LIMIT 1;

  IF v_seq_id IS NULL THEN
    RAISE NOTICE 'Premium Intensive Onboarding sequence not found, skipping step creation.';
    RETURN;
  END IF;

  SELECT id INTO v_tpl_premium_welcome FROM public.email_templates WHERE slug = 'premium-intensive-welcome-access';
  SELECT id INTO v_tpl_orientation FROM public.email_templates WHERE slug = 'intensive-orientation';
  SELECT id INTO v_tpl_day1 FROM public.email_templates WHERE slug = 'intensive-day1-start';
  SELECT id INTO v_tpl_day2 FROM public.email_templates WHERE slug = 'intensive-day2-vision-audio';
  SELECT id INTO v_tpl_day3 FROM public.email_templates WHERE slug = 'intensive-day3-activation';
  SELECT id INTO v_tpl_day4 FROM public.email_templates WHERE slug = 'intensive-day4-debrief';

  IF v_tpl_premium_welcome IS NULL OR v_tpl_orientation IS NULL OR v_tpl_day1 IS NULL
     OR v_tpl_day2 IS NULL OR v_tpl_day3 IS NULL OR v_tpl_day4 IS NULL THEN
    RAISE NOTICE 'One or more email templates not found. Skipping step creation.';
    RETURN;
  END IF;

  DELETE FROM public.sequence_steps WHERE sequence_id = v_seq_id;

  -- Step 1: Premium Welcome (immediate)
  INSERT INTO public.sequence_steps (sequence_id, step_order, channel, template_id, delay_minutes, delay_from, conditions, status)
  VALUES (v_seq_id, 1, 'email', v_tpl_premium_welcome, 0, 'enrollment', '{}'::jsonb, 'active');

  -- Step 2: Orientation (60 min, same as standard)
  INSERT INTO public.sequence_steps (sequence_id, step_order, channel, template_id, delay_minutes, delay_from, conditions, status)
  VALUES (v_seq_id, 2, 'email', v_tpl_orientation, 60, 'enrollment', '{}'::jsonb, 'active');

  -- Step 3: Day 1 (24h, skip if assessment completed)
  INSERT INTO public.sequence_steps (sequence_id, step_order, channel, template_id, delay_minutes, delay_from, conditions, status)
  VALUES (v_seq_id, 3, 'email', v_tpl_day1, 1440, 'enrollment',
    '{"skip_if_checklist": {"table": "intensive_checklist", "user_field": "user_id", "check_field": "assessment_completed", "check_value": true}}'::jsonb,
    'active');

  -- Step 4: Day 2 (48h, skip if audio generated)
  INSERT INTO public.sequence_steps (sequence_id, step_order, channel, template_id, delay_minutes, delay_from, conditions, status)
  VALUES (v_seq_id, 4, 'email', v_tpl_day2, 2880, 'enrollment',
    '{"skip_if_checklist": {"table": "intensive_checklist", "user_field": "user_id", "check_field": "audio_generated", "check_value": true}}'::jsonb,
    'active');

  -- Step 5: Day 3 (72h, skip if unlocked)
  INSERT INTO public.sequence_steps (sequence_id, step_order, channel, template_id, delay_minutes, delay_from, conditions, status)
  VALUES (v_seq_id, 5, 'email', v_tpl_day3, 4320, 'enrollment',
    '{"skip_if_checklist": {"table": "intensive_checklist", "user_field": "user_id", "check_field": "unlock_completed", "check_value": true}}'::jsonb,
    'active');

  -- Step 6: Day 4 Debrief (84h, skip if unlocked)
  INSERT INTO public.sequence_steps (sequence_id, step_order, channel, template_id, delay_minutes, delay_from, conditions, status)
  VALUES (v_seq_id, 6, 'email', v_tpl_day4, 5040, 'enrollment',
    '{"skip_if_checklist": {"table": "intensive_checklist", "user_field": "user_id", "check_field": "unlock_completed", "check_value": true}}'::jsonb,
    'active');

  RAISE NOTICE 'Premium Intensive Onboarding sequence created with 6 steps (seq_id: %)', v_seq_id;
END $$;
