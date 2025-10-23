-- Check and fix vision_versions table permissions
-- Run this in Supabase SQL editor to diagnose and fix permission issues

-- Check if vision_versions table exists and has proper RLS policies
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'vision_versions';

-- Check existing policies on vision_versions table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'vision_versions';

-- Check grants on vision_versions table
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'vision_versions';

-- Add missing policies if they don't exist
-- Users can view their own vision versions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vision_versions' 
        AND policyname = 'Users can view their own vision versions'
    ) THEN
        CREATE POLICY "Users can view their own vision versions" ON vision_versions
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can insert their own vision versions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vision_versions' 
        AND policyname = 'Users can insert their own vision versions'
    ) THEN
        CREATE POLICY "Users can insert their own vision versions" ON vision_versions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Users can update their own vision versions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vision_versions' 
        AND policyname = 'Users can update their own vision versions'
    ) THEN
        CREATE POLICY "Users can update their own vision versions" ON vision_versions
            FOR UPDATE USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Users can delete their own vision versions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vision_versions' 
        AND policyname = 'Users can delete their own vision versions'
    ) THEN
        CREATE POLICY "Users can delete their own vision versions" ON vision_versions
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE vision_versions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON vision_versions TO authenticated;
GRANT ALL ON vision_versions TO service_role;
