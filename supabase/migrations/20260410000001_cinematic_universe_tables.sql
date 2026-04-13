-- ============================================
-- Cinematic Universe -- Keyframe Execution Engine
-- ============================================

-- Series: top-level narrative container
CREATE TABLE cu_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  concept TEXT,
  tone TEXT,
  style_guide JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'active', 'complete', 'archived')),
  platform_targets TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cu_series_status ON cu_series(status);
CREATE INDEX idx_cu_series_created_by ON cu_series(created_by);

-- Characters: reusable across episodes within a series (or global when series_id is null)
CREATE TABLE cu_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES cu_series(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  reference_images TEXT[] DEFAULT '{}',
  style_notes TEXT,
  character_type TEXT NOT NULL DEFAULT 'generated'
    CHECK (character_type IN ('real_person', 'generated')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cu_characters_series ON cu_characters(series_id);

-- Episodes: one publishable video
CREATE TABLE cu_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES cu_series(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  concept TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN (
      'planning',
      'keyframes_generating', 'keyframes_review',
      'clips_generating', 'clips_review',
      'approved', 'published'
    )),
  execution_plan JSONB,
  caption TEXT,
  hashtags TEXT,
  call_to_action TEXT,
  final_video_url TEXT,
  target_aspect_ratio TEXT DEFAULT 'landscape_16_9'
    CHECK (target_aspect_ratio IN ('landscape_16_9', 'portrait_9_16', 'square_1_1')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cu_episodes_series ON cu_episodes(series_id);
CREATE INDEX idx_cu_episodes_status ON cu_episodes(status);

-- Media: all generated assets (images and videos)
-- Created before keyframes/clips so they can reference it
CREATE TABLE cu_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  url TEXT NOT NULL,
  s3_key TEXT,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  duration_seconds NUMERIC,
  fal_model TEXT,
  fal_request_id TEXT,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Keyframes: each image to be generated (the atomic planning unit)
CREATE TABLE cu_keyframes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES cu_episodes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  prompt TEXT,
  negative_prompt TEXT,
  fal_model TEXT,
  target_size TEXT DEFAULT 'landscape_16_9',
  character_ids UUID[] DEFAULT '{}',
  style_reference_keyframe_id UUID REFERENCES cu_keyframes(id) ON DELETE SET NULL,
  reference_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'complete', 'approved', 'rejected', 'failed')),
  generated_media_id UUID REFERENCES cu_media(id) ON DELETE SET NULL,
  generation_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cu_keyframes_episode ON cu_keyframes(episode_id);
CREATE INDEX idx_cu_keyframes_status ON cu_keyframes(status);
CREATE INDEX idx_cu_keyframes_sort ON cu_keyframes(episode_id, sort_order);

-- Clips: each video clip generated between two keyframes
-- transition_type: 'chain' means first frame = previous clip's last frame (seamless)
--                  'jump_cut' means first frame is independent (scene change)
CREATE TABLE cu_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES cu_episodes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  first_frame_keyframe_id UUID NOT NULL REFERENCES cu_keyframes(id) ON DELETE CASCADE,
  last_frame_keyframe_id UUID NOT NULL REFERENCES cu_keyframes(id) ON DELETE CASCADE,
  transition_type TEXT NOT NULL DEFAULT 'chain'
    CHECK (transition_type IN ('chain', 'jump_cut')),
  prompt TEXT,
  fal_model TEXT,
  duration_seconds NUMERIC DEFAULT 6,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'waiting_keyframes', 'generating', 'complete', 'approved', 'rejected', 'failed')),
  generated_media_id UUID REFERENCES cu_media(id) ON DELETE SET NULL,
  generation_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cu_clips_episode ON cu_clips(episode_id);
CREATE INDEX idx_cu_clips_status ON cu_clips(status);
CREATE INDEX idx_cu_clips_sort ON cu_clips(episode_id, sort_order);

-- Scheduled posts: social media publishing queue
CREATE TABLE cu_scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES cu_episodes(id) ON DELETE CASCADE,
  media_ids UUID[] NOT NULL DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  title TEXT,
  caption TEXT,
  hashtags TEXT,
  link_url TEXT,
  call_to_action TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'publishing', 'posted', 'failed', 'cancelled')),
  publish_result JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cu_scheduled_posts_status_at ON cu_scheduled_posts(status, scheduled_at)
  WHERE status = 'scheduled';
CREATE INDEX idx_cu_scheduled_posts_episode ON cu_scheduled_posts(episode_id);

-- Updated_at triggers
CREATE TRIGGER cu_series_updated_at
  BEFORE UPDATE ON cu_series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cu_characters_updated_at
  BEFORE UPDATE ON cu_characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cu_episodes_updated_at
  BEFORE UPDATE ON cu_episodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cu_keyframes_updated_at
  BEFORE UPDATE ON cu_keyframes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cu_clips_updated_at
  BEFORE UPDATE ON cu_clips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cu_scheduled_posts_updated_at
  BEFORE UPDATE ON cu_scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (admin-only for all cinematic tables)
ALTER TABLE cu_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_keyframes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Staff access policies
CREATE POLICY "Staff can manage cu_series" ON cu_series FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.is_active = true));

CREATE POLICY "Staff can manage cu_characters" ON cu_characters FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.is_active = true));

CREATE POLICY "Staff can manage cu_episodes" ON cu_episodes FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.is_active = true));

CREATE POLICY "Staff can manage cu_media" ON cu_media FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.is_active = true));

CREATE POLICY "Staff can manage cu_keyframes" ON cu_keyframes FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.is_active = true));

CREATE POLICY "Staff can manage cu_clips" ON cu_clips FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.is_active = true));

CREATE POLICY "Staff can manage cu_scheduled_posts" ON cu_scheduled_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.is_active = true));
