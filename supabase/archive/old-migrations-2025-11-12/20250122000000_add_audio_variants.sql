-- Create audio_variants table to store variant configurations
CREATE TABLE IF NOT EXISTS audio_variants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  voice_volume INTEGER NOT NULL DEFAULT 50,
  bg_volume INTEGER NOT NULL DEFAULT 50,
  background_track TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (voice_volume + bg_volume = 100)
);

-- Insert default variants
INSERT INTO audio_variants (id, name, voice_volume, bg_volume, background_track) VALUES
  ('standard', 'Voice Only', 100, 0, NULL),
  ('sleep', 'Sleep (Ocean Waves)', 30, 70, 'Ocean-Waves-1.mp3'),
  ('meditation', 'Meditation', 50, 50, 'Ocean-Waves-1.mp3'),
  ('energy', 'Energy', 80, 20, 'Ocean-Waves-1.mp3')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE audio_variants ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read variants
CREATE POLICY "Anyone can read audio variants"
  ON audio_variants
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage variants (admin only in production)
CREATE POLICY "Authenticated users can manage audio variants"
  ON audio_variants
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_audio_variants_id ON audio_variants(id);
