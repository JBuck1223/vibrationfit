-- Song Publishing Requests: tracks submitted for publishing under Vibration Fit

CREATE TABLE public.song_publish_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    track_id uuid NOT NULL REFERENCES public.song_tracks(id) ON DELETE CASCADE,
    songwriter_legal_name text NOT NULL,
    royalty_split_percent integer DEFAULT 50 NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    admin_notes text,
    reviewed_by uuid REFERENCES auth.users(id),
    reviewed_at timestamptz,
    agreement_accepted_at timestamptz DEFAULT now() NOT NULL,
    agreement_version text DEFAULT '1.0' NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT spr_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'published'))
);

CREATE INDEX idx_spr_user ON public.song_publish_requests(user_id);
CREATE INDEX idx_spr_status ON public.song_publish_requests(status);

-- Only one active request per track (pending/approved/published). Rejected tracks can resubmit.
CREATE UNIQUE INDEX idx_spr_track_unique ON public.song_publish_requests(track_id)
    WHERE status IN ('pending', 'approved', 'published');

-- RLS
ALTER TABLE public.song_publish_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own publish requests"
    ON public.song_publish_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own publish requests"
    ON public.song_publish_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to publish requests"
    ON public.song_publish_requests FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Updated_at trigger (reuses the existing function from songs table)
CREATE TRIGGER spr_updated_at
    BEFORE UPDATE ON public.song_publish_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_songs_updated_at();
