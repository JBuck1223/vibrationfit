-- Weekly MAP Builder: user_maps + user_map_items
-- Versioned weekly activation plans with SMS notification scheduling
-- Uses is_active / is_draft boolean pattern (matches vision_versions / user_profiles)

-- Enum for CACS categories
DO $$ BEGIN
  CREATE TYPE public.map_category AS ENUM ('creations', 'activations', 'connections', 'sessions');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- user_maps: versioned weekly plans
CREATE TABLE public.user_maps (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.user_accounts(id) ON DELETE CASCADE,
    title text NOT NULL,
    is_draft boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    week_start_date date,
    version_number integer DEFAULT 1 NOT NULL,
    timezone text DEFAULT 'America/New_York' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.user_maps IS 'Versioned weekly activation plans (MAPs) for users';
COMMENT ON COLUMN public.user_maps.is_draft IS 'True while the MAP is being built, false once saved/activated';
COMMENT ON COLUMN public.user_maps.is_active IS 'True for the current active MAP. Only one active per user.';
COMMENT ON COLUMN public.user_maps.timezone IS 'IANA timezone for notification scheduling';

CREATE INDEX idx_user_maps_user_id ON public.user_maps(user_id);
CREATE INDEX idx_user_maps_active ON public.user_maps(user_id) WHERE (is_active = true AND is_draft = false);

-- user_map_items: individual activities within a MAP
CREATE TABLE public.user_map_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    map_id uuid NOT NULL REFERENCES public.user_maps(id) ON DELETE CASCADE,
    category public.map_category NOT NULL,
    activity_type text NOT NULL,
    label text NOT NULL,
    days_of_week integer[] DEFAULT '{}'::integer[] NOT NULL,
    time_of_day time without time zone,
    notify_sms boolean DEFAULT false NOT NULL,
    deep_link text,
    notes text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.user_map_items IS 'Individual activities within a weekly MAP';
COMMENT ON COLUMN public.user_map_items.days_of_week IS '0=Sunday through 6=Saturday';

CREATE INDEX idx_user_map_items_map_id ON public.user_map_items(map_id);

-- RLS policies
ALTER TABLE public.user_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_map_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own maps"
    ON public.user_maps FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own maps"
    ON public.user_maps FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maps"
    ON public.user_maps FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maps"
    ON public.user_maps FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view items of their own maps"
    ON public.user_map_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_maps
        WHERE user_maps.id = user_map_items.map_id
        AND user_maps.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert items into their own maps"
    ON public.user_map_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_maps
        WHERE user_maps.id = user_map_items.map_id
        AND user_maps.user_id = auth.uid()
    ));

CREATE POLICY "Users can update items in their own maps"
    ON public.user_map_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.user_maps
        WHERE user_maps.id = user_map_items.map_id
        AND user_maps.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_maps
        WHERE user_maps.id = user_map_items.map_id
        AND user_maps.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete items from their own maps"
    ON public.user_map_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.user_maps
        WHERE user_maps.id = user_map_items.map_id
        AND user_maps.user_id = auth.uid()
    ));

-- Admin policies (service role bypasses RLS, but explicit admin policies for dashboard)
CREATE POLICY "Admins can view all maps"
    ON public.user_maps FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_accounts
        WHERE user_accounts.id = auth.uid()
        AND user_accounts.role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Admins can view all map items"
    ON public.user_map_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_accounts
        WHERE user_accounts.id = auth.uid()
        AND user_accounts.role IN ('admin', 'super_admin')
    ));

-- Function to calculate version number for a new map
CREATE OR REPLACE FUNCTION public.calculate_map_version_number(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  next_version integer;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM public.user_maps
  WHERE user_id = p_user_id;
  
  RETURN next_version;
END;
$$;

-- Trigger to auto-set version number on insert
CREATE OR REPLACE FUNCTION public.set_map_version_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.version_number := public.calculate_map_version_number(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_map_version_number
  BEFORE INSERT ON public.user_maps
  FOR EACH ROW
  EXECUTE FUNCTION public.set_map_version_number();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_user_maps_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_user_maps_updated_at
  BEFORE UPDATE ON public.user_maps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_maps_updated_at();
