-- Add parent_id column to track draft lineage
-- When a draft is cloned from an active vision, we store the parent's ID
-- This allows us to find existing drafts when clicking "Refine" again

ALTER TABLE public.vision_versions
ADD COLUMN parent_id UUID REFERENCES public.vision_versions(id) ON DELETE SET NULL;

CREATE INDEX idx_vision_versions_parent_id ON public.vision_versions(parent_id);
CREATE INDEX idx_vision_versions_parent_draft_lookup ON public.vision_versions(parent_id, is_draft) WHERE is_draft = true;

COMMENT ON COLUMN public.vision_versions.parent_id IS 
'ID of the vision this was cloned from. Used to find existing drafts when refining an active vision.';



