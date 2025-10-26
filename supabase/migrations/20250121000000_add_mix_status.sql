-- Add mix_status column to audio_tracks
ALTER TABLE audio_tracks
ADD COLUMN IF NOT EXISTS mix_status TEXT DEFAULT 'not_required' CHECK (mix_status IN ('not_required', 'pending', 'mixing', 'completed', 'failed'));

-- Add mixed_audio_url and mixed_s3_key for the final mixed versions
ALTER TABLE audio_tracks
ADD COLUMN IF NOT EXISTS mixed_audio_url TEXT;

ALTER TABLE audio_tracks
ADD COLUMN IF NOT EXISTS mixed_s3_key TEXT;

-- Add comment
COMMENT ON COLUMN audio_tracks.mix_status IS 'Status of background mixing: not_required, pending, mixing, completed, failed';
