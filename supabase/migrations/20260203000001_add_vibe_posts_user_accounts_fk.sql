-- Add foreign key from vibe_posts to user_accounts for PostgREST joins
-- This enables the API to do: select *, user:user_accounts!vibe_posts_user_id_user_accounts_fkey(...)

-- First, drop the existing FK to auth.users (we'll keep user_accounts as the source of truth)
-- Note: We keep the auth.users FK for cascade deletes, so we add a NEW FK to user_accounts

-- Add FK from vibe_posts.user_id to user_accounts.id
ALTER TABLE public.vibe_posts
ADD CONSTRAINT vibe_posts_user_id_user_accounts_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_accounts(id) ON DELETE CASCADE;

-- Add FK from vibe_comments.user_id to user_accounts.id  
ALTER TABLE public.vibe_comments
ADD CONSTRAINT vibe_comments_user_id_user_accounts_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_accounts(id) ON DELETE CASCADE;

-- Add FK from vibe_hearts.user_id to user_accounts.id
ALTER TABLE public.vibe_hearts
ADD CONSTRAINT vibe_hearts_user_id_user_accounts_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_accounts(id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT vibe_posts_user_id_user_accounts_fkey ON public.vibe_posts 
IS 'FK to user_accounts for PostgREST joins - enables fetching user profile with posts';

COMMENT ON CONSTRAINT vibe_comments_user_id_user_accounts_fkey ON public.vibe_comments 
IS 'FK to user_accounts for PostgREST joins - enables fetching user profile with comments';

COMMENT ON CONSTRAINT vibe_hearts_user_id_user_accounts_fkey ON public.vibe_hearts 
IS 'FK to user_accounts for PostgREST joins - enables fetching user profile with hearts';
