-- Fix vision_versions foreign key to reference auth.users instead of profiles
-- The vision_versions.user_id should reference auth.users(id), not profiles(id)

-- Drop the incorrect foreign key constraint
ALTER TABLE public.vision_versions
DROP CONSTRAINT IF EXISTS vision_versions_user_id_fkey;

-- Add the correct foreign key constraint to auth.users
ALTER TABLE public.vision_versions
ADD CONSTRAINT vision_versions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

