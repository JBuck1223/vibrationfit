-- Create the set_updated_at function used by various tables
CREATE OR REPLACE FUNCTION public.set_updated_at() 
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS 'Sets updated_at timestamp to now() before update triggers.';

