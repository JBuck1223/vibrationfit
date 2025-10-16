-- Environment Sync Migration
-- Purpose: Bring local environment policies/triggers into alignment with production
-- Notes: This is a non-destructive sync. It does NOT create any tables.

DO $$
BEGIN
  -- Example: sync for an existing table if present (idempotent)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'generated_images'
  ) THEN

    -- Ensure RLS is enabled
    EXECUTE 'ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY';

    -- View policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'generated_images'
        AND policyname = 'Users can view their own generated images'
    ) THEN
      EXECUTE 'CREATE POLICY "Users can view their own generated images" ON public.generated_images FOR SELECT USING (auth.uid() = user_id)';
    ELSE
      EXECUTE 'ALTER POLICY "Users can view their own generated images" ON public.generated_images USING (auth.uid() = user_id)';
    END IF;

    -- Insert policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'generated_images'
        AND policyname = 'Users can create their own generated images'
    ) THEN
      EXECUTE 'CREATE POLICY "Users can create their own generated images" ON public.generated_images FOR INSERT WITH CHECK (auth.uid() = user_id)';
    ELSE
      EXECUTE 'ALTER POLICY "Users can create their own generated images" ON public.generated_images WITH CHECK (auth.uid() = user_id)';
    END IF;

    -- Update policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'generated_images'
        AND policyname = 'Users can update their own generated images'
    ) THEN
      EXECUTE 'CREATE POLICY "Users can update their own generated images" ON public.generated_images FOR UPDATE USING (auth.uid() = user_id)';
    ELSE
      EXECUTE 'ALTER POLICY "Users can update their own generated images" ON public.generated_images USING (auth.uid() = user_id)';
    END IF;

    -- Delete policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'generated_images'
        AND policyname = 'Users can delete their own generated images'
    ) THEN
      EXECUTE 'CREATE POLICY "Users can delete their own generated images" ON public.generated_images FOR DELETE USING (auth.uid() = user_id)';
    ELSE
      EXECUTE 'ALTER POLICY "Users can delete their own generated images" ON public.generated_images USING (auth.uid() = user_id)';
    END IF;

    -- Trigger function (idempotent)
    EXECUTE $$
      CREATE OR REPLACE FUNCTION public.update_generated_images_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    $$;

    -- Trigger: create only if missing
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'update_generated_images_updated_at'
        AND tgrelid = 'public.generated_images'::regclass
    ) THEN
      EXECUTE 'CREATE TRIGGER update_generated_images_updated_at BEFORE UPDATE ON public.generated_images FOR EACH ROW EXECUTE FUNCTION public.update_generated_images_updated_at()';
    END IF;
  END IF;
END $$;


