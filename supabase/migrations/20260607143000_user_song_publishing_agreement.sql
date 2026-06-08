-- One-time Song Publishing Agreement acceptance per user

ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS song_publishing_agreement_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS song_publishing_agreement_version text,
  ADD COLUMN IF NOT EXISTS song_publishing_legal_name text;

COMMENT ON COLUMN public.user_accounts.song_publishing_agreement_accepted_at IS
  'When the user accepted the Song Publishing Agreement';
COMMENT ON COLUMN public.user_accounts.song_publishing_agreement_version IS
  'Version of the Song Publishing Agreement the user accepted';
COMMENT ON COLUMN public.user_accounts.song_publishing_legal_name IS
  'Legal name provided when accepting the Song Publishing Agreement';

-- Backfill users who already submitted tracks
UPDATE public.user_accounts ua
SET
  song_publishing_agreement_accepted_at = sub.first_accepted,
  song_publishing_agreement_version = sub.agreement_version,
  song_publishing_legal_name = sub.legal_name
FROM (
  SELECT DISTINCT ON (user_id)
    user_id,
    agreement_accepted_at AS first_accepted,
    agreement_version,
    songwriter_legal_name AS legal_name
  FROM public.song_publish_requests
  ORDER BY user_id, created_at ASC
) sub
WHERE ua.id = sub.user_id
  AND ua.song_publishing_agreement_accepted_at IS NULL;
