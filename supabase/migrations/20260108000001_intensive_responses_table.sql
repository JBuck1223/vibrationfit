-- ============================================================================
-- Unified Intensive Responses Table
-- ============================================================================
-- This table stores all intake/survey data for the Activation Intensive:
--   - Phase 1 (pre_intensive): Initial intake at /intensive/intake
--   - Phase 2 (post_intensive): Unlock survey at /intensive/intake/unlock
--   - Phase 3 (calibration_session): Auto-populated from recorded calibration call
--
-- Design supports:
--   - Video production team (timestamps, segments, soundbites)
--   - Website testimonial sliders (approved quotes with user info)
--   - Marketing (before/after metrics for ads)
--
-- SINGLE SOURCE OF TRUTH for questions:
--   src/lib/constants/intensive-intake-questions.ts
--
-- User will run this migration manually via Supabase SQL Editor
-- ============================================================================

-- Create the unified intensive responses table
CREATE TABLE IF NOT EXISTS intensive_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intensive_id UUID NOT NULL REFERENCES intensive_purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Phase identifier
  phase TEXT NOT NULL CHECK (phase IN ('pre_intensive', 'post_intensive', 'calibration_session')),
  
  -- ============================================================================
  -- RATINGS & QUESTIONS - Used in both pre_intensive and post_intensive phases
  -- ============================================================================
  -- Q1: How clear is your vision for your life?
  vision_clarity INTEGER CHECK (vision_clarity >= 0 AND vision_clarity <= 10),
  
  -- Q2: How often do you feel "in vibrational harmony" with that vision?
  vibrational_harmony INTEGER CHECK (vibrational_harmony >= 0 AND vibrational_harmony <= 10),
  
  -- Q3: How clear are you on your vibrational constraints? (0 if unknown)
  vibrational_constraints_clarity INTEGER CHECK (vibrational_constraints_clarity >= 0 AND vibrational_constraints_clarity <= 10),
  
  -- Q4: How easy is it to create new iterations of your life vision?
  vision_iteration_ease INTEGER CHECK (vision_iteration_ease >= 0 AND vision_iteration_ease <= 10),
  
  -- Q5: Do you currently have audio tracks of your life vision?
  has_audio_tracks TEXT CHECK (has_audio_tracks IN ('no', 'yes')),
  
  -- Q6: How easy is it to create new iterations of your life vision audios?
  audio_iteration_ease INTEGER CHECK (audio_iteration_ease >= 0 AND audio_iteration_ease <= 10),
  
  -- Q7: Do you have a vision board?
  has_vision_board TEXT CHECK (has_vision_board IN (
    'no',
    'yes_physical',
    'yes_digital',
    'yes_both'
  )),
  
  -- Q8: How easy is it to view and manage your vision board items? (0 if none)
  vision_board_management INTEGER CHECK (vision_board_management >= 0 AND vision_board_management <= 10),
  
  -- Q9: How well are you capturing your conscious creation journey?
  journey_capturing INTEGER CHECK (journey_capturing >= 0 AND journey_capturing <= 10),
  
  -- Q10: How clear is your roadmap for activating your life vision day-to-day?
  roadmap_clarity INTEGER CHECK (roadmap_clarity >= 0 AND roadmap_clarity <= 10),
  
  -- Q11: How well are you set up to track major life transformations?
  transformation_tracking INTEGER CHECK (transformation_tracking >= 0 AND transformation_tracking <= 10),
  
  -- ============================================================================
  -- TEXT RESPONSES
  -- ============================================================================
  -- Q12 (pre only): What have you already tried to consciously create your dream life?
  previous_attempts TEXT,
  
  -- Q13 (post only): What feels most different after completing the 72-Hour Activation Intensive?
  biggest_shift TEXT,
  
  -- ============================================================================
  -- AUTO-POPULATED STATS (snapshot at time of survey for post_intensive)
  -- ============================================================================
  stats_snapshot JSONB DEFAULT '{}'::jsonb,
  -- Example structure:
  -- {
  --   "visions_count": 3,
  --   "visions_active": 2,
  --   "visions_draft": 1,
  --   "audio_sets_count": 5,
  --   "audio_tracks_count": 12,
  --   "journal_entries_count": 15,
  --   "vision_board_items_count": 8,
  --   "refinements_count": 7,
  --   "profile_completion": 85
  -- }
  
  -- ============================================================================
  -- QUICK VIDEO TESTIMONIAL (post_intensive phase - user records on unlock page)
  -- ============================================================================
  testimonial_video_url TEXT,              -- S3 URL of quick video testimonial
  testimonial_transcript TEXT,             -- Plain text transcript
  testimonial_transcript_json JSONB,       -- Word-level timestamps for editing
  -- [{"word": "My", "start": 0.0, "end": 0.2}, {"word": "clarity", "start": 0.22, "end": 0.45}, ...]
  testimonial_duration_seconds INTEGER,
  
  -- ============================================================================
  -- CALIBRATION CALL - RECORDING & TRANSCRIPT
  -- ============================================================================
  -- Full recording of the calibration call
  calibration_recording_url TEXT,          -- S3 URL of full call recording
  
  -- Full transcript
  calibration_transcript TEXT,             -- Plain text for search/display
  
  -- Word-level timestamps for precise video editing
  calibration_transcript_json JSONB,
  -- [
  --   {"word": "My", "start": 0.0, "end": 0.2},
  --   {"word": "name", "start": 0.22, "end": 0.45},
  --   {"word": "is", "start": 0.47, "end": 0.55},
  --   {"word": "Sarah", "start": 0.57, "end": 0.85},
  --   ...
  -- ]
  
  calibration_duration_seconds INTEGER,
  
  -- ============================================================================
  -- CALIBRATION CALL - AI-EXTRACTED SEGMENTS
  -- Maps to the 7-section testimonial script from Testimonial_Intake_Flow.md
  -- Video team can jump directly to each section by timestamp
  -- ============================================================================
  calibration_segments JSONB,
  -- {
  --   "hooks": {
  --     "start": 0,
  --     "end": 150,
  --     "transcript": "My name is Sarah, I'm a life coach, and before VibrationFit..."
  --   },
  --   "before_internal": {
  --     "start": 150,
  --     "end": 300,
  --     "transcript": "Before the intensive, every day felt like I was just going through..."
  --   },
  --   "before_external": {
  --     "start": 300,
  --     "end": 420,
  --     "transcript": "I rated my roadmap at a 2 because I literally had no system..."
  --   },
  --   "skepticism": {
  --     "start": 420,
  --     "end": 540,
  --     "transcript": "I was hesitant because I'd tried vision boards before and..."
  --   },
  --   "decision": {
  --     "start": 540,
  --     "end": 600,
  --     "transcript": "What made me commit was seeing the actual structure of the 72 hours..."
  --   },
  --   "what_helped": {
  --     "start": 600,
  --     "end": 780,
  --     "transcript": "The VIVA prompts really helped me get unstuck. Also the audio..."
  --   },
  --   "aha_moment": {
  --     "start": 780,
  --     "end": 840,
  --     "transcript": "The moment it clicked was when I heard my vision in my own voice..."
  --   },
  --   "external_victory": {
  --     "start": 840,
  --     "end": 1020,
  --     "transcript": "Now I can actually see my roadmap. I open the app every morning..."
  --   },
  --   "internal_victory": {
  --     "start": 1020,
  --     "end": 1140,
  --     "transcript": "Emotionally, I feel so much more grounded. Like I finally know..."
  --   },
  --   "best_moment": {
  --     "start": 1140,
  --     "end": 1200,
  --     "transcript": "The single best moment was on day 2 when I finished my first audio..."
  --   },
  --   "synchronicities": {
  --     "start": 1200,
  --     "end": 1260,
  --     "transcript": "I had this crazy coincidence where the day after I wrote my vision..."
  --   },
  --   "recommendation": {
  --     "start": 1260,
  --     "end": 1380,
  --     "transcript": "I would recommend this to anyone who feels scattered or stuck..."
  --   },
  --   "cta": {
  --     "start": 1380,
  --     "end": 1440,
  --     "transcript": "If you're on the fence, just do it. 72 hours is nothing compared to..."
  --   }
  -- }
  
  -- ============================================================================
  -- CALIBRATION CALL - SOUNDBITES
  -- Best quotes for video clips AND website testimonial sliders
  -- Video team: use timestamps to cut clips
  -- Website: filter by approved=true for public display
  -- ============================================================================
  calibration_soundbites JSONB,
  -- [
  --   {
  --     "id": "sb_001",
  --     "text": "My clarity went from 2 to 9 in 72 hours",
  --     "type": "metric_hook",
  --     "start": 45,
  --     "end": 52,
  --     "metrics": {
  --       "vision_clarity": {"before": 2, "after": 9}
  --     },
  --     "approved": false,
  --     "featured": false
  --   },
  --   {
  --     "id": "sb_002",
  --     "text": "I finally feel like I'm living on purpose",
  --     "type": "emotional",
  --     "start": 890,
  --     "end": 898,
  --     "metrics": null,
  --     "approved": false,
  --     "featured": false
  --   },
  --   {
  --     "id": "sb_003",
  --     "text": "If you're scattered and don't know where to start, do this",
  --     "type": "recommendation",
  --     "start": 1320,
  --     "end": 1328,
  --     "metrics": null,
  --     "approved": false,
  --     "featured": false
  --   }
  -- ]
  --
  -- Soundbite types: metric_hook | emotional | recommendation | transformation
  -- approved: set to true after admin review for public display
  -- featured: set to true for homepage/hero placement
  
  -- ============================================================================
  -- METRICS COMPARISON
  -- Auto-populated by comparing baseline and post_intensive phases
  -- Used for video overlays and testimonial cards
  -- ============================================================================
  metrics_comparison JSONB,
  -- {
  --   "vision_clarity": {"before": 2, "after": 9, "change": 7},
  --   "vibrational_harmony": {"before": 3, "after": 8, "change": 5},
  --   "roadmap_clarity": {"before": 2, "after": 9, "change": 7},
  --   "vision_iteration_ease": {"before": 1, "after": 8, "change": 7},
  --   "audio_iteration_ease": {"before": 1, "after": 9, "change": 8},
  --   "transformation_tracking": {"before": 2, "after": 8, "change": 6},
  --   "vibrational_constraints_clarity": {"before": 0, "after": 7, "change": 7},
  --   "vision_board_management": {"before": 0, "after": 8, "change": 8},
  --   "journey_capturing": {"before": 2, "after": 8, "change": 6}
  -- }
  
  -- ============================================================================
  -- PRODUCED VIDEO (final edited testimonial from video production team)
  -- ============================================================================
  produced_video_url TEXT,                 -- S3/CDN URL of final edited testimonial video
  produced_video_thumbnail_url TEXT,       -- Thumbnail for video player/previews
  produced_video_duration_seconds INTEGER, -- Length of final cut
  produced_at TIMESTAMPTZ,                 -- When video production was completed
  
  -- ============================================================================
  -- CONSENT & METADATA
  -- ============================================================================
  -- Q12: Consent for using feedback/results as testimonials
  testimonial_consent BOOLEAN DEFAULT false,
  
  -- Separate consent for named (vs anonymous) testimonials
  consent_for_named_testimonial BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_phase_per_intensive UNIQUE (intensive_id, phase)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_intensive_responses_user_id ON intensive_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_intensive_responses_intensive_id ON intensive_responses(intensive_id);
CREATE INDEX IF NOT EXISTS idx_intensive_responses_phase ON intensive_responses(phase);
CREATE INDEX IF NOT EXISTS idx_intensive_responses_created_at ON intensive_responses(created_at);

-- Index for finding approved soundbites (testimonial slider queries)
CREATE INDEX IF NOT EXISTS idx_intensive_responses_soundbites ON intensive_responses 
  USING GIN (calibration_soundbites jsonb_path_ops);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE intensive_responses ENABLE ROW LEVEL SECURITY;

-- Users can view their own responses
CREATE POLICY "Users can view own intensive responses"
  ON intensive_responses FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own responses
CREATE POLICY "Users can insert own intensive responses"
  ON intensive_responses FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own responses
CREATE POLICY "Users can update own intensive responses"
  ON intensive_responses FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all responses (for testimonial review and video production)
CREATE POLICY "Admins can view all intensive responses"
  ON intensive_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update all responses (for approving soundbites, adding segments)
CREATE POLICY "Admins can update all intensive responses"
  ON intensive_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_intensive_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_intensive_responses_updated_at ON intensive_responses;
CREATE TRIGGER trigger_intensive_responses_updated_at
  BEFORE UPDATE ON intensive_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_intensive_responses_updated_at();

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE ON intensive_responses TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE intensive_responses IS 'Unified table for Activation Intensive data: baseline intake, post-intensive unlock survey, and calibration call recordings/transcripts/soundbites';

COMMENT ON COLUMN intensive_responses.phase IS 'pre_intensive = initial intake, post_intensive = unlock survey, calibration_session = call data';
COMMENT ON COLUMN intensive_responses.calibration_segments IS 'AI-extracted sections from calibration call mapped to testimonial script (hooks, struggles, victories, etc.) with timestamps';
COMMENT ON COLUMN intensive_responses.calibration_soundbites IS 'Best quotes with timestamps for video production and website testimonials. Filter by approved=true for public display.';
COMMENT ON COLUMN intensive_responses.metrics_comparison IS 'Before/after metrics comparison for video overlays and testimonial cards';
COMMENT ON COLUMN intensive_responses.produced_video_url IS 'Final edited testimonial video from video production team';

-- ============================================================================
-- Add unlock columns to intensive_checklist
-- ============================================================================
ALTER TABLE intensive_checklist 
  ADD COLUMN IF NOT EXISTS unlock_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlock_completed_at TIMESTAMP WITHOUT TIME ZONE;

-- ============================================================================
-- HELPER VIEW: Approved testimonials for website slider
-- ============================================================================
CREATE OR REPLACE VIEW approved_testimonials AS
SELECT 
  ir.id as response_id,
  ir.user_id,
  ir.intensive_id,
  p.full_name,
  ua.title as user_title,
  s.value->>'id' as soundbite_id,
  s.value->>'text' as quote,
  s.value->>'type' as quote_type,
  s.value->'metrics' as metrics,
  (s.value->>'start')::integer as video_start,
  (s.value->>'end')::integer as video_end,
  (s.value->>'featured')::boolean as featured,
  ir.calibration_recording_url,
  ir.produced_video_url,
  ir.produced_video_thumbnail_url,
  ir.produced_video_duration_seconds,
  ir.metrics_comparison,
  ir.created_at
FROM intensive_responses ir
CROSS JOIN LATERAL jsonb_array_elements(ir.calibration_soundbites) as s(value)
JOIN profiles p ON ir.user_id = p.id
LEFT JOIN user_accounts ua ON ir.user_id = ua.id
WHERE ir.phase = 'calibration_session'
  AND (s.value->>'approved')::boolean = true
  AND ir.consent_for_named_testimonial = true;

COMMENT ON VIEW approved_testimonials IS 'Pre-filtered view of approved soundbites for website testimonial sliders';
