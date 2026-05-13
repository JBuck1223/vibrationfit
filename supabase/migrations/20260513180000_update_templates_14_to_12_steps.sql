-- ============================================================================
-- Migration: Update email templates from 14 to 12 intensive steps
--
-- Removes two steps from the Activation Intensive:
--   Old Step 7:  "Refine Your Vision with VIVA"
--   Old Step 13: "Book Your Calibration Call"
--
-- Remaining steps are renumbered 1-12. New step mapping:
--   1. Start Your Intensive       (unchanged)
--   2. Account Settings           (unchanged)
--   3. Baseline Intake            (unchanged)
--   4. Create Your Profile        (unchanged)
--   5. Vibration Assessment       (unchanged)
--   6. Build Your Life Vision     (unchanged)
--   7. Generate Your Activation Audio  (was 8)
--   8. Record Your Voice               (was 9)
--   9. Audio Mix                       (was 10)
--  10. Build Your Vision Board         (was 11)
--  11. First Journal Entry             (was 12)
--  12. My Activation Plan              (was 14)
--
-- calibration_call_requested / calibration_call_booked notification configs
-- are intentionally left unchanged (admin uses these for operational alerts).
-- ============================================================================


-- ============================================================================
-- SECTION 1: Global text pattern replacements
-- Safe to apply across all email_templates — these patterns only appear in
-- intensive-related content.
-- ============================================================================

-- 1a. "14-step" → "12-step" (plain text hyphenated)
UPDATE email_templates SET
  description = REPLACE(description, '14-step', '12-step'),
  html_body = REPLACE(html_body, '14-step', '12-step'),
  text_body = REPLACE(text_body, '14-step', '12-step')
WHERE description LIKE '%14-step%'
   OR html_body LIKE '%14-step%'
   OR text_body LIKE '%14-step%';

-- 1b. "14&#8209;step" → "12&#8209;step" (HTML non-breaking hyphen variant)
UPDATE email_templates SET
  html_body = REPLACE(html_body, '14&#8209;step', '12&#8209;step')
WHERE html_body LIKE '%14&#8209;step%';

-- 1c. "14 steps" → "12 steps"
UPDATE email_templates SET
  html_body = REPLACE(html_body, '14 steps', '12 steps'),
  text_body = REPLACE(text_body, '14 steps', '12 steps')
WHERE html_body LIKE '%14 steps%'
   OR text_body LIKE '%14 steps%';

-- 1d. "Step 14 of 14" → "Step 12 of 12"
UPDATE email_templates SET
  html_body = REPLACE(html_body, 'Step 14 of 14', 'Step 12 of 12'),
  text_body = REPLACE(text_body, 'Step 14 of 14', 'Step 12 of 12')
WHERE html_body LIKE '%Step 14 of 14%'
   OR text_body LIKE '%Step 14 of 14%';

-- 1e. Remaining "Step 14" → "Step 12" (e.g. "reach Step 14", description)
UPDATE email_templates SET
  description = REPLACE(description, 'Step 14', 'Step 12'),
  html_body = REPLACE(html_body, 'Step 14', 'Step 12'),
  text_body = REPLACE(text_body, 'Step 14', 'Step 12')
WHERE description LIKE '%Step 14%'
   OR html_body LIKE '%Step 14%'
   OR text_body LIKE '%Step 14%';

-- 1f. "Steps 13-14" → "Step 12" (Day 3 completion section)
UPDATE email_templates SET
  html_body = REPLACE(html_body, 'Steps 13-14', 'Step 12'),
  text_body = REPLACE(text_body, 'Steps 13-14', 'Step 12')
WHERE html_body LIKE '%Steps 13-14%'
   OR text_body LIKE '%Steps 13-14%';

-- 1g. "Steps 10-12" → "Steps 10-11" (Day 3 activation section)
UPDATE email_templates SET
  html_body = REPLACE(html_body, 'Steps 10-12', 'Steps 10-11'),
  text_body = REPLACE(text_body, 'Steps 10-12', 'Steps 10-11')
WHERE html_body LIKE '%Steps 10-12%'
   OR text_body LIKE '%Steps 10-12%';

-- 1h. "step 13" → "step 11" (lowercase, in triggers/descriptions)
UPDATE email_templates SET
  description = REPLACE(description, 'step 13', 'step 11')
WHERE description LIKE '%step 13%';


-- ============================================================================
-- SECTION 2: Numbered step list — remove steps 7 & 13, renumber 8-14 → 7-12
-- Affects: intensive-welcome-access, premium-intensive-welcome-access,
--          launch-access-login
-- ============================================================================

-- 2a. text_body: remove step lines and renumber
UPDATE email_templates SET
  text_body = REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(text_body,
                  E'\n7. Refine Your Vision with VIVA', ''),
                E'\n13. Book Your Calibration Call', ''),
              '14. My Activation Plan', '12. My Activation Plan'),
            '12. First Journal Entry', '11. First Journal Entry'),
          '11. Build Your Vision Board', '10. Build Your Vision Board'),
        '10. Audio Mix', '9. Audio Mix'),
      '9. Record Your Voice', '8. Record Your Voice'),
    '8. Generate Your Activation Audio', '7. Generate Your Activation Audio')
WHERE slug IN (
  'intensive-welcome-access',
  'premium-intensive-welcome-access',
  'launch-access-login'
);

-- 2b. html_body: remove step 7 and step 13 <p> tags
UPDATE email_templates SET
  html_body = REPLACE(
    REPLACE(html_body,
      '<p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">7. Refine Your Vision with VIVA</p>',
      ''),
    '<p style="margin:0 0 4px;font-size:13px;color:#E5E5E5;">13. Book Your Calibration Call</p>',
    '')
WHERE slug IN (
  'intensive-welcome-access',
  'premium-intensive-welcome-access',
  'launch-access-login'
);

-- 2c. html_body: renumber remaining steps
UPDATE email_templates SET
  html_body = REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(html_body,
              '>14. My Activation Plan', '>12. My Activation Plan'),
            '>12. First Journal Entry', '>11. First Journal Entry'),
          '>11. Build Your Vision Board', '>10. Build Your Vision Board'),
        '>10. Audio Mix', '>9. Audio Mix'),
      '>9. Record Your Voice', '>8. Record Your Voice'),
    '>8. Generate Your Activation Audio', '>7. Generate Your Activation Audio')
WHERE slug IN (
  'intensive-welcome-access',
  'premium-intensive-welcome-access',
  'launch-access-login'
);


-- ============================================================================
-- SECTION 3: Day 2 emails — remove "Refine Your Vision with VIVA" bullet
-- Affects: intensive-day2-vision-audio, launch-intensive-day2
-- ============================================================================

-- 3a. description
UPDATE email_templates SET
  description = REPLACE(description, 'Refine, ', '')
WHERE slug = 'intensive-day2-vision-audio';

-- 3b. text_body
UPDATE email_templates SET
  text_body = REPLACE(text_body, E'- Refine Your Vision with VIVA\n', '')
WHERE slug IN ('intensive-day2-vision-audio', 'launch-intensive-day2');

-- 3c. html_body (bullet style)
UPDATE email_templates SET
  html_body = REPLACE(html_body,
    '<p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;">&#8226; Refine Your Vision with VIVA</p>',
    '')
WHERE slug IN ('intensive-day2-vision-audio', 'launch-intensive-day2');


-- ============================================================================
-- SECTION 4: Day 3 emails — remove "Book Calibration Call" bullet
-- Step range updates already handled by Section 1 (1f, 1g).
-- Affects: intensive-day3-activation, launch-intensive-day3
-- ============================================================================

-- 4a. descriptions
UPDATE email_templates SET
  description = REPLACE(description, 'Call, ', '')
WHERE slug = 'intensive-day3-activation';

UPDATE email_templates SET
  description = REPLACE(description, 'calibration call, ', '')
WHERE slug = 'launch-intensive-day3';

-- 4b. text_body
UPDATE email_templates SET
  text_body = REPLACE(text_body, E'- Book Calibration Call\n', '')
WHERE slug IN ('intensive-day3-activation', 'launch-intensive-day3');

-- 4c. html_body (margin:0 0 16px variant — last bullet before next heading)
UPDATE email_templates SET
  html_body = REPLACE(html_body,
    '<p style="margin:0 0 16px;font-size:14px;color:#E5E5E5;">&#8226; Book Calibration Call</p>',
    '')
WHERE slug IN ('intensive-day3-activation', 'launch-intensive-day3');

-- 4d. html_body (margin:0 0 4px variant — if formatting differs)
UPDATE email_templates SET
  html_body = REPLACE(html_body,
    '<p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;">&#8226; Book Calibration Call</p>',
    '')
WHERE slug IN ('intensive-day3-activation', 'launch-intensive-day3');


-- ============================================================================
-- SECTION 5: Orientation emails — remove "Calibration Call booked" deliverable
-- Affects: intensive-orientation, launch-orientation
-- ============================================================================

-- 5a. text_body
UPDATE email_templates SET
  text_body = REPLACE(text_body, E'- A live Calibration Call booked\n', '')
WHERE slug IN ('intensive-orientation', 'launch-orientation');

-- 5b. html_body (checkmark bullet)
UPDATE email_templates SET
  html_body = REPLACE(html_body,
    '<p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> A live Calibration Call booked</p>',
    '')
WHERE slug IN ('intensive-orientation', 'launch-orientation');


-- ============================================================================
-- SECTION 6: Launch offer email — remove calibration call from feature lists
-- Affects: launch-offer-pitch
-- ============================================================================

-- 6a. text_body: remove both calibration call bullet variants
UPDATE email_templates SET
  text_body = REPLACE(
    REPLACE(text_body,
      E'- A calibration call booked\n', ''),
    E'- 30-minute Calibration Call with a coach\n', '')
WHERE slug = 'launch-offer-pitch';

-- 6b. html_body: remove from intro bullet list
UPDATE email_templates SET
  html_body = REPLACE(html_body,
    '<p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#E5E5E5;">&#8226; A calibration call booked</p>',
    '')
WHERE slug = 'launch-offer-pitch';

-- 6c. html_body: remove from Path 1 feature checklist
UPDATE email_templates SET
  html_body = REPLACE(html_body,
    '<tr><td style="padding:4px 0;color:#E5E5E5;font-size:14px;"><span style="color:#39FF14;margin-right:8px;">&#10003;</span> 30&#8209;minute Calibration Call with a coach</td></tr>',
    '')
WHERE slug = 'launch-offer-pitch';


-- ============================================================================
-- SECTION 7: Premium welcome email — remove calibration from What's Included
-- Affects: premium-intensive-welcome-access
-- ============================================================================

-- 7a. text_body
UPDATE email_templates SET
  text_body = REPLACE(text_body, E'- Calibration Call with a coach\n', '')
WHERE slug = 'premium-intensive-welcome-access';

-- 7b. html_body (checkmark bullet)
UPDATE email_templates SET
  html_body = REPLACE(html_body,
    '<p style="margin:0 0 4px;font-size:14px;color:#E5E5E5;"><span style="color:#39FF14;">&#10003;</span> Calibration Call with a coach</p>',
    '')
WHERE slug = 'premium-intensive-welcome-access';


-- ============================================================================
-- NOTE: The following are intentionally NOT modified by this migration:
--
-- 1. notification_configs rows for calibration_call_requested and
--    calibration_call_booked — admin relies on these for operational alerts.
--
-- 2. The intensive_checklist column comment in
--    20260115165814_add_14_step_intensive_fields.sql — historical migration
--    comments are left as-is; the live column comment can be updated
--    separately if needed.
--
-- 3. Email triggers (jsonb) referencing old step numbers — these are
--    internal scheduling metadata, not user-facing content.
-- ============================================================================
