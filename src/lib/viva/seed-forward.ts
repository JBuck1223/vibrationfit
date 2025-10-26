// src/lib/viva/seed-forward.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { FORWARD_WARMUP_MD } from "./forward-warmup";

export async function ensureForwardWarmup(
  supabase: SupabaseClient,
  draftId: string
) {
  const { data: v, error } = await supabase
    .from("vision_versions")
    .select("id, forward, sources")
    .eq("id", draftId)
    .single();

  if (error || !v) return;

  const already = (v.forward ?? "").trim().length > 0;
  if (already) return;

  const newSources = { ...(v.sources as any ?? {}), forward_is_warmup: true };
  await supabase
    .from("vision_versions")
    .update({ forward: FORWARD_WARMUP_MD, sources: newSources })
    .eq("id", draftId);
}
