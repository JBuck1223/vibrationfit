import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CATS = [
  "forward","fun","travel","home","family","romance","health",
  "money","business","social","possessions","giving","spirituality","conclusion"
] as const;

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find latest draft
  const { data: latest, error } = await supabase
    .from("vision_versions")
    .select("*")
    .eq("user_id", userId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  if (error || !latest) return NextResponse.json({ error: error?.message || "No vision draft found" }, { status: 400 });

  // Verify completeness (all 14 present)
  const missing = CATS.filter(c => !((latest as any)[c] ?? "").trim());
  if (missing.length) {
    return NextResponse.json({ error: "Some categories are still empty", missing }, { status: 400 });
  }

  const { data, error: e2 } = await supabase
    .from("vision_versions")
    .update({ status: "complete", completion_percent: 100 })
    .eq("id", latest.id)
    .select("*")
    .single();

  if (e2) return NextResponse.json({ error: e2.message }, { status: 400 });
  return NextResponse.json({ vision: data });
}
